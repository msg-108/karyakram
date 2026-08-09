import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

export interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalCount,
  pageSize = 10,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-4 border-t border-slate-200 text-sm">
      <p className="text-slate-500 text-xs sm:text-sm">
        Showing page <span className="font-semibold text-slate-900">{currentPage}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalPages}</span> ({totalCount} items)
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
