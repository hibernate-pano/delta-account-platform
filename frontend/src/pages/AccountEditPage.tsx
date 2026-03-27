import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountApi } from '../api';
import { Account } from '../types';
import { Plus, X, DollarSign, Info, Gamepad2, BarChart3, RefreshCw } from 'lucide-react';
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

const AccountEditPage: React.FC = () => {
  usePageTitle('编辑账号');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
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
      setFormData({ ...formData, images: [...formData.images, newImage] });
      setNewImage('');
    } catch {
      showToast('请输入有效的图片URL', 'error');
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
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
            <label className="block text-sm text-slate-400 mb-2">账号标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input w-full"
              required
            />
          </div>

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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">游戏段位</label>
              {/* Rank presets for selected game */}
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
              {/* Price suggestion */}
              {(formData.gameRank || formData.skinCount > 0) && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <Info className="w-3 h-3 text-primary" />
                  建议定价区间:{' '}
                  <span className="text-primary font-medium">¥{priceSuggestion.min} ~ ¥{priceSuggestion.max}</span>
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
                    className="text-[11px] px-2 py-0.5 bg-dark rounded text-slate-500 hover:text-white hover:bg-dark-lighter transition-all"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
              {weaponPresets.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, weapons: prev.weapons ? `${prev.weapons}, ${w}` : w }))}
                  className="text-[11px] px-2 py-0.5 bg-dark rounded text-slate-500 hover:text-white hover:bg-dark-lighter transition-all"
                >
                  {w}
                </button>
              ))}
            </div>
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

          <div>
            <label className="block text-sm text-slate-400 mb-2">账号描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full h-32 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">账号截图 (最多5张)</label>
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
            className="btn-primary flex-1 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountEditPage;
