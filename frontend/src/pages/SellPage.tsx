import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { ConfirmInline } from '../components/ui/ConfirmInline';
import { usePageTitle } from '../hooks/usePageTitle';
import { useCreateAccount } from '../hooks/useQueries';
import {
  Gamepad2, Plus, X, Upload, Check, Sparkles, ArrowRight, ArrowLeft,
  Camera, Image as ImageIcon, Eye, DollarSign, Info, GripVertical,
  Shield, Clock, BarChart3, CheckCircle, Edit3, User, RefreshCw, AlertCircle,
  Circle
} from 'lucide-react';

const PLATFORM_FEE_RATE = 0.05; // 5%
const TAX_RATE = 0.01; // 1%
const SELL_DRAFT_KEY = 'delta_sell_draft';

// Rank → base price mapping (yuan)
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

// Client-side image compression: max 1200px wide, JPEG 0.82 quality
const compressImage = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1200;
        let { width, height } = img;
        if (width > maxW) { height = (height * maxW) / width; width = maxW; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

const getPriceSuggestion = (rank: string, skinCount: number) => {
  const base = RANK_BASE_PRICES[rank] ?? 50;
  const mult = getSkinMultiplier(skinCount);
  const mid = Math.round(base * mult);
  return { min: Math.round(mid * 0.75), max: Math.round(mid * 1.25) };
};

const getRentalSuggestion = (rank: string, skinCount: number) => {
  const base = RANK_BASE_PRICES[rank] ?? 50;
  const mult = getSkinMultiplier(skinCount);
  const mid = Math.round(Math.min(base * mult * 0.15, 50));
  return { min: Math.max(5, Math.round(mid * 0.6)), max: Math.round(mid * 1.4) };
};

const gamePresets = [
  { label: '王者荣耀', ranks: ['青铜', '白银', '黄金', '铂金', '钻石', '星耀', '王者', '荣耀王者', '百星王者'] },
  { label: '英雄联盟', ranks: ['黑铁', '青铜', '白银', '黄金', '铂金', '钻石', '大师', '宗师', '王者'] },
  { label: '和平精英', ranks: ['青铜', '白银', '黄金', '铂金', '钻石', '王牌', '无敌战神'] },
];

const weaponPresets = ['传说皮肤', '限定皮肤', '全英雄', '全皮肤', 'V10贵族', '稀有道具'];

const SellPage: React.FC = () => {
  usePageTitle('发布账号');
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const createMutation = useCreateAccount();

  const [step, setStep] = useState(1);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const [navigatingStep, setNavigatingStep] = useState(false);
  const [gameType, setGameType] = useState('王者荣耀');

  // Draft restoration dialog state
  const [draftToRestore, setDraftToRestore] = useState<{ formData: typeof formData; images: string[] } | null>(null);

  const handleNext = (target: number) => {
    setSlideDir('left');
    setStep(target);
  };
  const handleBack = (target: number) => {
    setSlideDir('right');
    setStep(target);
  };
  const [formData, setFormData] = useState({
    title: '',
    gameRank: '',
    skinCount: 0,
    weapons: '',
    price: '',
    rentalPrice: '',
    description: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [compressingCount, setCompressingCount] = useState(0);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [previewImg, setPreviewImg] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [publishedAccountId, setPublishedAccountId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [descPreview, setDescPreview] = useState(false);

  // Inline field validation
  const validateField = (field: string, value: string) => {
    if (field === 'title') {
      if (!value.trim()) setFieldErrors(e => ({ ...e, title: '标题不能为空' }));
      else setFieldErrors(e => { const n = { ...e }; delete n.title; return n; });
    }
    if (field === 'price') {
      const p = parseFloat(value);
      if (!value) setFieldErrors(e => ({ ...e, price: '请填写售价' }));
      else if (p <= 0) setFieldErrors(e => ({ ...e, price: '售价必须大于0' }));
      else setFieldErrors(e => { const n = { ...e }; delete n.price; return n; });
    }
  };

  // Mark form as dirty when user edits anything
  useEffect(() => {
    const hasContent = formData.title || images.length > 0 || formData.price || formData.description;
    setIsDirty(!!hasContent);
  }, [formData, images]);

  // Reset preview index when images change
  useEffect(() => { setPreviewImg(0); }, [images]);

  // beforeunload: warn on tab close / browser back with unsaved data
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Restore draft from localStorage on mount (with inline confirmation)
  useEffect(() => {
    const saved = localStorage.getItem(SELL_DRAFT_KEY);
    if (!saved) return;
    try {
      const { formData: savedForm, images: savedImages } = JSON.parse(saved);
      if (!savedForm && !savedImages?.length) return;
      setDraftToRestore({ formData: savedForm, images: savedImages });
    } catch { /* ignore corrupt draft */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmRestoreDraft = () => {
    if (!draftToRestore) return;
    if (draftToRestore.formData) setFormData((f) => ({ ...f, ...draftToRestore.formData }));
    if (draftToRestore.images?.length) setImages(draftToRestore.images);
    setDraftToRestore(null);
  };

  const dismissDraft = () => {
    localStorage.removeItem(SELL_DRAFT_KEY);
    setDraftToRestore(null);
  };

  // Autosave draft to localStorage on changes (debounced 800ms)
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      localStorage.setItem(SELL_DRAFT_KEY, JSON.stringify({ formData, images }));
    }, 800);
    return () => clearTimeout(timer);
  }, [formData, images, isDirty]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (images.length >= 5) { showToast('最多只能上传5张图片', 'warning'); return; }
      if (!file.type.startsWith('image/')) { showToast('请选择图片文件', 'error'); return; }
      setCompressingCount(c => c + 1);
      compressImage(file)
        .then((compressed) => setImages((prev) => [...prev, compressed]))
        .finally(() => setCompressingCount(c => c - 1));
    });
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Derived values
  const price = parseFloat(formData.price) || 0;
  const rentalPrice = parseFloat(formData.rentalPrice) || 0;
  const suggestion = useMemo(() => getPriceSuggestion(formData.gameRank, formData.skinCount), [formData.gameRank, formData.skinCount]);
  const rentalSuggestion = useMemo(() => getRentalSuggestion(formData.gameRank, formData.skinCount), [formData.gameRank, formData.skinCount]);
  const platformFee = price * PLATFORM_FEE_RATE;
  const tax = price * TAX_RATE;
  const youGet = price - platformFee - tax;
  const activePreset = gamePresets.find((p) => p.label === gameType);
  const activeRanks = activePreset?.ranks || [];

  if (!token) {
    navigate('/login');
    return null;
  }

  const validateStep1 = () => {
    let valid = true;
    if (!formData.title.trim()) {
      setFieldErrors(e => ({ ...e, title: '标题不能为空' }));
      if (valid) document.getElementById('sell-title')?.focus();
      valid = false;
    } else {
      setFieldErrors(e => { const n = { ...e }; delete n.title; return n; });
    }
    if (!formData.gameRank) { showToast('请选择游戏段位', 'warning'); document.getElementById('sell-rank')?.focus(); return false; }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setFieldErrors(e => ({ ...e, price: '请填写正确的售价' }));
      if (valid) document.getElementById('sell-price')?.focus();
      valid = false;
    } else {
      setFieldErrors(e => { const n = { ...e }; delete n.price; return n; });
    }
    return valid;
  };

  const handleNextToStep2 = () => {
    if (navigatingStep) return;
    setNavigatingStep(true);
    if (validateStep1()) handleNext(2);
    setTimeout(() => setNavigatingStep(false), 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createMutation.mutateAsync({
        title: formData.title,
        gameType,
        gameRank: formData.gameRank,
        skinCount: formData.skinCount,
        weapons: formData.weapons,
        price: parseFloat(formData.price),
        rentalPrice: formData.rentalPrice ? parseFloat(formData.rentalPrice) : null,
        description: formData.description,
        images,
      });
      const newId = res?.data?.data?.id;
      if (newId) setPublishedAccountId(newId);
      showToast('发布成功！账号正在审核中', 'success');
      localStorage.removeItem(SELL_DRAFT_KEY);
      setIsDirty(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || '发布失败', 'error');
    }
  };

  const addImage = () => {
    if (!newImage || images.length >= 5) {
      if (images.length >= 5) showToast('最多只能上传5张图片', 'warning');
      return;
    }
    try {
      new URL(newImage);
      setImages([...images, newImage]);
      setNewImage('');
    } catch {
      showToast('请输入有效的图片URL', 'error');
    }
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  // Drag to reorder
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newImages = [...images];
    const [moved] = newImages.splice(draggedIdx, 1);
    newImages.splice(targetIdx, 0, moved);
    setImages(newImages);
    setDraggedIdx(null);
  };

  const isSubmitting = createMutation.isPending;
  const ranks = activeRanks;

  // Form completion progress
  const completionPercent = useMemo(() => {
    let score = 0;
    if (formData.title) score += 20;
    if (formData.gameRank) score += 20;
    if (formData.price && parseFloat(formData.price) > 0) score += 20;
    if (images.length > 0) score += 20;
    if (formData.description.length >= 10) score += 20;
    return score;
  }, [formData.title, formData.gameRank, formData.price, images.length, formData.description]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Screen */}
      {publishedAccountId ? (
        <div className="card p-10 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">发布成功！</h2>
          <p className="text-slate-500 text-sm mb-6">您的账号正在审核中，预计 1-2 小时内完成</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(`/accounts/${publishedAccountId}`)} className="btn-primary flex items-center gap-2">
              <Eye className="w-4 h-4" /> 查看账号
            </button>
            <button onClick={() => navigate('/accounts')} className="btn-secondary flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> 浏览市场
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-4">审核通过后，账号将自动上架销售</p>
        </div>
      ) : (

        /* Draft restoration confirmation */
        <>{draftToRestore && (
          <div className="mb-6">
            <ConfirmInline
              message={`发现未完成的草稿「${draftToRestore.formData?.title || '未命名'}」，是否继续编辑？`}
              onConfirm={confirmRestoreDraft}
              onCancel={dismissDraft}
              confirmLabel="继续编辑"
            />
          </div>
        )}

      {/* Form completion progress indicator */}
      {step === 1 && (
        <div className="mb-6 bg-dark rounded-xl p-4 border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">填写进度</span>
            <span className={`text-xs font-medium ${
              completionPercent === 100 ? 'text-green-400' :
              completionPercent >= 60 ? 'text-yellow-400' : 'text-slate-500'
            }`}>
              {completionPercent}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-dark-lighter rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionPercent === 100 ? 'bg-green-500' :
                completionPercent >= 60 ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2.5 text-[10px]">
            <span className={formData.title ? 'text-green-400' : 'text-slate-600'}>
              {formData.title
                ? <span className="flex items-center gap-0.5"><Check className="w-3 h-3" /> 标题</span>
                : <span className="flex items-center gap-0.5"><Circle className="w-3 h-3" /> 标题</span>}
            </span>
            <span className={formData.gameRank ? 'text-green-400' : 'text-slate-600'}>
              {formData.gameRank
                ? <span className="flex items-center gap-0.5"><Check className="w-3 h-3" /> 段位</span>
                : <span className="flex items-center gap-0.5"><Circle className="w-3 h-3" /> 段位</span>}
            </span>
            <span className={formData.price ? 'text-green-400' : 'text-slate-600'}>
              {formData.price
                ? <span className="flex items-center gap-0.5"><Check className="w-3 h-3" /> 价格</span>
                : <span className="flex items-center gap-0.5"><Circle className="w-3 h-3" /> 价格</span>}
            </span>
            <span className={images.length > 0 ? 'text-green-400' : 'text-slate-600'}>
              {images.length > 0
                ? <span className="flex items-center gap-0.5"><Check className="w-3 h-3" /> 图片</span>
                : <span className="flex items-center gap-0.5"><Circle className="w-3 h-3" /> 图片</span>}
            </span>
            <span className={formData.description.length >= 10 ? 'text-green-400' : 'text-slate-600'}>
              {formData.description.length >= 10
                ? <span className="flex items-center gap-0.5"><Check className="w-3 h-3" /> 描述</span>
                : <span className="flex items-center gap-0.5"><Circle className="w-3 h-3" /> 描述</span>}
            </span>
          </div>
        </div>
      )}

      {/* How it works - 4 steps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { num: '1', title: '填写信息', desc: '完善账号信息与描述', icon: Edit3, color: 'from-blue-500/20 to-blue-600/20', iconColor: 'text-blue-400' },
          { num: '2', title: '上传图片', desc: '添加多张高清截图', icon: Camera, color: 'from-purple-500/20 to-purple-600/20', iconColor: 'text-purple-400' },
          { num: '3', title: '审核发布', desc: '平台审核后展示', icon: Shield, color: 'from-emerald-500/20 to-emerald-600/20', iconColor: 'text-emerald-400' },
          { num: '4', title: '收款到账', desc: '交易完成自动结算', icon: DollarSign, color: 'from-amber-500/20 to-amber-600/20', iconColor: 'text-amber-400' },
        ].map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="card p-4 text-center group hover:border-primary/30 transition-all">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${step.iconColor}`} />
              </div>
              <p className="text-xs font-medium text-white mb-0.5">{step.title}</p>
              <p className="text-[10px] text-slate-500">{step.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-dark-border">
        {[
          { icon: Shield, text: '平台托管保障资金安全', color: 'text-green-400' },
          { icon: BarChart3, text: '5%平台服务费+1%税费', color: 'text-slate-400' },
          { icon: Clock, text: '审核通常在1小时内完成', color: 'text-slate-400' },
        ].map(({ icon: Icon, text, color }) => (
          <div key={text} className={`flex items-center gap-1.5 text-xs ${color}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* 3-Step Progress */}
      <div className="flex items-center gap-0 mb-10">
        {[1, 2, 3].map((num, i) => {
          const labels = ['账号信息', '上传图片', '确认发布'];
          const done = step > num;
          const active = step === num;
          return (
            <React.Fragment key={num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-medium transition-all text-sm ${
                    done ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : active ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-dark-lighter text-slate-500'
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : num}
                </div>
                <span className={`text-[11px] mt-1.5 ${active ? 'text-primary font-medium' : 'text-slate-500'}`}>
                  {labels[num - 1]}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full transition-all ${step > num ? 'bg-green-500' : 'bg-dark-lighter'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ===== STEP 1: Account Info ===== */}
        {step === 1 && (
          <div className={`space-y-5 ${slideDir === 'left' ? 'animate-slide-left' : 'animate-slide-right'}`}>
            <div className="card space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    账号标题 <span className="text-red-400">*</span>
                  </label>
                  <span className={`text-xs ${formData.title.length > 30 ? 'text-red-400' : 'text-slate-500'}`}>
                    {formData.title.length}/30
                  </span>
                </div>
                <input
                  type="text" value={formData.title}
                  onChange={(e) => { setFormData({ ...formData, title: e.target.value.slice(0, 30) }); validateField('title', e.target.value); }}
                  onBlur={(e) => validateField('title', e.target.value)}
                  maxLength={30}
                  id="sell-title"
                  disabled={isSubmitting}
                  className={`input disabled:opacity-50 disabled:cursor-not-allowed ${fieldErrors.title ? '!border-red-500 focus:!border-red-500' : ''}`} placeholder="例如：满皮肤 · 钻石段位 · 王者局"
                  required autoFocus
                />
                {fieldErrors.title && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{fieldErrors.title}
                  </p>
                )}
              </div>

              {/* Game type selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">游戏类型</label>
                <div className="flex gap-2 flex-wrap">
                  {gamePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (gameType !== preset.label) {
                          setGameType(preset.label);
                          setFormData((prev) => ({ ...prev, gameRank: '' }));
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        gameType === preset.label
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-dark-lighter border-dark-border text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">游戏段位</label>
                  <select
                    value={formData.gameRank}
                    onChange={(e) => setFormData({ ...formData, gameRank: e.target.value })}
                    id="sell-rank"
                    disabled={isSubmitting}
                    className="input disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">选择段位</option>
                    {ranks.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {formData.gameRank && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-600">段位等级:</span>
                      <div className="flex gap-0.5">
                        {ranks.map((r, i) => (
                          <div
                            key={r}
                            className={`w-5 h-2 rounded-full transition-all ${
                              r === formData.gameRank ? 'bg-primary shadow-sm shadow-primary/50' :
                              i < ranks.indexOf(formData.gameRank) ? 'bg-green-500/40' :
                              'bg-dark-lighter'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-primary font-medium">
                        {ranks.indexOf(formData.gameRank) + 1}/{ranks.length}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">皮肤数量</label>
                  <input
                    type="number" value={formData.skinCount || ''}
                    onChange={(e) => setFormData({ ...formData, skinCount: parseInt(e.target.value) || 0 })}
                    className="input" placeholder="0" min="0"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[10, 50, 100, 200, '满'].map((n) => (
                      <button
                        key={String(n)}
                        type="button"
                        onClick={() => setFormData((f) => ({ ...f, skinCount: typeof n === 'number' ? n : 999 }))}
                        className={`px-2.5 py-0.5 rounded text-xs transition-all border ${
                          (typeof n === 'number' && formData.skinCount === n) || (n === '满' && formData.skinCount === 999)
                            ? 'bg-primary/20 border-primary/50 text-primary'
                            : 'bg-dark border-dark-border text-slate-500 hover:text-white'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    售价 <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">¥</span>
                    <input
                      type="number" value={formData.price}
                      onChange={(e) => { setFormData({ ...formData, price: e.target.value }); validateField('price', e.target.value); }}
                      onBlur={(e) => validateField('price', e.target.value)}
                      id="sell-price"
                      disabled={isSubmitting}
                      className={`input pl-10 text-xl font-bold !text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary/50 ${fieldErrors.price ? '!border-red-500 focus:!border-red-500' : ''}`} placeholder="0.00" step="0.01" min="1" required
                    />
                  </div>
                  {fieldErrors.price ? (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{fieldErrors.price}
                    </p>
                  ) : (formData.price && (formData.gameRank || formData.skinCount > 0) && (
                    <div className={`text-xs mt-1 px-2 py-1 rounded-lg ${
                      price < suggestion.min
                        ? 'text-yellow-400 bg-yellow-500/10'
                        : price <= suggestion.max
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-slate-500 bg-dark-lighter'
                    }`}>
                      {price < suggestion.min
                        ? `低于市价（参考 ¥${suggestion.min}-${suggestion.max}）`
                        : price <= suggestion.max
                        ? <><Check className="w-3 h-3 inline" /> 价格在合理区间</>
                        : '价格偏高，建议参考市场定价'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">时租价格</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">¥</span>
                    <input
                      type="number" value={formData.rentalPrice}
                      onChange={(e) => setFormData({ ...formData, rentalPrice: e.target.value })}
                      className="input pl-10 text-xl" placeholder="0.00" step="0.01"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">/时</span>
                  </div>
                  {formData.rentalPrice && (formData.gameRank || formData.skinCount > 0) && (
                    <div className={`text-xs mt-1 px-2 py-1 rounded-lg ${
                      rentalPrice < rentalSuggestion.min
                        ? 'text-yellow-400 bg-yellow-500/10'
                        : rentalPrice <= rentalSuggestion.max
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-slate-500 bg-dark-lighter'
                    }`}>
                      {rentalPrice < rentalSuggestion.min
                        ? `低于市价（参考 ¥${rentalSuggestion.min}-${rentalSuggestion.max}/时）`
                        : rentalPrice <= rentalSuggestion.max
                        ? <><Check className="w-3 h-3 inline" /> 时租价格合理</>
                        : '时租偏高，建议参考 ¥' + rentalSuggestion.min + '-' + rentalSuggestion.max + '/时'}
                    </div>
                  )}
                </div>
              </div>

              {/* Fee Breakdown */}
              {price > 0 && (
                <div className="bg-dark rounded-xl p-4 border border-dark-border">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-slate-300">收益计算</span>
                    <span className="text-xs text-slate-600 ml-auto">售价 ¥{price.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>平台服务费 (5%)</span>
                      <span>-¥{platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>税费 (1%)</span>
                      <span>-¥{tax.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-dark-border my-1" />
                    <div className="flex justify-between text-green-400 font-bold">
                      <span>您将获得</span>
                      <span>¥{youGet.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic pricing suggestion */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 space-y-1">
                <p className="text-primary/80 font-medium">智能定价参考</p>
                {formData.gameRank || formData.skinCount > 0 ? (
                  <>
                    <p>
                      根据当前段位「{formData.gameRank || '未选择'}」
                      {formData.skinCount > 0 && ` + ${formData.skinCount}皮肤`}，
                      市场参考价约为
                    </p>
                    <p className="text-primary font-bold text-sm">
                      ¥{suggestion.min} ~ ¥{suggestion.max}
                    </p>
                    <p>实际定价可参考同类账号，上下浮动 25% 属正常范围。</p>
                    <p>支持同时设置购买价和时租价，一份账号两份收入。</p>
                  </>
                ) : (
                  <>
                    <p>选择段位和皮肤数量，系统将自动计算参考价格区间。</p>
                    <p>段位越高、皮肤越多，价格越高。限定皮肤是重要加分项。</p>
                    <p>支持同时设置购买价和时租价，一份账号两份收入。</p>
                  </>
                )}
              </div>
            </div>

            <button type="button" onClick={handleNextToStep2} disabled={navigatingStep} className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50">
              下一步 <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ===== STEP 2: Images ===== */}
        {step === 2 && (
          <div className={`space-y-5 ${slideDir === 'left' ? 'animate-slide-left' : 'animate-slide-right'}`}>
            <div className="card space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-300">武器装备</label>
                  <span className={`text-xs ${formData.weapons.length > 100 ? 'text-red-400' : 'text-slate-500'}`}>
                    {formData.weapons.length}/100
                  </span>
                </div>
                <input
                  type="text" value={formData.weapons}
                  onChange={(e) => setFormData({ ...formData, weapons: e.target.value.slice(0, 100) })}
                  maxLength={100}
                  disabled={isSubmitting}
                  className="input disabled:opacity-50 disabled:cursor-not-allowed" placeholder="主要武器和装备，用逗号分隔"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {weaponPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, weapons: f.weapons ? f.weapons + '，' + preset : preset }))}
                      className="px-2.5 py-1 rounded-full text-xs bg-dark border border-dark-border text-slate-500 hover:text-white hover:border-primary/40 transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-300">账号描述</label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${formData.description.length > 500 ? 'text-red-400' : 'text-slate-500'}`}>
                      {formData.description.length}/500
                    </span>
                    <button
                      type="button"
                      onClick={() => setDescPreview(v => !v)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all ${
                        descPreview
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'text-slate-500 border-dark-border hover:text-white hover:border-slate-600'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      {descPreview ? '编辑' : '预览'}
                    </button>
                  </div>
                </div>
                {descPreview ? (
                  <div className="input h-28 overflow-auto flex items-start pt-2">
                    {formData.description ? (
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{formData.description}</p>
                    ) : (
                      <p className="text-sm text-slate-600 italic">暂无描述</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 500) })}
                    maxLength={500}
                    disabled={isSubmitting}
                    className="input h-28 resize-none disabled:opacity-50 disabled:cursor-not-allowed" placeholder="详细描述：绑定信息、历史充值、特殊角色..."
                  />
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  账号截图
                  <span className="text-slate-500 text-xs font-normal">（最多5张）</span>
                </label>
                {images.length > 0 && (
                  <span className="text-xs text-slate-500">{images.length}/5 已上传</span>
                )}
              </div>

              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all mb-4 ${
                  compressingCount > 0
                    ? 'border-slate-700 cursor-not-allowed opacity-50'
                    : dragOver
                      ? 'border-primary bg-primary/5 cursor-pointer'
                      : 'border-dark-border hover:border-slate-600 cursor-pointer'
                }`}
                onDragOver={(e) => { if (compressingCount > 0) return; e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => { if (compressingCount > 0) return; setDragOver(false); }}
                onDrop={(e) => {
                  if (compressingCount > 0) return;
                  e.preventDefault(); setDragOver(false);
                  // Try to read dropped files first
                  const files = Array.from(e.dataTransfer.files);
                  const imageFiles = files.filter(f => f.type.startsWith('image/'));
                  if (imageFiles.length > 0) {
                    imageFiles.slice(0, 5 - images.length).forEach((file) => {
                      setCompressingCount(c => c + 1);
                      compressImage(file)
                        .then((compressed) => setImages((prev) => [...prev, compressed]))
                        .finally(() => setCompressingCount(c => c - 1));
                    });
                    return;
                  }
                  // Fallback: URL drop
                  const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
                  if (url && images.length < 5) {
                    try { new URL(url); setImages([...images, url]); } catch {}
                  }
                }}
                onClick={() => { if (compressingCount > 0) return; document.getElementById('url-input')?.focus(); }}
              >
                {dragOver ? (
                  <p className="text-primary text-sm font-medium">松开以添加图片</p>
                ) : compressingCount > 0 ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-primary">正在压缩 {compressingCount} 张图片...</span>
                        <span className="text-xs text-primary/60">优化中</span>
                      </div>
                      <div className="h-1.5 bg-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all"
                          style={{ width: '70%', animation: 'compress-pulse 1.5s ease-in-out infinite' }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600">压缩后图片更小，上传更快</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-500">拖拽图片文件到此处</p>
                    <p className="text-xs text-slate-600 mt-1">或粘贴图片链接</p>
                  </>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* URL input row */}
              <div className="flex gap-2 mb-4">
                <input
                  id="url-input" type="url" value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted && images.length < 5) {
                      try { new URL(pasted); setImages([...images, pasted]); setNewImage(''); showToast('图片已添加', 'success'); }
                      catch { showToast('请输入有效的图片URL', 'error'); }
                    }
                  }}
                  className="input flex-1" placeholder="输入图片URL或直接粘贴"
                />
                <button type="button" onClick={addImage}
                  className="btn-secondary px-4" disabled={!newImage || images.length >= 5}>
                  <Plus className="w-5 h-5" />
                </button>
                <button type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 5}
                  className="btn-secondary px-4 flex items-center gap-1 disabled:opacity-50"
                  title="从本地上传">
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Image grid */}
              {images.length > 0 && (
                <div className="space-y-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative flex items-center gap-3 bg-dark rounded-xl overflow-hidden group transition-all ${
                        draggedIdx === idx ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={() => setDraggedIdx(null)}
                    >
                      {/* Drag handle */}
                      <div className="px-3 py-3 text-slate-600 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      {/* Thumbnail */}
                      <div className="w-16 h-12 flex-shrink-0 overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 truncate">{img}</p>
                        {idx === 0 && (
                          <span className="text-[10px] text-primary bg-primary/20 px-1.5 py-0.5 rounded">封面</span>
                        )}
                      </div>
                      {/* Reorder hint */}
                      <span className="text-[10px] text-slate-600 pr-2">拖动排序</span>
                      <button
                        type="button" onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">点击上传账号截图</span>
                  <span className="text-xs text-slate-600">建议至少上传1张，高清图片更吸引买家</span>
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => handleBack(1)} className="btn-secondary flex-1 py-4 flex items-center justify-center gap-2">
                <ArrowLeft className="w-5 h-5" /> 返回
              </button>
              <button type="button" disabled={navigatingStep} onClick={() => {
                if (navigatingStep) return;
                setNavigatingStep(true);
                if (images.length === 0) {
                  showToast('请至少上传1张图片', 'warning');
                  setNavigatingStep(false);
                  return;
                }
                if (formData.description.trim().length < 10) {
                  showToast('账号描述至少需要10个字，方便买家了解商品详情', 'warning');
                  document.getElementById('sell-description')?.focus();
                  setNavigatingStep(false);
                  return;
                }
                handleNext(3);
                setTimeout(() => setNavigatingStep(false), 200);
              }} className="btn-primary flex-1 py-4 flex items-center justify-center gap-2 disabled:opacity-50">
                下一步 <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Confirm & Preview ===== */}
        {step === 3 && (
          <div className={`space-y-5 ${slideDir === 'left' ? 'animate-slide-left' : 'animate-slide-right'}`}>
            {/* Account card preview */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-300">发布预览</span>
                <span className="text-xs text-slate-600 ml-auto">买家将看到的效果</span>
              </div>

              {/* Mini account card */}
              <div className="bg-dark rounded-xl overflow-hidden">
                {images.length > 0 ? (
                  <div className="space-y-2">
                    <div className="aspect-video">
                      <img src={images[previewImg]} alt="" className="w-full h-full object-cover" />
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewImg(idx)}
                            className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden transition-all ${idx === previewImg ? 'ring-2 ring-primary opacity-100' : 'opacity-50 hover:opacity-80'}`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-dark-lighter flex items-center justify-center">
                    <Gamepad2 className="w-10 h-10 text-slate-700" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-medium text-sm mb-2">{formData.title || '账号标题'}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <div className="flex items-center gap-1.5">
                      {gameType && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">{gameType}</span>
                      )}
                      <span className="px-2 py-0.5 bg-dark-lighter rounded">{formData.gameRank || '段位'}</span>
                      <span>{formData.skinCount} 皮肤</span>
                    </div>
                    {formData.weapons && (
                      <span className="text-slate-600 truncate max-w-[120px]">{formData.weapons}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">¥{formData.price || '0'}</span>
                    {formData.rentalPrice && (
                      <span className="text-xs text-slate-500">租 ¥{formData.rentalPrice}/时</span>
                    )}
                  </div>
                  {/* Seller info row */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dark-border">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                      <User className="w-2.5 h-2.5 text-primary" />
                    </div>
                    <span className="text-[11px] text-slate-500">发布账号</span>
                    <div className="ml-auto flex items-center gap-0.5">
                      <Shield className="w-3 h-3 text-green-400" />
                      <span className="text-[10px] text-green-400">平台托管</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full summary */}
            <div className="card space-y-3">
              <h3 className="font-medium text-sm text-slate-300">填写信息汇总</h3>
              {[
                { label: '账号标题', value: formData.title },
                { label: '游戏类型', value: gameType },
                { label: '游戏段位', value: formData.gameRank || '未填写' },
                { label: '皮肤数量', value: `${formData.skinCount} 个` },
                { label: '售价', value: `¥${formData.price}` },
                { label: '时租价', value: formData.rentalPrice ? `¥${formData.rentalPrice}/时` : '未设置' },
                { label: '武器装备', value: formData.weapons || '未填写' },
                { label: '截图', value: images.length > 0 ? `${images.length} 张` : '未上传' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm py-1.5 border-b border-dark-border last:border-0">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-300 font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Fee summary */}
            {price > 0 && (
              <div className="card bg-green-500/5 border-green-500/20">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">您的收益</span>
                  <span className="text-xl font-bold text-green-400">¥{youGet.toFixed(2)}</span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>售价 ¥{price.toFixed(2)}</span>
                  <span>-平台5%</span>
                  <span>-税费1%</span>
                </div>
              </div>
            )}

            {/* Notice */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex gap-3 relative">
              {/* Submitting overlay */}
              {isSubmitting && (
                <div className="absolute inset-0 bg-dark-card/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 z-10">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-sm text-slate-400">正在发布账号...</p>
                </div>
              )}
              <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400">
                <p className="text-yellow-400/80 font-medium mb-1">发布须知</p>
                <p>账号发布后需经过审核，审核通过后将对买家展示。</p>
                <p>请确保账号信息真实有效，虚假信息将导致账号下架。</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => handleBack(2)} disabled={isSubmitting} className="btn-secondary flex-1 py-4 flex items-center justify-center gap-2 disabled:opacity-50">
                <ArrowLeft className="w-5 h-5" /> 返回修改
              </button>
              <button type="submit" disabled={isSubmitting}
                className="btn-primary flex-1 py-4 flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Sparkles className="w-5 h-5" /> 发布账号</>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
      </div> {/* end ternary */}
    </div>
    <style>{`
      @keyframes compress-pulse {
        0%, 100% { opacity: 1; transform: scaleX(1); }
        50% { opacity: 0.7; transform: scaleX(0.85); }
      }
    `}</style>
  );
};

const SellPageWithStyles: React.FC = () => (
  <>
    <SellPage />
    <style>{`
      @keyframes compress-pulse {
        0%, 100% { opacity: 1; transform: scaleX(1); }
        50% { opacity: 0.7; transform: scaleX(0.85); }
      }
    `}</style>
  </>
);

export default SellPageWithStyles;
