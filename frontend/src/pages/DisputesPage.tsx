import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { disputeApi } from '../api';
import type { Dispute } from '../types';
import { AlertTriangle, RefreshCw, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const DisputesPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDisputes();
  }, [token]);

  const fetchDisputes = async () => {
    try {
      const res = await disputeApi.getMy();
      setDisputes(res.data.data.records || []);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
      toast('error', '加载纠纷列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (disputeId: number) => {
    if (!confirm('确定要取消此纠纷吗？')) return;
    setActionLoading(disputeId);
    try {
      await disputeApi.cancel(disputeId);
      toast('success', '纠纷已取消');
      fetchDisputes();
    } catch (error: unknown) {
      const errMsg = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : '取消失败';
      toast('error', errMsg || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'OPEN': { bg: 'bg-yellow-500/20 text-yellow-500', text: '待处理', icon: <Clock className="w-3 h-3" /> },
      'UNDER_REVIEW': { bg: 'bg-blue-500/20 text-blue-500', text: '审核中', icon: <Clock className="w-3 h-3" /> },
      'MEDIATING': { bg: 'bg-purple-500/20 text-purple-500', text: '调解中', icon: <AlertTriangle className="w-3 h-3" /> },
      'RESOLVED': { bg: 'bg-green-500/20 text-green-500', text: '已解决', icon: <CheckCircle className="w-3 h-3" /> },
      'REJECTED': { bg: 'bg-slate-500/20 text-slate-500', text: '已撤销', icon: <XCircle className="w-3 h-3" /> },
    };
    const item = config[status] || { bg: 'bg-slate-500/20', text: status, icon: null };
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${item.bg}`}>
        {item.icon}
        {item.text}
      </span>
    );
  };

  // 获取原因显示
  const getReasonText = (reason: string) => {
    const reasons: Record<string, string> = {
      'ACCOUNT_NOT_AS_DESCRIBED': '账号与描述不符',
      'ACCOUNT_RECOVERY': '账号找回',
      'NOT_RECEIVED': '未收到账号',
      'FRAUD': '欺诈',
      'OTHER': '其他',
    };
    return reasons[reason] || reason;
  };

  // 获取解决结果显示
  const getResolutionText = (resolution: string) => {
    const resolutions: Record<string, string> = {
      'FULL_REFUND': '全额退款',
      'PARTIAL_REFUND': '部分退款',
      'RELEASE_TO_SELLER': '打款给卖家',
      'CANCELLED': '已撤销',
    };
    return resolutions[resolution] || resolution;
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">我的纠纷</h1>
        <span className="text-sm text-slate-500">
          共 {disputes.length} 条纠纷记录
        </span>
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-500 mb-4">暂无纠纷记录</p>
          <p className="text-sm text-slate-600">
            如果交易过程中遇到问题，可以在订单详情页发起纠纷
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="card hover:border-primary/50 transition-colors"
            >
              {/* 纠纷头部 */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{dispute.disputeNo}</span>
                      {getStatusBadge(dispute.status)}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      订单 #{dispute.orderId} · {getReasonText(dispute.reason)}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      发起时间: {dispute.createdAt}
                    </p>
                  </div>
                </div>
              </div>

              {/* 纠纷描述 */}
              <div className="mt-4 p-3 bg-dark-darker rounded-lg">
                <p className="text-sm text-slate-400">{dispute.description}</p>
                {dispute.evidenceImages && dispute.evidenceImages.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">证据图片:</span>
                    <div className="flex gap-1">
                      {dispute.evidenceImages.slice(0, 3).map((img, idx) => (
                        <span key={idx} className="text-xs text-primary">[{idx + 1}]</span>
                      ))}
                      {dispute.evidenceImages.length > 3 && (
                        <span className="text-xs text-slate-500">...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 解决结果 */}
              {dispute.status === 'RESOLVED' && dispute.resolution && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-400">处理结果</span>
                    <span className="text-sm font-medium text-green-400">
                      {getResolutionText(dispute.resolution)}
                    </span>
                  </div>
                  {dispute.adminRemark && (
                    <p className="text-xs text-slate-500 mt-2">
                      备注: {dispute.adminRemark}
                    </p>
                  )}
                </div>
              )}

              {/* 操作区 */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  你是纠纷的 {user?.id === dispute.initiatorId ? '发起方' : '被投诉方'}
                </div>
                <div className="flex items-center gap-2">
                  {dispute.status === 'OPEN' && user?.id === dispute.initiatorId && (
                    <button
                      onClick={() => handleCancel(dispute.id)}
                      disabled={actionLoading === dispute.id}
                      className="btn-ghost text-sm py-1.5 text-slate-400"
                    >
                      {actionLoading === dispute.id ? '处理中...' : '取消纠纷'}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/user/orders/${dispute.orderId}`)}
                    className="btn-primary text-sm py-1.5"
                  >
                    查看订单
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisputesPage;