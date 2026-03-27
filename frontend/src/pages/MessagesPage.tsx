import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import {
  useMessageSessions, useSessionMessages, useSendMessage, useCreateSession, useAccount
} from '../hooks/useQueries';
import { messageApi } from '../api';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  MessageCircle, Send, User, ArrowLeft, RefreshCw, MessageSquare,
  Check, CheckCheck, Clock, Wifi, WifiOff, Circle, Search, X, Gamepad2, ArrowRight, Star, AlertCircle
} from 'lucide-react';

interface Session {
  id: number;
  accountId: number;
  buyerId: number;
  sellerId: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
  accountTitle?: string;
  otherUser?: {
    id: number;
    nickname: string;
    username: string;
    creditScore?: number;
    avatar?: string;
  };
}

interface Message {
  id: number;
  sessionId: number;
  senderId: number;
  content: string;
  type: string;
  isRead: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDay.getTime() === today.getTime()) return '今天';
  if (msgDay.getTime() === yesterday.getTime()) return '昨天';
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
};

const formatSessionTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const StatusIcon: React.FC<{ status?: string; isMe: boolean }> = ({ status, isMe }) => {
  if (!isMe) return null;
  if (status === 'sending') return <Clock className="w-3 h-3 text-slate-500" />;
  if (status === 'sent') return <Check className="w-3 h-3 text-slate-500" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-slate-500" />;
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-400" />;
  return null;
};

const MessagesPage: React.FC = () => {
  usePageTitle('私信聊天');
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const accountId = searchParams.get('accountId');
  const sellerId = searchParams.get('sellerId');
  const [sessionSearch, setSessionSearch] = useState('');

  const { data: sessionsData, isLoading: sessionsLoading, isError: sessionsError, refetch: refetchSessions } = useMessageSessions();
  const sessions: Session[] = sessionsData?.data?.data || [];
  const currentSession = sessionId ? sessions.find((s) => s.id === parseInt(sessionId)) : undefined;
  const { data: accountData } = useAccount(currentSession?.accountId ?? null);
  const account = accountData?.data?.data;
  const filteredSessions = sessions.filter((s) =>
    !sessionSearch.trim()
      ? true
      : (s.otherUser?.nickname || s.otherUser?.username || '').toLowerCase().includes(sessionSearch.toLowerCase()) ||
        (s.accountTitle || '').toLowerCase().includes(sessionSearch.toLowerCase()) ||
        (s.lastMessage || '').toLowerCase().includes(sessionSearch.toLowerCase())
  );
  const unreadCount = sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);

  // Session list content
  const sessionListContent = useMemo(() => {
    if (sessionsError) {
      return (
        <div className="text-center py-10">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-3">加载会话列表失败</p>
          <button onClick={() => refetchSessions()} className="text-primary text-sm hover:underline">重新加载</button>
        </div>
      );
    }
    if (filteredSessions.length === 0 && sessionSearch) {
      return (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">未找到匹配的会话</p>
          <button onClick={() => setSessionSearch('')} className="text-primary text-sm mt-2 hover:underline">清除搜索</button>
        </div>
      );
    }
    if (filteredSessions.length === 0) {
      return (
        <div className="text-center py-10">
          <MessageCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-600 text-sm">暂无会话</p>
        </div>
      );
    }
    return filteredSessions.map((session) => (
      <div
        key={session.id}
        onClick={() => navigate(`/messages/${session.id}`)}
        className="py-4 px-4 flex items-center gap-3 cursor-pointer hover:bg-dark-lighter/60 transition-colors active:bg-dark-lighter"
      >
        <div className="relative flex-shrink-0">
          {session.otherUser?.avatar ? (
            <img src={session.otherUser.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          )}
          {session.unreadCount && session.unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold leading-none">
              {session.unreadCount > 9 ? '9+' : session.unreadCount}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={`font-medium truncate text-sm ${session.unreadCount ? 'text-white' : 'text-slate-300'}`}>
              {session.otherUser?.nickname || session.otherUser?.username || '用户'}
            </p>
            <span className="text-xs text-slate-600 flex-shrink-0 ml-2">
              {formatSessionTime(session.lastMessageAt)}
            </span>
          </div>
          {session.accountTitle && (
            <p className="text-[11px] text-primary/70 mb-0.5 truncate">
              账号: {session.accountTitle}
            </p>
          )}
          <p className={`text-xs truncate ${session.unreadCount ? 'text-slate-300' : 'text-slate-500'}`}>
            {session.lastMessage || '暂无消息'}
          </p>
        </div>
        {!session.unreadCount && (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />
        )}
      </div>
    ));
  }, [filteredSessions, sessionSearch, navigate]);

  const currentSessionId = sessionId ? parseInt(sessionId) : null;
  const { data: messagesData, isLoading: messagesLoading, isError: messagesError, refetch } = useSessionMessages(currentSessionId!);
  const messages: Message[] = messagesData?.data?.data || [];

  const sendMessageMutation = useSendMessage();
  const createSessionMutation = useCreateSession();

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll messages every 5s when in chat
  useEffect(() => {
    if (!currentSessionId) return;
    pollRef.current = setInterval(() => refetch(), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [currentSessionId, refetch]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (!currentSessionId) return;
    messageApi.markAsRead(currentSessionId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['messageSessions'] }))
      .catch(() => {});
  }, [currentSessionId, queryClient]);

  useEffect(() => {
    if (!token) { navigate('/login'); }
  }, [token, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, messages[messages.length - 1]?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId) return;
    const content = newMessage;
    setNewMessage('');

    // Optimistically add message
    try {
      await sendMessageMutation.mutateAsync({
        sessionId: parseInt(sessionId),
        content,
      });
      refetch();
    } catch {
      showToast('发送失败，请重试', 'error');
    }
  };

  const handleStartChat = async () => {
    if (!accountId || !sellerId) return;
    try {
      const res = await createSessionMutation.mutateAsync({
        accountId: parseInt(accountId),
        sellerId: parseInt(sellerId),
      });
      showToast('会话已创建，正在跳转...', 'success');
      navigate(`/messages/${res.data.data.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || '创建会话失败', 'error');
    }
  };

  if (!token) return null;

  // --- Chat View ---
  if (sessionId) {

    // Group messages by date
    const groupedMessages: { date: string; messages: Message[] }[] = [];
    let lastDate = '';
    for (const msg of messages) {
      const d = new Date(msg.createdAt).toDateString();
      if (d !== lastDate) {
        groupedMessages.push({ date: msg.createdAt, messages: [msg] });
        lastDate = d;
      } else {
        groupedMessages[groupedMessages.length - 1].messages.push(msg);
      }
    }

    return (
      <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100dvh - 200px)', maxHeight: '800px' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/messages')}
            className="btn-ghost p-2 hover:bg-dark-lighter transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {currentSession?.otherUser?.avatar ? (
                <img src={currentSession.otherUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              )}
              {/* Status dot — no real-time presence data from backend, use neutral */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-600 rounded-full border-2 border-dark" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">
                {currentSession?.otherUser?.nickname ||
                  currentSession?.otherUser?.username || '聊天'}
              </h1>
              {currentSession?.accountTitle && (
                <div className="flex items-center gap-2 truncate">
                  {account?.gameType && (
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] flex-shrink-0">
                      {account.gameType}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 truncate">
                    账号: {currentSession.accountTitle}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Connection status — no real-time presence data from backend */}
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Wifi className="w-3.5 h-3.5" />
            <span>私信</span>
          </div>
        </div>

        {/* Account Preview Card */}
        {account && (
          <Link
            to={`/accounts/${account.id}`}
            className="mb-4 p-3 bg-gradient-to-r from-dark-card to-dark-lighter border border-dark-border rounded-xl flex items-center gap-3 hover:border-primary/40 transition-colors group"
          >
            {account.images?.[0] ? (
              <img src={account.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                {account.title}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-yellow-400" />
                  {account.sellerCreditScore || '—'}
                </span>
                <span className="text-xs text-slate-500">{account.gameRank || '暂无段位'}</span>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">🎨 {account.skinCount}皮肤</span>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              <span className="text-primary font-bold">¥{account.price}</span>
              {account.rentalPrice && (
                <span className="text-xs text-purple-400">租¥{account.rentalPrice}/时</span>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors flex-shrink-0" />
          </Link>
        )}

        {/* Chat container */}
        <div className="card flex-1 flex flex-col bg-dark-darker border-dark-border overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messagesError ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <p className="text-slate-400 mb-1">消息加载失败</p>
                <p className="text-slate-600 text-xs mb-4">无法获取消息记录</p>
                <button
                  onClick={() => refetch()}
                  className="btn-ghost text-sm inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 重试
                </button>
              </div>
            ) : messagesLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-14 h-14 text-slate-700 mb-3" />
                <p className="text-slate-500 mb-1">暂无消息</p>
                <p className="text-slate-600 text-xs">发送消息开始对话</p>
              </div>
            ) : (
              <>
                {groupedMessages.map((group, gi) => (
                  <div key={gi}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-dark-border" />
                      <span className="text-xs text-slate-600 px-2 py-0.5 bg-dark rounded-full">
                        {formatDateSeparator(group.date)}
                      </span>
                      <div className="flex-1 h-px bg-dark-border" />
                    </div>
                    {group.messages.map((msg, mi) => {
                      const isMe = msg.senderId === user?.id;
                      const prevMsg = mi > 0 ? group.messages[mi - 1] : (gi > 0 ? groupedMessages[gi - 1].messages.at(-1) : null);
                      const showAvatar = !isMe && (mi === 0 || prevMsg?.senderId !== msg.senderId);

                      return (
                        <div key={msg.id} className="flex items-end gap-2 py-1 group">
                          {!isMe && (
                            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-dark-lighter flex items-center justify-center overflow-hidden">
                              {showAvatar ? (
                                <User className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <span className="text-[8px] text-slate-600">·</span>
                              )}
                            </div>
                          )}
                          <div className={`max-w-[72%] ${isMe ? 'ml-auto' : ''}`}>
                            {/* Bubble */}
                            <div
                              className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                isMe
                                  ? 'bg-gradient-to-br from-primary to-purple-600 text-white rounded-br-sm'
                                  : 'bg-dark-lighter text-white rounded-bl-sm'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            {/* Time + status */}
                            <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-600 ${isMe ? 'justify-end' : ''}`}>
                              <span>{formatTime(msg.createdAt)}</span>
                              {isMe && <StatusIcon status={msg.status} isMe={isMe} />}
                            </div>
                          </div>
                          {isMe && (
                            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                              <User className="w-3.5 h-3.5 text-primary" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                <div ref={messagesEndRef} className="h-4" />
              </>
            )}
          </div>

          {/* Input bar */}
          <div className="border-t border-dark-border p-3 bg-dark/50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={sendMessageMutation.isPending ? '发送中...' : '输入消息...'}
                disabled={sendMessageMutation.isPending}
                className="input flex-1 !py-2.5 !px-4 bg-dark border-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                className="btn-primary !px-5 !py-2.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-150 active:scale-90"
              >
                {sendMessageMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- Session List View ---
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">消息中心</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="inline-flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-[10px] text-white mr-1">{unreadCount}</span>
              条未读消息
            </p>
          )}
        </div>
        <Link to="/accounts" className="btn-secondary flex items-center gap-2 text-sm">
          <MessageCircle className="w-4 h-4" />
          新会话
        </Link>
      </div>

      {/* Session Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={sessionSearch}
          onChange={(e) => setSessionSearch(e.target.value)}
          placeholder="搜索会话..."
          className="input w-full !pl-10 !py-2.5 !text-sm"
        />
        {sessionSearch && (
          <button
            onClick={() => setSessionSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {accountId && sellerId && (
        <div className="card mb-5 bg-gradient-to-r from-primary/8 to-purple-500/5 border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-0.5">想要联系卖家？</p>
              <p className="text-sm text-slate-500">点击按钮立即开始沟通</p>
            </div>
            <button
              onClick={handleStartChat}
              disabled={createSessionMutation.isPending}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {createSessionMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              开始聊天
            </button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {sessionsLoading ? (
          <div className="space-y-1 p-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 skeleton rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-28 skeleton rounded mb-2" />
                  <div className="h-3 w-48 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-slate-600" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M4 16L20 28L36 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
                <circle cx="18" cy="22" r="1.5" fill="currentColor"/>
                <circle cx="24" cy="22" r="1.5" fill="currentColor"/>
                <rect x="24" y="4" width="20" height="14" rx="3" fill="#1e293b" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M28 8h12M28 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2 text-slate-400">暂无会话</h3>
            <p className="text-slate-600 text-sm mb-6">浏览账号并联系卖家开始对话</p>
            <button onClick={() => navigate('/accounts')} className="btn-primary">
              去逛逛
            </button>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {sessionListContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
