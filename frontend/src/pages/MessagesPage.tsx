import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { messageApi } from '../api';
import { useAuthStore } from '../store/auth';
import { MessageCircle, Send, User, ArrowLeft, RefreshCw } from 'lucide-react';

interface Session {
  id: number;
  accountId: number;
  buyerId: number;
  sellerId: number;
  lastMessage: string;
  lastMessageAt: string;
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

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const fetchSessions = async () => {
    try {
      const res = await messageApi.getSessions();
      setSessions(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
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
      fetchMessages(parseInt(sessionId));
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = async () => {
    if (!accountId || !sellerId) return;
    try {
      const res = await messageApi.createSession({
        accountId: parseInt(accountId),
        sellerId: parseInt(sellerId)
      });
      navigate(`/messages/${res.data.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || '创建会话失败');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  if (sessionId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">聊天</h1>
        </div>

        <div className="card h-[600px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMe ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block px-4 py-2 rounded-2xl ${
                      isMe 
                        ? 'bg-primary text-white rounded-br-md' 
                        : 'bg-dark-lighter text-white rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(msg.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-slate-800 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="btn-primary px-6 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">消息中心</h1>

      {accountId && sellerId && (
        <div className="card mb-6">
          <p className="text-slate-400 mb-4">开始与卖家沟通</p>
          <button onClick={handleStartChat} className="btn-primary">
            <MessageCircle className="w-5 h-5 mr-2" />
            开始聊天
          </button>
        </div>
      )}

      <div className="card">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500">暂无消息</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/messages/${session.id}`)}
                className="py-4 flex items-center gap-4 cursor-pointer hover:bg-dark-lighter transition-colors -mx-4 px-4"
              >
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {session.otherUser?.nickname || session.otherUser?.username || '用户'}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {session.lastMessage || '暂无消息'}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {session.lastMessageAt ? new Date(session.lastMessageAt).toLocaleDateString('zh-CN') : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
