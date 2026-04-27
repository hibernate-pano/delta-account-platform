import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { messageApi } from '../api';
import { Send, ArrowLeft, RefreshCw, MessageSquare, User, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { formatDistanceToNow } from '../utils/format';

interface ChatSession {
  id: number;
  accountId: number;
  buyerId: number;
  sellerId: number;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  sessionId: number;
  senderId: number;
  content: string;
  type: string;
  isRead: boolean;
  isRecalled?: boolean;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    nickname?: string;
    avatar?: string;
  };
}

const MessagesPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchSessions();
    // 定时刷新消息
    const interval = setInterval(() => {
      if (currentSession) {
        fetchMessages(currentSession.id);
      }
    }, 10000); // 10秒刷新一次
    return () => clearInterval(interval);
  }, [token, sessionId]);

  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === Number(sessionId));
      if (session) {
        setCurrentSession(session);
        fetchMessages(session.id);
      }
    }
  }, [sessionId, sessions]);

  const fetchSessions = async () => {
    try {
      const res = await messageApi.getSessions();
      setSessions(res.data.data || []);
      
      // 计算未读数
      let totalUnread = 0;
      for (const session of res.data.data || []) {
        const msgsRes = await messageApi.getSessionMessages(session.id);
        const msgs = msgsRes.data.data || [];
        totalUnread += msgs.filter((m: ChatMessage) => !m.isRead && m.senderId !== user?.id).length;
      }
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sid: number) => {
    try {
      const res = await messageApi.getSessionMessages(sid);
      setMessages(res.data.data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentSession) return;
    
    setSending(true);
    try {
      await messageApi.sendMessage(currentSession.id, { content: newMessage.trim() });
      setNewMessage('');
      fetchMessages(currentSession.id);
    } catch (error: any) {
      toast('error', error.response?.data?.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    try {
      return formatDistanceToNow(time);
    } catch {
      return time;
    }
  };

  const getOtherUserName = (session: ChatSession) => {
    if (user?.id === session.buyerId) {
      return `卖家 ${session.sellerId}`;
    }
    return `买家 ${session.buyerId}`;
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  // 会话列表视图
  if (!sessionId) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          消息中心
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </h1>

        {sessions.length === 0 ? (
          <div className="card text-center py-16">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500 mb-4">暂无消息记录</p>
            <p className="text-sm text-slate-600">
              在账号详情页点击"联系卖家"即可发起对话
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/messages/${session.id}`)}
                className="card cursor-pointer hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-dark-darker rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{getOtherUserName(session)}</p>
                      <span className="text-xs text-slate-500">
                        {formatTime(session.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate mt-1">
                      {session.lastMessage || '暂无消息'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 聊天视图
  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{getOtherUserName(currentSession!)}</h2>
          <p className="text-xs text-slate-500">账号 #{currentSession?.accountId}</p>
        </div>
        <button
          onClick={() => fetchMessages(currentSession!.id)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="刷新"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500">暂无消息，开始对话吧</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isMe
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-dark-darker text-slate-200 rounded-bl-sm'
                    } ${message.isRecalled ? 'opacity-50 italic' : ''}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className={`text-xs text-slate-600 mt-1 ${isMe ? 'text-right' : ''}`}>
                    {formatTime(message.createdAt)}
                    {isMe && message.isRead && ' · 已读'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-3 pt-4 border-t border-slate-800">
        <div className="flex-1 relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            rows={1}
            className="input w-full resize-none bg-dark-darker max-h-32"
            style={{ minHeight: '44px', maxHeight: '128px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className="btn-primary p-3 disabled:opacity-50"
        >
          {sending ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
        <span>按 Enter 发送</span>
        <span>·</span>
        <span>Shift+Enter 换行</span>
      </div>
    </div>
  );
};

export default MessagesPage;