import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  current, 
  total, 
  pageSize,
  onChange 
}) => {
  const totalPages = Math.ceil(total / pageSize);
  
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className="p-2 rounded-lg bg-dark-lighter border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-700"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex items-center space-x-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page: number;
          if (totalPages <= 5) {
            page = i + 1;
          } else if (current <= 3) {
            page = i + 1;
          } else if (current >= totalPages - 2) {
            page = totalPages - 4 + i;
          } else {
            page = current - 2 + i;
          }
          
          return (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                current === page 
                  ? 'bg-primary text-white' 
                  : 'bg-dark-lighter border border-gray-800 hover:border-gray-700'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= totalPages}
        className="p-2 rounded-lg bg-dark-lighter border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-700"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
