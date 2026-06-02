import { getVisiblePageNumbers, PAGE_SIZE_OPTIONS } from '../lib/usePagination';

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function TablePagination({
  page,
  totalPages,
  pageSize,
  total,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  if (total === 0) return null;

  const visiblePages = getVisiblePageNumbers(page, totalPages);
  const showRange = total > 0;

  return (
    <div className="table-pagination" role="navigation" aria-label="Table pagination">
      <div className="table-pagination__meta">
        {showRange ? (
          <span className="table-pagination__range">
            Affichage <strong>{startIndex}</strong>–<strong>{endIndex}</strong> sur <strong>{total}</strong>
          </span>
        ) : (
          <span className="table-pagination__range">Aucun résultat</span>
        )}
        <label className="table-pagination__size">
          <span className="table-pagination__size-label">Par page</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            aria-label="Nombre de lignes par page"
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-pagination__controls">
        <button
          type="button"
          className="table-pagination__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Page précédente"
        >
          ‹
        </button>

        <div className="table-pagination__pages" aria-label="Numéros de page">
          {visiblePages.map((p, idx) => {
            const prev = visiblePages[idx - 1];
            const showEllipsisBefore = prev !== undefined && p - prev > 1;
            return (
              <span key={p} className="table-pagination__page-wrap">
                {showEllipsisBefore && (
                  <span className="table-pagination__ellipsis" aria-hidden>…</span>
                )}
                <button
                  type="button"
                  className={`table-pagination__page${p === page ? ' table-pagination__page--active' : ''}`}
                  onClick={() => onPageChange(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              </span>
            );
          })}
        </div>

        <button
          type="button"
          className="table-pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Page suivante"
        >
          ›
        </button>
      </div>
    </div>
  );
}
