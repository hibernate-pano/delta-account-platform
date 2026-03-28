import React from 'react';
import { getPageNumbers } from '../../hooks/usePagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  totalCount?: number;
  pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onNext,
  onPrev,
  onFirst,
  onLast,
  canGoNext = currentPage < totalPages,
  canGoPrev = currentPage > 1,
  totalCount,
  pageSize = 12,
}) => {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {totalCount != null && (
        <span className="text-xs text-slate-500 mr-1">
          第 {currentPage}/{totalPages} 页 · 共 {totalCount} 条
        </span>
      )}
      <button
        onClick={onFirst}
        disabled={!canGoPrev}
        className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30 active:scale-95"
      >
        首页
      </button>
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30 active:scale-95"
      >
        上一页
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark ${
            currentPage === page
              ? 'bg-primary text-white shadow-[0_4px_14px_rgba(99,102,241,0.45)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.6)]'
              : 'bg-dark-lighter text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30 active:scale-95"
      >
        下一页
      </button>
      <button
        onClick={onLast}
        disabled={!canGoNext}
        className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30 active:scale-95"
      >
        末页
      </button>
    </div>
  );
};
