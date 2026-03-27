import { useState, useCallback } from 'react';

export interface PaginationOptions {
  defaultPage?: number;
  defaultSize?: number;
}

export interface PaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  goNext: () => void;
  goPrev: () => void;
  goFirst: () => void;
  goLast: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination(options: PaginationOptions = {}): PaginationResult {
  const { defaultPage = 1, defaultSize = 12 } = options;
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [totalPages, setTotalPages] = useState(1);

  const goNext = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const goFirst = useCallback(() => setCurrentPage(1), []);
  const goLast = useCallback(() => setCurrentPage(totalPages), [totalPages]);

  return {
    currentPage,
    pageSize: defaultSize,
    totalPages,
    setCurrentPage,
    setTotalPages,
    goNext,
    goPrev,
    goFirst,
    goLast,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
  };
}

// Ellipsis-aware page number list
export function getPageNumbers(currentPage: number, totalPages: number, maxVisible = 5): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }
  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
}
