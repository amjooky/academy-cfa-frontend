import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export function usePagination<T>(items: T[], defaultPageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const startIndex = total === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  const sliced = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  const setPageSizeAndReset = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize: setPageSizeAndReset,
    total,
    totalPages,
    sliced,
    startIndex: total === 0 ? 0 : startIndex + 1,
    endIndex,
    hasMultiplePages: totalPages > 1,
  };
}

export function getVisiblePageNumbers(current: number, total: number): number[] {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
}
