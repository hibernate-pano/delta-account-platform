import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import {
  useMessageSessions, useSessionMessages, useSendMessage, useCreateSession
} from '../hooks/useQueries';
import {
  MessageCircle, Send, User, ArrowLeft, RefreshCw, MessageSquare,
  Check, CheckCheck, Clock, Wifi, WifiOff, Circle
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
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();

  const accountId = searchParams.get('accountId');
  const sellerId = searchParams.get('sellerId');

  const { data: sessionsData, isLoading: sessionsLoading } = useMessageSessions();
  const sessions: Session[] = sessionsData?.data?.data || [];

  const currentSessionId = sessionId ? parseInt(sessionId) : null;
  const { data: messagesData, isLoading: messagesLoading, refetch } = useSessionMessages(currentSessionId!);
  const messages: Message[] = messagesData?.data?.data || [];

  const sendMessageMutation = useSendMessage();
  const createSessionMutation = useCreateSession();

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll messages every 5s when in chat
  useEffect(() => {
    if (!currentSessionId) return;
    pollRef.current = setInterval(() => refetch(), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [currentSessionId, refetch]);

  useEffect(() => {
    if (!token) { navigate('/login'); }
  }, [token, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, messages[messages.length - 1]?.id]);

  // Simulate "other user typing" when we send a message
  useEffect(() => {
    if (sendMessageMutation.isSuccess) {
      setIsTyping(true);
      const t = setTimeout(() => setIsTyping(false), 2000 + Math.random() * 2000);
      return () => clearTimeout(t);
    }
  }, [sendMessageMutation.isSuccess]);

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
    const currentSession = sessions.find((s) => s.id === parseInt(sessionId));

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
      <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 200px)', maxHeight: '800px' }}>
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
              <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">
                {currentSession?.otherUser?.nickname ||
                  currentSession?.otherUser?.username || '聊天'}
              </h1>
              {currentSession?.accountTitle && (
                <p className="text-xs text-slate-500 truncate">
                  订单: {currentSession.accountTitle}
                </p>
              )}
            </div>
          </div>
          {/* Connection status */}
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <Wifi className="w-3.5 h-3.5" />
            <span>在线</span>
          </div>
        </div>

        {/* Chat container */}
        <div className="card flex-1 flex flex-col bg-dark-darker border-dark-border overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messagesLoading ? (
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

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2 py-1">
                    <div className="w-7 h-7 flex-shrink-0 rounded-full bg-dark-lighter flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="bg-dark-lighter rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

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
                placeholder="输入消息..."
                className="input flex-1 !py-2.5 !px-4 bg-dark border-dark-border"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                className="btn-primary !px-5 !py-2.5 disabled:opacity-40 flex items-center gap-2"
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">消息中心</h1>
        {sessions.filter(s => s.unreadCount).length > 0 && (
          <span className="text-xs text-slate-500">
            {sessions.filter(s => s.unreadCount).length} 个未读会话
          </span>
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
              <MessageCircle className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-slate-400">暂无消息</h3>
            <p className="text-slate-600 text-sm mb-6">浏览账号并联系卖家开始对话</p>
            <button onClick={() => navigate('/accounts')} className="btn-primary">
              去逛逛
            </button>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/messages/${session.id}`)}
                className="py-4 px-4 flex items-center gap-3 cursor-pointer hover:bg-dark-lighter/60 transition-colors active:bg-dark-lighter"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  {session.unreadCount && session.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold leading-none">
                      {session.unreadCount > 9 ? '9+' : session.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
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

                {/* Unread dot */}
                {!session.unreadCount && (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
