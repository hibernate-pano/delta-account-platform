import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountApi, uploadApi } from '../api';
import { Plus, X, Upload, Image, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { usePageTitle } from '../hooks/usePageTitle';

const SellPage: React.FC = () => {
  usePageTitle('发布账号');
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  const [newImageUrl, setNewImageUrl] = useState('');

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

  // 上传图片文件
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (formData.images.length >= 5) {
      toast('error', '最多只能上传5张图片');
      return;
    }
    
    setUploading(true);
    try {
      const file = files[0];
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast('error', '只支持 JPG、PNG、GIF、WebP 格式');
        return;
      }
      
      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast('error', '图片大小不能超过 5MB');
        return;
      }
      
      // 上传
      const res = await uploadApi.uploadImage(file);
      const imageUrl = res.data.data;
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
      
      toast('success', '图片上传成功');
    } catch (err: any) {
      toast('error', '图片上传失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      // 清空 file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 通过URL添加图片
  const addImageByUrl = () => {
    if (newImageUrl && formData.images.length < 5) {
      setFormData(prev => ({ ...prev, images: [...prev.images, newImageUrl] }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">发布账号</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="card space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">账号标题 *</label>
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
              <label className="block text-sm text-slate-400 mb-2">游戏段位</label>
              <input
                type="text"
                value={formData.gameRank}
                onChange={(e) => setFormData({ ...formData, gameRank: e.target.value })}
                className="input w-full"
                placeholder="例如：钻石"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">皮肤数量</label>
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
            <label className="block text-sm text-slate-400 mb-2">武器装备</label>
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
              <label className="block text-sm text-slate-400 mb-2">售价 *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
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
              <label className="block text-sm text-slate-400 mb-2">时租价格</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
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
            <label className="block text-sm text-slate-400 mb-2">账号描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full h-32 resize-none"
              placeholder="详细描述账号情况..."
            />
          </div>

          {/* 图片上传区域 */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              账号截图 (最多5张)
              <span className="text-xs text-slate-600 ml-2">支持 JPG、PNG、GIF、WebP，最大 5MB/张</span>
            </label>
            
            {/* 已上传的图片预览 */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-3">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative aspect-video bg-dark rounded-lg overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* 上传按钮 */}
            {formData.images.length < 5 && (
              <div className="flex gap-3">
                {/* 本地上传 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-dark border border-slate-700 rounded-lg cursor-pointer hover:border-primary transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-slate-400">上传中...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-primary" />
                      <span className="text-sm text-slate-300">本地上传</span>
                    </>
                  )}
                </label>
                
                {/* URL输入 */}
                <div className="flex-1 flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="input flex-1"
                    placeholder="或输入图片URL"
                  />
                  <button
                    type="button"
                    onClick={addImageByUrl}
                    disabled={!newImageUrl}
                    className="btn-secondary"
                  >
                    添加
                  </button>
                </div>
              </div>
            )}
            
            {/* 拖拽提示 */}
            <div className="mt-3 p-4 border-2 border-dashed border-slate-800 rounded-lg text-center hover:border-slate-700 transition-colors">
              <Image className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-500">
                建议上传清晰的账号截图，提高曝光率
              </p>
              <p className="text-xs text-slate-600 mt-1">
                已上传 {formData.images.length}/5 张
              </p>
            </div>
          </div>
        </div>

        <div className="bg-dark-darker border border-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">发布须知</h3>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• 请确保账号信息真实准确，虚假信息会导致账号被下架</li>
            <li>• 发布的账号需要管理员审核，审核通过后即可展示</li>
            <li>• 禁止发布违规、违法内容的账号</li>
            <li>• 平台将收取 5% 的交易佣金</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="btn-primary w-full py-3 disabled:opacity-50"
        >
          {loading ? '发布中...' : '发布账号'}
        </button>
      </form>
    </div>
  );
};

export default SellPage;