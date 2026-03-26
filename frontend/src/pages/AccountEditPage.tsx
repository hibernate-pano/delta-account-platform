import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountApi } from '../api';
import { Account } from '../types';
import { Plus, X } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { CardSkeleton } from '../components/ui/Skeleton';
import SkeletonBase from '../components/ui/Skeleton';

const AccountEditPage: React.FC = () => {
  usePageTitle('编辑账号');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    gameRank: '',
    skinCount: 0,
    weapons: '',
    price: '',
    rentalPrice: '',
    description: '',
    images: [] as string[],
  });
  const [newImage, setNewImage] = useState('');

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await accountApi.getById(Number(id));
        const account: Account = res.data.data;
        setFormData({
          title: account.title,
          gameRank: account.gameRank || '',
          skinCount: account.skinCount,
          weapons: account.weapons || '',
          price: String(account.price),
          rentalPrice: account.rentalPrice ? String(account.rentalPrice) : '',
          description: account.description || '',
          images: account.images || [],
        });
      } catch (error) {
        toast('error', '账号不存在');
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await accountApi.update(Number(id), {
        title: formData.title,
        gameRank: formData.gameRank || undefined,
        skinCount: formData.skinCount,
        weapons: formData.weapons || undefined,
        price: parseFloat(formData.price),
        rentalPrice: formData.rentalPrice ? parseFloat(formData.rentalPrice) : null,
        description: formData.description || undefined,
        images: formData.images,
      });
      toast('success', '账号信息已更新');
      navigate('/profile');
    } catch (error: any) {
      toast('error', error.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addImage = () => {
    if (newImage && formData.images.length < 5) {
      setFormData({ ...formData, images: [...formData.images, newImage] });
      setNewImage('');
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">编辑账号</h1>
        <SkeletonBase className="h-10 mb-4" />
        <SkeletonBase className="h-32" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">编辑账号</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">账号标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">游戏段位</label>
              <input
                type="text"
                value={formData.gameRank}
                onChange={(e) => setFormData({ ...formData, gameRank: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">皮肤数量</label>
              <input
                type="number"
                value={formData.skinCount}
                onChange={(e) => setFormData({ ...formData, skinCount: parseInt(e.target.value) || 0 })}
                className="input w-full"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">武器装备</label>
            <input
              type="text"
              value={formData.weapons}
              onChange={(e) => setFormData({ ...formData, weapons: e.target.value })}
              className="input w-full"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">售价 *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input w-full pl-8"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">时租价格</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                <input
                  type="number"
                  value={formData.rentalPrice}
                  onChange={(e) => setFormData({ ...formData, rentalPrice: e.target.value })}
                  className="input w-full pl-8"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">账号描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full h-32 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">账号截图 (最多5张)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                className="input flex-1"
                placeholder="输入图片URL"
              />
              <button
                type="button"
                onClick={addImage}
                className="btn-secondary"
                disabled={!newImage || formData.images.length >= 5}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.images.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative aspect-video bg-dark rounded">
                    <img src={img} alt="" className="w-full h-full object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="btn-secondary flex-1 py-3"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 py-3 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountEditPage;
