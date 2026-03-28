import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { accountApi } from '../api';
import { Account } from '../types';
import {
  Plus, X, DollarSign, Info, Gamepad2, BarChart3, RefreshCw,
  Shield, Camera, Image as ImageIcon, Sparkles, CheckCircle2,
  AlertTriangle, Star, ChevronUp, ExternalLink, Lightbulb, Edit3, ArrowLeft, TrendingUp
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAccount, queryKeys } from '../hooks/useQueries';
import SkeletonBase from '../components/ui/Skeleton';

const PLATFORM_FEE_RATE = 0.05;
const TAX_RATE = 0.01;

const RANK_BASE_PRICES: Record<string, number> = {
  '百星王者': 2800, '荣耀王者': 1600, '王者': 900, '星耀': 500, '钻石': 280,
  '铂金': 120, '黄金': 60, '白银': 30, '青铜': 15,
  '王牌': 500, '无敌战神': 1800,
  '大师': 600, '宗师': 900, '黑铁': 20,
};

const getSkinMultiplier = (count: number) => {
  if (count >= 200) return 2.8;
  if (count >= 100) return 1.8;
  if (count >= 50) return 1.4;
  if (count >= 20) return 1.15;
  return 1;
};

const gamePresets = [
  { label: '王者荣耀', ranks: ['青铜', '白银', '黄金', '铂金', '钻石', '星耀', '王者', '荣耀王者', '百星王者'] },
  { label: '英雄联盟', ranks: ['黑铁', '青铜', '白银', '黄金', '铂金', '钻石', '大师', '宗师', '王者'] },
  { label: '和平精英', ranks: ['青铜', '白银', '黄金', '铂金', '钻石', '王牌', '无敌战神'] },
];

const skinPresets = [10, 50, 100, 200, 500];

const weaponPresets = ['传说皮肤', '限定皮肤', '全英雄', '全皮肤', 'V10贵族', '稀有道具'];

const tips = [
  { icon: Camera, text: '上传4-5张高清截图，第一张将作为封面图' },
  { icon: Star, text: '标题包含段位+皮肤数量+亮点（如限定皮）更容易成交' },
  { icon: DollarSign, text: '参考同段位账号定价，薄利多销加速出手' },
  { icon: Shield, text: '账号审核通过后展示在首页，获得更多曝光' },
];

const AccountEditPage: React.FC = () => {
  usePageTitle('编辑账号');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const [previewImg, setPreviewImg] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    gameType: '王者荣耀',
    gameRank: '',
    skinCount: 0,
    weapons: '',
    price: '',
    rentalPrice: '',
    description: '',
    images: [] as string[],
  });
  const [newImage, setNewImage] = useState('');

  const accountId = useMemo(() => id ? Number(id) : null, [id]);
  const { data, isLoading } = useAccount(accountId!);

  useEffect(() => {
    if (!data?.data?.data) return;
    const account: Account = data.data.data;
    setFormData({
      title: account.title,
      gameType: account.gameType || '王者荣耀',
      gameRank: account.gameRank || '',
      skinCount: account.skinCount,
      weapons: account.weapons || '',
      price: String(account.price),
      rentalPrice: account.rentalPrice ? String(account.rentalPrice) : '',
      description: account.description || '',
      images: account.images || [],
    });
  }, [data]);

  useEffect(() => {
    if (!isLoading && !data?.data?.data) {
      showToast('账号不存在', 'error');
      navigate('/profile');
    }
  }, [isLoading, data]);

  // Live price suggestion
  const priceSuggestion = useMemo(() => {
    const base = RANK_BASE_PRICES[formData.gameRank] ?? 50;
    const mult = getSkinMultiplier(formData.skinCount);
    const mid = Math.round(base * mult);
    return { min: Math.round(mid * 0.75), max: Math.round(mid * 1.25) };
  }, [formData.gameRank, formData.skinCount]);

  // Price competitiveness
  const priceLevel = useMemo(() => {
    if (!formData.price) return null;
    const p = parseFloat(formData.price);
    if (isNaN(p) || p <= 0) return null;
    if (p < priceSuggestion.min) return 'low';
    if (p > priceSuggestion.max) return 'high';
    return 'competitive';
  }, [formData.price, priceSuggestion]);

  // Fee calculation
  const priceNum = parseFloat(formData.price) || 0;
  const platformFee = priceNum * PLATFORM_FEE_RATE;
  const taxFee = priceNum * TAX_RATE;
  const youGet = priceNum - platformFee - taxFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await accountApi.update(Number(id), {
        title: formData.title,
        gameType: formData.gameType,
        gameRank: formData.gameRank || undefined,
        skinCount: formData.skinCount,
        weapons: formData.weapons || undefined,
        price: parseFloat(formData.price),
        rentalPrice: formData.rentalPrice ? parseFloat(formData.rentalPrice) : null,
        description: formData.description || undefined,
        images: formData.images,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(Number(id)) });
      showToast('账号信息已更新', 'success');
      navigate('/profile');
    } catch (error: any) {
      showToast(error.response?.data?.message || '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addImage = () => {
    if (formData.images.length >= 5) {
      showToast('最多只能上传5张图片', 'warning');
      return;
    }
    if (!newImage) return;
    try {
      new URL(newImage);
      const updated = [...formData.images, newImage];
      setFormData({ ...formData, images: updated });
      setNewImage('');
    } catch {
      showToast('请输入有效的图片URL', 'error');
    }
  };

  const removeImage = (index: number) => {
    const updated = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updated });
    if (coverIndex >= updated.length) setCoverIndex(Math.max(0, updated.length - 1));
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <SkeletonBase className="w-12 h-12 rounded-2xl" />
          <SkeletonBase className="w-48 h-7" />
        </div>
        <SkeletonBase className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main form */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm mb-4 w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">编辑账号</h1>
                <p className="text-slate-500 text-sm">更新您的账号信息并重新提交审核</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { num: '1', title: '完善信息', desc: '更新账号信息', icon: Edit3, color: 'from-blue-500/20 to-blue-600/20', iconColor: 'text-blue-400' },
              { num: '2', title: '上传图片', desc: '展示账号截图', icon: Camera, color: 'from-purple-500/20 to-purple-600/20', iconColor: 'text-purple-400' },
              { num: '3', title: '重新审核', desc: '更新后需重新审核', icon: Shield, color: 'from-emerald-500/20 to-emerald-600/20', iconColor: 'text-emerald-400' },
              { num: '4', title: '收款到账', desc: '交易完成自动结算', icon: DollarSign, color: 'from-amber-500/20 to-amber-600/20', iconColor: 'text-amber-400' },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="card p-3 text-center group hover:border-primary/30 transition-all">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-4 h-4 ${step.iconColor}`} />
                  </div>
                  <p className="text-xs font-medium text-white mb-0.5">{step.title}</p>
                  <p className="text-[10px] text-slate-600">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Performance Stats */}
          {data?.data?.data && ((data.data.data.viewCount ?? 0) > 0 || (data.data.data.orderCount ?? 0) > 0) && (
            <div className="card bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-slate-300">账号表现</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-dark rounded-lg px-3 py-2">
                  <p className="text-lg font-bold text-white">{data.data.data.viewCount ?? 0}</p>
                  <p className="text-[10px] text-slate-500">浏览次数</p>
                </div>
                <div className="bg-dark rounded-lg px-3 py-2">
                  <p className="text-lg font-bold text-green-400">{data.data.data.orderCount ?? 0}</p>
                  <p className="text-[10px] text-slate-500">已售出</p>
                </div>
                <div className="bg-dark rounded-lg px-3 py-2">
                  <p className="text-lg font-bold text-white">
                    {data.data.data.createdAt
                      ? Math.floor((Date.now() - new Date(data.data.data.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + '天'
                      : '-'}
                  </p>
                  <p className="text-[10px] text-slate-500">上架时间</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card space-y-5">
              {/* Account title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-400">账号标题 *</label>
                  <span className={`text-xs ${formData.title.length > 25 ? 'text-red-400' : formData.title.length > 15 ? 'text-amber-400' : 'text-slate-600'}`}>
                    {formData.title.length}/30
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value.slice(0, 30) })}
                  className="input w-full"
                  placeholder="例：荣耀王者 100皮 传说限定 全英雄"
                  required
                />
              </div>

              {/* Game type */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">游戏类型</label>
                <div className="flex gap-2 flex-wrap">
                  {gamePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (formData.gameType !== preset.label) {
                          setFormData((prev) => ({ ...prev, gameType: preset.label, gameRank: '' }));
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        formData.gameType === preset.label
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-dark-lighter border-dark-border text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rank + Skin count */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">游戏段位</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(gamePresets.find((g) => g.label === formData.gameType)?.ranks || []).map((rank) => (
                      <button
                        key={rank}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, gameRank: rank }))}
                        className={`text-[11px] px-2 py-0.5 rounded transition-all ${
                          formData.gameRank === rank
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'bg-dark text-slate-500 hover:text-white hover:bg-dark-lighter'
                        }`}
                      >
                        {rank}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.gameRank}
                    onChange={(e) => setFormData({ ...formData, gameRank: e.target.value })}
                    placeholder="手动输入或从上方选择"
                    className="input w-full"
                    list="rank-suggestions"
                  />
                  <datalist id="rank-suggestions">
                    {(gamePresets.find((g) => g.label === formData.gameType)?.ranks || []).map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                  {/* Price suggestion + competitiveness */}
                  {(formData.gameRank || formData.skinCount > 0) && (
                    <div className="mt-2 bg-dark rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Info className="w-3 h-3 text-primary flex-shrink-0" />
                        建议区间
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary font-medium">¥{priceSuggestion.min} ~ ¥{priceSuggestion.max}</span>
                        {priceLevel && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            priceLevel === 'competitive' ? 'bg-green-500/20 text-green-400' :
                            priceLevel === 'low' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {priceLevel === 'competitive' ? '√ 合理' : priceLevel === 'low' ? '低价' : '高价'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
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
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skinPresets.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormData({ ...formData, skinCount: n })}
                        className={`text-[11px] px-2 py-0.5 bg-dark rounded text-slate-500 hover:text-white hover:bg-dark-lighter transition-all ${
                          formData.skinCount === n ? 'text-primary bg-primary/10' : ''
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {formData.skinCount >= 50 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-400/80">
                      <Sparkles className="w-3 h-3" />
                      高皮肤账号，定价可上浮 40%+
                    </div>
                  )}
                </div>
              </div>

              {/* Weapons */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">武器装备</label>
                <input
                  type="text"
                  value={formData.weapons}
                  onChange={(e) => setFormData({ ...formData, weapons: e.target.value })}
                  placeholder="主要武器和装备"
                  className="input w-full"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {weaponPresets.map((w) => {
                    const isActive = (formData.weapons || '').split(',').map(s => s.trim()).includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setFormData((prev) => {
                          const items = (prev.weapons || '').split(',').map(s => s.trim()).filter(Boolean);
                          const updated = items.includes(w) ? items.filter(i => i !== w) : [...items, w];
                          return { ...prev, weapons: updated.join(', ') };
                        })}
                        className={`text-[11px] px-2 py-0.5 rounded transition-all ${
                          isActive
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'bg-dark text-slate-500 hover:text-white hover:bg-dark-lighter'
                        }`}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
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
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Fee calculation */}
              {priceNum > 0 && (
                <div className="card bg-gradient-to-br from-primary/8 to-purple-500/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-slate-300">收益预估</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-dark rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 mb-1">标价</p>
                      <p className="text-sm font-bold text-white">¥{priceNum.toFixed(0)}</p>
                    </div>
                    <div className="bg-dark rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 mb-1">平台+税费</p>
                      <p className="text-sm font-medium text-red-400">-¥{(platformFee + taxFee).toFixed(2)}</p>
                    </div>
                    <div className="bg-dark rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 mb-1">你将获得</p>
                      <p className="text-sm font-bold text-green-400">¥{youGet.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2 text-center">
                    平台服务费 {PLATFORM_FEE_RATE * 100}% + 税费 {TAX_RATE * 100}%
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">账号描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full h-32 resize-none"
                  placeholder="描述账号亮点，如：全英雄、全皮肤、贵族等级、游戏内成就等"
                />
              </div>

              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-400">账号截图 (最多5张)</label>
                  {formData.images.length > 0 && (
                    <span className="text-xs text-slate-600">第一张为封面图</span>
                  )}
                </div>
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
                      <div
                        key={index}
                        className={`relative aspect-video bg-dark rounded group cursor-pointer transition-all ${
                          index === coverIndex ? 'ring-2 ring-primary ring-offset-1 ring-offset-dark' : 'hover:ring-1 hover:ring-slate-600'
                        }`}
                        onClick={() => setPreviewImg(index)}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover rounded" />
                        {/* Cover indicator */}
                        {index === coverIndex && (
                          <div className="absolute top-1 left-1 bg-primary/90 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ImageIcon className="w-2.5 h-2.5" />
                            封面
                          </div>
                        )}
                        {/* Set cover */}
                        {index !== coverIndex && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCoverIndex(index); showToast('已设为封面图', 'success'); }}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <ImageIcon className="w-4 h-4 text-white" />
                              <span className="text-white text-[9px]">设为封面</span>
                            </div>
                          </button>
                        )}
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
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
                className="btn-primary flex-1 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </form>
        </div>

        {/* Tips sidebar */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <div className="sticky top-24">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-400">发布技巧</span>
              </div>
              <div className="space-y-3">
                {tips.map((tip, i) => {
                  const Icon = tip.icon;
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3 h-3 text-amber-400/80" />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{tip.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Re-listing note */}
            <div className="mt-3 card border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-medium text-amber-400/90 mb-1">重新上架须知</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    修改信息后账号需重新通过平台审核，审核通过后自动上架。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Image preview modal */}
      {previewImg !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImg(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={formData.images[previewImg]}
              alt="预览"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-dark-lighter rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
            >
              <X className="w-4 h-4" />
            </button>
            {formData.images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {formData.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewImg(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === previewImg ? 'bg-primary' : 'bg-slate-600'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountEditPage;
