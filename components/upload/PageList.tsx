"use client";

interface PageListProps {
  totalPages: number;
  currentPage: number;
  selectedPages: Set<number>;
  thumbnails: string[];
  onSelectPage: (page: number) => Promise<void>;
  onTogglePage: (page: number) => void;
}

export function PageList({
  totalPages,
  currentPage,
  selectedPages,
  thumbnails,
  onSelectPage,
  onTogglePage
}: PageListProps) {
  if (totalPages === 0) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        上传 PDF 后显示页码列表
      </aside>
    );
  }

  return (
    <aside className="h-[70vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
      <ul className="space-y-2">
        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;
          const isActive = page === currentPage;
          const isChecked = selectedPages.has(page);
          const thumb = thumbnails[index];

          return (
            <li key={page}>
              <button
                type="button"
                onClick={async () => onSelectPage(page)}
                className={`w-full rounded-md border p-2 text-left ${
                  isActive ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"
                }`}
              >
                <label className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onTogglePage(page)}
                    onClick={(event) => event.stopPropagation()}
                  />
                  第 {page} 页
                </label>
                {thumb ? (
                  <img
                    src={thumb}
                    alt={`第 ${page} 页缩略图`}
                    className="h-auto w-full rounded border border-slate-200"
                  />
                ) : (
                  <div className="h-20 animate-pulse rounded bg-slate-100" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
