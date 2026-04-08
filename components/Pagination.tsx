

import React from 'react';
import { PaginationInfo } from '../types';
import Button from './Button';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { page, totalPages } = pagination;

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    if (startPage === 1 && endPage < totalPages) {
      endPage = Math.min(totalPages, startPage + 4);
    } else if (endPage === totalPages && startPage > 1) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={i === page ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onPageChange(i)}
          className="mx-1"
          disabled={i === page}
        >
          {i}
        </Button>
      );
    }
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-3 py-6">
      <Button
        variant="secondary"
        size="md"
        className="!rounded-xl px-6 py-3 text-sm font-black uppercase tracking-widest"
        onClick={handlePrevious}
        disabled={page === 1}
      >
        Prev
      </Button>
      <div className="flex space-x-2">
        {renderPageNumbers()}
      </div>
      <Button
        variant="secondary"
        size="md"
        className="!rounded-xl px-6 py-3 text-sm font-black uppercase tracking-widest"
        onClick={handleNext}
        disabled={page === totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;