import React, { useState, useCallback, useEffect } from 'react';
import { Account } from '../../types';
import { X, Scale, ChevronRight, Crown, Gamepad2, Check, Minus, Star, Zap } from 'lucide-react';

interface CompareItem {
  account: Account;
  addedAt: number;
}

interface CompareBarProps {
  items: CompareItem[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onCompare: () => void;
  maxItems?: number;
}

export const CompareBar: React.FC<CompareBarProps> = ({
  items,
  onRemove,
  onClear,
  onCompare,
  maxItems = 4,
}) => {
  const [visible, setVisible] = useState(true);

  if (items.length === 0 || !visible) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="glass border border-primary/30 shadow-2xl shadow-primary/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 flex-wrap justify-center max-w-[95vw]">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">
            已选择 <span className="text-primary font-bold">{items.length}</span> 个账号
          </span>
          <span className="text-xs text-slate-500">/ 最多 {maxItems} 个</span>
        </div>

        {/* Mini thumbnails */}
        <div className="flex items-center -space-x-2">
          {items.slice(0, maxItems).map((item) => (
            <div
              key={item.account.id}
              className="w-8 h-8 rounded-lg overflow-hidden border-2 border-dark ring-1 ring-primary/30 relative group"
            >
              {item.account.images?.[0] ? (
                <img src={item.account.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-dark flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-slate-600" />
                </div>
              )}
              <button
                onClick={() => onRemove(item.account.id)}
                aria-label="从对比中移除"
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
          {items.length > maxItems && (
            <div className="w-8 h-8 rounded-lg bg-dark border-2 border-dark-border flex items-center justify-center">
              <span className="text-[10px] text-slate-500">+{items.length - maxItems}</span>
            </div>
          )}
        </div>

        <button
          onClick={onCompare}
          disabled={items.length < 2}
          className="btn-primary !py-2 !px-4 text-sm disabled:opacity-40 flex items-center gap-1.5"
        >
          <Scale className="w-3.5 h-3.5" />
          对比
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClear}
          className="text-slate-500 hover:text-white transition-colors p-1"
          title="清除"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Comparison field row
const CompareRow: React.FC<{ label: string; values: string[]; isWinner?: boolean[]; highlight?: boolean }> = ({
  label,
  values,
  isWinner,
  highlight,
}) => (
  <tr className={highlight ? 'bg-primary/5' : ''}>
    <td className={`py-3 px-4 text-sm w-28 border-r border-dark-border align-top ${highlight ? 'text-primary font-medium' : 'text-slate-500'}`}>
      {label}
    </td>
    {values.map((val, i) => (
      <td
        key={i}
        className={`py-3 px-4 text-sm text-center align-top ${
          isWinner?.[i] ? 'bg-green-500/5' : ''
        } ${highlight ? (isWinner?.[i] ? 'text-green-400 font-semibold' : 'text-slate-300') : ''}`}
      >
        <span className={isWinner?.[i] && !highlight ? 'text-green-400 font-semibold' : ''}>
          {val}
        </span>
        {isWinner?.[i] && (
          <span className="ml-1 text-green-400 text-xs">✓ 最优</span>
        )}
      </td>
    ))}
    {values.length < 4 && Array.from({ length: 4 - values.length }).map((_, i) => (
      <td key={`empty-${i}`} className="py-3 px-4 text-slate-700 text-center">—</td>
    ))}
  </tr>
);

interface CompareModalProps {
  items: CompareItem[];
  onClose: () => void;
  onViewAccount: (id: number) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ items, onClose, onViewAccount }) => {
  const accounts = items.map((i) => i.account);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Find best values
  const prices = accounts.map((a) => a.price);
  const priceBest = prices.map((p, i) => p === Math.min(...prices, Infinity) && prices.filter(x => x === p).length === 1 ? i : -1);
  const skins = accounts.map((a) => a.skinCount || 0);
  const skinBest = skins.map((s, i) => s === Math.max(...skins, -Infinity) && skins.filter(x => x === s).length === 1 ? i : -1);
  const credits = accounts.map((a) => a.sellerCreditScore || 0);
  const creditBest = credits.map((c, i) => c > 0 && c === Math.max(...credits, -Infinity) && credits.filter(x => x === c).length === 1 ? i : -1);
  // Value = skins per 1000 yuan (higher = better deal)
  const valueScores = accounts.map((a) => a.price > 0 ? ((a.skinCount || 0) / a.price * 1000) : 0);
  const valueBest = valueScores.map((v, i) => v > 0 && v === Math.max(...valueScores, -Infinity) && valueScores.filter(x => x === v).length === 1 ? i : -1);

  const freshnessLabel = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    if (d < 1) return '今日';
    if (d < 7) return `${d}天前`;
    if (d < 30) return `${Math.floor(d / 7)}周前`;
    return `${Math.floor(d / 30)}月前`;
  };

  const fields = [
    { label: '游戏', values: accounts.map((a) => a.gameType || '—') },
    { label: '价格', values: accounts.map((a) => `¥${a.price}`), bestIdx: priceBest },
    { label: '段位', values: accounts.map((a) => a.gameRank || '未填写') },
    { label: '皮肤数量', values: accounts.map((a) => `${a.skinCount || 0} 个`), bestIdx: skinBest },
    { label: '所属英雄', values: accounts.map((a) => a.weapons || '未填写') },
    { label: '认证状态', values: accounts.map((a) => a.verificationStatus === 'VERIFIED' ? '✅ 已认证' : '⏳ 待认证') },
    { label: '时租价', values: accounts.map((a) => a.rentalPrice ? `¥${a.rentalPrice}/时` : '不支持') },
    {
      label: '💎 性价比',
      values: accounts.map((a, i) => a.price > 0 ? `${((a.skinCount || 0) / a.price * 1000).toFixed(1)} 皮肤/千元` : '—'),
      bestIdx: valueBest,
      highlight: true,
    },
    {
      label: '⭐ 卖家信用',
      values: accounts.map((a) => a.sellerCreditScore ? `${a.sellerCreditScore} 分` : '—'),
      bestIdx: creditBest,
    },
    {
      label: '🕐 上架时间',
      values: accounts.map((a) => freshnessLabel(a.createdAt)),
    },
    { label: '描述', values: accounts.map((a) => a.description?.slice(0, 60) || '暂无') },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-500 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">账号对比</h2>
              <p className="text-xs text-slate-500">选择最优方案</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account headers */}
        <div className="grid gap-4 p-4 border-b border-dark-border" style={{ gridTemplateColumns: `200px repeat(${accounts.length}, 1fr)` }}>
          <div /> {/* Spacer for label column */}
          {accounts.map((account) => (
            <div key={account.id} className="text-center">
              <div className="w-full aspect-video bg-dark rounded-xl overflow-hidden mb-2">
                {account.images?.[0] ? (
                  <img src={account.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="w-8 h-8 text-slate-700" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium line-clamp-1 mb-1">{account.title}</p>
              <div className="flex items-center justify-center gap-1 mb-2">
                {account.verificationStatus === 'VERIFIED' && (
                  <span className="text-yellow-400 text-xs flex items-center gap-0.5">
                    <Crown className="w-3 h-3" /> 已认证
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-primary mb-1">¥{account.price}</div>
              <button
                onClick={() => onViewAccount(account.id)}
                className="btn-primary !py-1.5 !px-3 text-xs w-full"
              >
                查看详情
              </button>
            </div>
          ))}
          {/* Fill remaining columns */}
          {accounts.length < 4 && Array.from({ length: 4 - accounts.length }).map((_, i) => (
            <div key={`empty-${i}`} className="text-center opacity-30">
              <div className="w-full aspect-video bg-dark rounded-xl mb-2 flex items-center justify-center border-2 border-dashed border-dark-border">
                <span className="text-slate-600 text-xs">空</span>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <tbody>
              {fields.map((field) => (
                <CompareRow
                  key={field.label}
                  label={field.label}
                  values={field.values}
                  isWinner={field.bestIdx?.map((idx) => idx >= 0)}
                  highlight={field.highlight}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendation */}
        {accounts.length >= 2 && (
          <div className="px-6 py-4 border-t border-dark-border flex-shrink-0 bg-gradient-to-r from-green-500/5 to-transparent">
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> 智能推荐
            </p>
            <p className="text-sm text-slate-300">
              {(() => {
                const lowestPriceIdx = prices.indexOf(Math.min(...prices, Infinity));
                const mostSkinsIdx = skins.indexOf(Math.max(...skins, -Infinity));
                const bestValueIdx = valueScores.indexOf(Math.max(...valueScores, -Infinity));
                const bestCreditIdx = credits.indexOf(Math.max(...credits, -Infinity));
                const recommendations = [];
                if (lowestPriceIdx >= 0) recommendations.push({ idx: lowestPriceIdx, label: '价格最优', color: 'text-primary' });
                if (bestValueIdx >= 0 && valueScores[bestValueIdx] > 0) recommendations.push({ idx: bestValueIdx, label: '性价比最高', color: 'text-yellow-400' });
                if (bestCreditIdx >= 0 && credits[bestCreditIdx] > 0) recommendations.push({ idx: bestCreditIdx, label: '卖家信用最佳', color: 'text-blue-400' });

                if (recommendations.length === 0) return null;
                return (
                  <>
                    {recommendations.map((r, i) => (
                      <span key={r.label}>
                        {i > 0 && ' · '}
                        <span className={r.color}>{r.label}</span>
                        {': '}
                        <span className="text-white">{accounts[r.idx].title}</span>
                      </span>
                    ))}
                  </>
                );
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
