import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountApi, orderApi, reviewApi } from '../api';
import { Account, Review } from '../types';
import { useAuthStore } from '../store/auth';
import { FavoriteButton } from '../components/ui/FavoriteButton';
import { Gamepad2, User, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatPrice } from '../utils/format';
import { GridSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import SkeletonBase from '../components/ui/Skeleton';

// Confirmation Modal
const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  detail: string;
  amount: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, detail, amount, loading, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-lighter border border-gray-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-400 mb-4">{detail}</p>
        <div className="bg-dark rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-gray-400">支付金额</p>
          <p className="text-3xl font-bold text-primary">¥{formatPrice(amount)}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>取消</button>
          <button onClick={onConfirm} className="btn-primary flex-1" disabled={loading}>
            {loading ? '处理中...' : '确认支付'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  usePageTitle(account?.title || '账号详情');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rentHours, setRentHours] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    detail: string;
    amount: number;
    type: 'BUY' | 'RENT';
  }>({ open: false, title: '', detail: '', amount: 0, type: 'BUY' });

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await accountApi.getById(Number(id));
        setAccount(res.data.data);
        // 加载卖家评价
        if (res.data.data?.sellerId) {
          setReviewsLoading(true);
          try {
            const reviewsRes = await reviewApi.getUserReviews(res.data.data.sellerId);
            setReviews(reviewsRes.data.data || []);
          } catch (e) {
            // Silently fail - reviews are not critical
          } finally {
            setReviewsLoading(false);
          }
        }
      } catch (error: any) {
        toast('error', error.response?.data?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <CardSkeleton />
          <div className="space-y-4">
            <SkeletonBase className="h-8" />
            <SkeletonBase className="h-4 w-3/4" />
            <SkeletonBase className="h-4 w-1/2" />
            <SkeletonBase className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  const openBuyConfirm = () => {
    if (!token) { navigate('/login'); return; }
    if (!account) return;
    setConfirmModal({
      open: true,
      title: '确认购买',
      detail: `你即将购买 "${account.title}"，购买后账号将转移到你名下。`,
      amount: account.price,
      type: 'BUY',
    });
  };

  const openRentConfirm = () => {
    if (!token) { navigate('/login'); return; }
    if (!account || !account.rentalPrice) return;
    setConfirmModal({
      open: true,
      title: '确认租赁',
      detail: `你即将租赁 "${account.title}" ${rentHours} 小时。`,
      amount: account.rentalPrice * rentHours,
      type: 'RENT',
    });
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const res = await orderApi.create({
        accountId: Number(id),
        type: confirmModal.type,
        ...(confirmModal.type === 'RENT' ? { rentHours } : {}),
      });
      const orderId = res.data.data.id;
      await orderApi.pay(orderId);
      setConfirmModal(prev => ({ ...prev, open: false }));
      toast('success', confirmModal.type === 'BUY' ? '购买成功！' : '租赁成功！');
      navigate('/orders');
    } catch (error: any) {
      toast('error', error.response?.data?.message || '操作失败');
    } finally {
      setProcessing(false);
    }
  };

  if (!account) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <p className="text-gray-500">账号不存在</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images Gallery */}
        <div>
          <div className="aspect-video bg-dark rounded-xl overflow-hidden mb-3 relative group">
            {account.images && account.images.length > 0 ? (
              <>
                <img src={account.images[activeImage]} alt={account.title} className="w-full h-full object-cover" />
                {account.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage(i => (i - 1 + account.images!.length) % account.images!.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveImage(i => (i + 1) % account.images!.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 rounded-full px-2 py-1 text-xs text-white">
                      {activeImage + 1} / {account.images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gamepad2 className="w-20 h-20 text-gray-700" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <FavoriteButton accountId={account.id} />
            </div>
          </div>
          {/* Thumbnails */}
          {account.images && account.images.length > 1 && (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(account.images.length, 5)}, 1fr)` }}>
              {account.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === activeImage ? 'border-primary' : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold mb-4">{account.title}</h1>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
              {account.gameRank || '暂无段位'}
            </span>
            <span className="px-3 py-1 bg-dark-lighter text-gray-400 rounded-full text-sm">
              {account.skinCount} 皮肤
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              account.verificationStatus === 'VERIFIED'
                ? 'bg-green-500/20 text-green-500'
                : 'bg-yellow-500/20 text-yellow-500'
            }`}>
              {account.verificationStatus === 'VERIFIED' ? '已认证' : '待审核'}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-gray-400">售价</span>
              <span className="text-3xl font-bold text-primary">¥{formatPrice(account.price)}</span>
            </div>
            {account.rentalPrice && (
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">时租</span>
                <span className="text-xl font-semibold">¥{formatPrice(account.rentalPrice)}/小时</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={openBuyConfirm}
              disabled={account.status !== 'ON_SALE'}
              className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              立即购买
            </button>
            {account.rentalPrice && (
              <div className="flex gap-3">
                <select
                  value={rentHours}
                  onChange={(e) => setRentHours(Number(e.target.value))}
                  className="input flex-1"
                >
                  {[1, 2, 4, 8, 24, 72].map((h) => (
                    <option key={h} value={h}>{h} 小时</option>
                  ))}
                </select>
                <button
                  onClick={openRentConfirm}
                  disabled={account.status !== 'ON_SALE'}
                  className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  租 ¥{formatPrice(account.rentalPrice! * rentHours)}
                </button>
              </div>
            )}
          </div>

          {/* Seller Info */}
          {account.sellerUsername && (
            <div className="mt-6 p-4 bg-dark-lighter rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                    {account.sellerAvatar ? (
                      <img src={account.sellerAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{account.sellerNickname || account.sellerUsername}</p>
                    <p className="text-sm text-gray-500">卖家</p>
                  </div>
                </div>
                {account.sellerCreditScore != null && (
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      account.sellerCreditScore >= 90 ? 'text-green-500' :
                      account.sellerCreditScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {account.sellerCreditScore}
                    </p>
                    <p className="text-xs text-gray-500">信用分</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Seller Reviews */}
        {reviews.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">卖家评价</h3>
            <div className="space-y-3">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="p-3 bg-dark-lighter rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs text-primary">
                          {review.reviewer?.nickname?.[0] || review.reviewer?.username?.[0] || '?'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {review.reviewer?.nickname || review.reviewer?.username || '匿名用户'}
                      </span>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-500' : 'text-gray-600'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {review.content && (
                    <p className="text-sm text-gray-300">{review.content}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {review.createdAt?.replace('T', ' ').slice(0, 16)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {account.description && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">账号描述</h2>
          <div className="card">
            <p className="text-gray-300 whitespace-pre-wrap">{account.description}</p>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        detail={confirmModal.detail}
        amount={confirmModal.amount}
        loading={processing}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default AccountDetailPage;
