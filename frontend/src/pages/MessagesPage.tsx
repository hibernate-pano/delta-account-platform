import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { messageApi } from '../api';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { MessageCircle, Send, User, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react';

interface Session {
  id: number;
  accountId: number;
  buyerId: number;
  sellerId: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
  otherUser?: {
    id: number;
    nickname: string;
    username: string;
  };
}

interface Message {
  id: number;
  sessionId: number;
  senderId: number;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingSessionId, setSendingSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accountId = searchParams.get('accountId');
  const sellerId = searchParams.get('sellerId');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (sessionId) {
      fetchMessages(parseInt(sessionId));
    } else {
      fetchSessions();
    }
  }, [token, sessionId]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Poll for new messages when in chat
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      fetchMessages(parseInt(sessionId));
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchSessions = async () => {
    try {
      const res = await messageApi.getSessions();
      setSessions(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      showToast('加载消息列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: number) => {
    try {
      setLoading(true);
      const res = await messageApi.getSessionMessages(id);
      setMessages(res.data.data || []);
      await messageApi.markAsRead(id);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId) return;

    setSending(true);
    try {
      await messageApi.sendMessage(parseInt(sessionId), { content: newMessage });
      setNewMessage('');
      await fetchMessages(parseInt(sessionId));
      inputRef.current?.focus();
    } catch (error) {
      showToast('发送消息失败', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = async () => {
    if (!accountId || !sellerId) return;
    setSendingSessionId(parseInt(accountId));
    try {
      const res = await messageApi.createSession({
        accountId: parseInt(accountId),
        sellerId: parseInt(sellerId)
      });
      showToast('会话已创建，正在跳转...', 'success');
      navigate(`/messages/${res.data.data.id}`);
    } catch (error: any) {
      showToast(error.response?.data?.message || '创建会话失败', 'error');
    } finally {
      setSendingSessionId(null);
    }
  };

  if (loading && !sessionId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">消息中心</h1>
        <div className="card">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 skeleton rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 skeleton rounded mb-2" />
                  <div className="h-3 w-40 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sessionId) {
    const currentSession = sessions.find((s) => s.id === parseInt(sessionId));

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/messages')}
            className="btn-ghost p-2 hover:bg-dark-lighter transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {currentSession?.otherUser?.nickname || currentSession?.otherUser?.username || '聊天'}
              </h1>
            </div>
          </div>
        </div>

        <div className="card h-[600px] flex flex-col bg-dark-darker border-dark-border">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-16 h-16 text-slate-700 mb-4" />
                <p className="text-slate-500 mb-2">暂无消息</p>
                <p className="text-slate-600 text-sm">发送消息开始对话</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  const showTime =
                    idx === 0 ||
                    new Date(msg.createdAt).getTime() -
                      new Date(messages[idx - 1].createdAt).getTime() >
                      300000; // 5 min
                  return (
                    <React.Fragment key={msg.id}>
                      {showTime && (
                        <div className="text-center text-xs text-slate-600 py-2">
                          {formatRelativeTime(msg.createdAt)}
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        {!isMe && (
                          <div className="w-8 h-8 bg-dark-lighter rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div className={`max-w-[70%] ${isMe ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block px-4 py-3 rounded-2xl ${
                            isMe
                              ? 'bg-primary text-white rounded-br-md'
                              : 'bg-dark-lighter text-white rounded-bl-md'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                        {isMe && (
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-dark-border p-4">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
                className="input flex-1 bg-dark border-dark-border"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="btn-primary px-6 disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    发送
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Session List
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">消息中心</h1>

      {accountId && sellerId && (
        <div className="card mb-6 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">想要联系卖家？</p>
              <p className="text-sm text-slate-500">点击按钮立即开始沟通</p>
            </div>
            <button
              onClick={handleStartChat}
              disabled={!!sendingSessionId}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {sendingSessionId ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
              开始聊天
            </button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
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
                className="py-4 px-4 flex items-center gap-4 cursor-pointer hover:bg-dark-lighter/50 transition-colors"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  {session.unreadCount && session.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                      {session.unreadCount > 9 ? '9+' : session.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium truncate ${session.unreadCount ? 'text-white' : 'text-slate-300'}`}>
                      {session.otherUser?.nickname || session.otherUser?.username || '用户'}
                    </p>
                    <p className="text-xs text-slate-600 flex-shrink-0">
                      {session.lastMessageAt ? formatRelativeTime(session.lastMessageAt) : ''}
                    </p>
                  </div>
                  <p className={`text-sm truncate ${session.unreadCount ? 'text-slate-300' : 'text-slate-500'}`}>
                    {session.lastMessage || '暂无消息'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
