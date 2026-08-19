import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingSkeleton } from "./states";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  pageSize?: number;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  error,
  onRetry,
  onRowClick,
  emptyTitle = "No records found",
  emptyDescription = "Nothing matches the current filters. Adjust the query or widen the time range.",
  emptyAction,
  pageSize = 12,
  total,
  page,
  onPageChange,
  dense,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [localPage, setLocalPage] = useState(1);
  const serverPaged = typeof page === "number" && typeof onPageChange === "function";

  const sorted = useMemo(() => {
    if (!rows) return [];
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const r = av > bv ? 1 : av < bv ? -1 : 0;
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, columns]);

  const currentPage = serverPaged ? page! : localPage;
  const pageRows = serverPaged ? sorted : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalRows = total ?? sorted.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0)
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2/60 text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                    c.className,
                  )}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                      onClick={() =>
                        setSort((s) =>
                          s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "desc" },
                        )
                      }
                    >
                      {c.header}
                      <ArrowUpDown className="size-3" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-t border-border transition-colors",
                  onRowClick && "cursor-pointer hover:bg-accent/40",
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn(dense ? "px-3 py-1.5" : "px-3 py-2.5", "align-middle", c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="mono">
          {totalRows.toLocaleString()} record{totalRows === 1 ? "" : "s"} · page {currentPage} of {pageCount}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => (serverPaged ? onPageChange!(currentPage - 1) : setLocalPage((p) => p - 1))}
          >
            <ChevronLeft className="size-3.5" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => (serverPaged ? onPageChange!(currentPage + 1) : setLocalPage((p) => p + 1))}
          >
            Next <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
