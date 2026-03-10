import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountApi } from '../api';
import { Plus, X } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { usePageTitle } from '../hooks/usePageTitle';

const SellPage: React.FC = () => {
  usePageTitle('发布账号');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    gameRank: '',
    skinCount: 0,
    weapons: '',
    price: '',
    rentalPrice: '',
    description: '',
    images: [] as string[]
  });
  const [newImage, setNewImage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await accountApi.create({
        title: formData.title,
        gameRank: formData.gameRank,
        skinCount: formData.skinCount,
        weapons: formData.weapons,
        price: parseFloat(formData.price),
        rentalPrice: formData.rentalPrice ? parseFloat(formData.rentalPrice) : null,
        description: formData.description,
        images: formData.images
      });
      toast('success', '发布成功！等待管理员审核');
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败');
    } finally {
      setLoading(false);
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
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">发布账号</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="card space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">账号标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input w-full"
              placeholder="例如：满皮肤史诗账号"
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
                placeholder="例如：钻石"
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
              placeholder="主要武器和装备，用逗号分隔"
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
                  placeholder="0.00"
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
                  placeholder="0.00/小时"
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
              placeholder="详细描述账号情况..."
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 disabled:opacity-50"
        >
          {loading ? '发布中...' : '发布账号'}
        </button>
      </form>
    </div>
  );
};

export default SellPage;
