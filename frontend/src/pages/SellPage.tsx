import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountApi } from '../api';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { Gamepad2, Plus, X, Upload, Image, AlertCircle, ArrowRight, Check, Sparkles } from 'lucide-react';

const SellPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    gameRank: '',
    skinCount: 0,
    weapons: '',
    price: '',
    rentalPrice: '',
    description: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState('');
  const [dragOver, setDragOver] = useState(false);

  if (!token) {
    navigate('/login');
    return null;
  }

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      showToast('请填写账号标题', 'warning');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      showToast('请填写正确的售价', 'warning');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

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
        images: images
      });
      showToast('发布成功！账号正在审核中', 'success');
      setTimeout(() => navigate('/accounts'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败，请稍后重试');
      showToast(err.response?.data?.message || '发布失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    if (newImage && images.length < 5) {
      try {
        new URL(newImage);
        setImages([...images, newImage]);
        setNewImage('');
      } catch {
        showToast('请输入有效的图片URL', 'error');
      }
    } else if (images.length >= 5) {
      showToast('最多只能上传5张图片', 'warning');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleImageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImage();
    }
  };

  // Estimate account value based on input
  const estimatedValue = parseFloat(formData.price) || 0;
  const skinValue = Math.min(formData.skinCount * 5, 500);
  const totalEstimate = estimatedValue + skinValue;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">发布账号</h1>
        <p className="text-slate-500">填写账号信息，快速发布您的账号</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[
          { num: 1, label: '基础信息' },
          { num: 2, label: '详细信息' }
        ].map((item, idx) => (
          <React.Fragment key={item.num}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all ${
                step >= item.num
                  ? 'bg-primary text-white'
                  : 'bg-dark-lighter text-slate-500'
              }`}>
                {step > item.num ? <Check className="w-4 h-4" /> : item.num}
              </div>
              <span className={`text-sm ${step >= item.num ? 'text-white' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </div>
            {idx < 1 && (
              <div className={`flex-1 h-0.5 ${step > item.num ? 'bg-primary' : 'bg-dark-lighter'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="card space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                账号标题 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="例如：满皮肤史诗账号 · 钻石段位"
                required
                autoFocus
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">游戏段位</label>
                <input
                  type="text"
                  value={formData.gameRank}
                  onChange={(e) => setFormData({ ...formData, gameRank: e.target.value })}
                  className="input"
                  placeholder="例如：钻石、星耀"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">皮肤数量</label>
                <input
                  type="number"
                  value={formData.skinCount || ''}
                  onChange={(e) => setFormData({ ...formData, skinCount: parseInt(e.target.value) || 0 })}
                  className="input"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  售价 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">¥</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input pl-10 text-xl font-bold"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    required
                    autoFocus={!formData.title}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">时租价格</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">¥</span>
                  <input
                    type="number"
                    value={formData.rentalPrice}
                    onChange={(e) => setFormData({ ...formData, rentalPrice: e.target.value })}
                    className="input pl-10 text-xl"
                    placeholder="0.00"
                    step="0.01"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">/小时</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              下一步
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="card space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">武器装备</label>
                <input
                  type="text"
                  value={formData.weapons}
                  onChange={(e) => setFormData({ ...formData, weapons: e.target.value })}
                  className="input"
                  placeholder="主要武器和装备，用逗号分隔"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">账号描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input h-32 resize-none"
                  placeholder="详细描述账号情况，包括：\n- 绑定信息（手机/邮箱）\n- 历史充值金额\n- 特殊角色或限定皮肤\n- 其他需要注意的事项"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="card">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                账号截图 <span className="text-slate-500">（最多5张）</span>
              </label>

              {/* Drag & Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-dark-border'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
                  if (url && images.length < 5) {
                    try {
                      new URL(url);
                      setImages([...images, url]);
                    } catch {}
                  }
                }}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm text-slate-500 mb-2">拖拽图片到此处，或粘贴图片链接</p>
              </div>

              {/* URL Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  onKeyDown={handleImageKeyDown}
                  className="input flex-1"
                  placeholder="输入图片URL"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="btn-secondary px-4"
                  disabled={!newImage || images.length >= 5}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-video bg-dark rounded-lg overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-primary text-xs text-white px-1 rounded">封面</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="card bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-medium">发布预览</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">账号标题</span>
                  <span className="font-medium">{formData.title || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">售价</span>
                  <span className="text-xl font-bold text-primary">¥{formData.price || '0'}</span>
                </div>
                {formData.rentalPrice && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">时租</span>
                    <span>¥{formData.rentalPrice}/小时</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary flex-1 py-4"
              >
                返回
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Gamepad2 className="w-5 h-5" />
                    发布账号
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SellPage;
