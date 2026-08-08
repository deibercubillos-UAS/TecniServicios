"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COMPARE_CHANGED_EVENT, MAX_COMPARE, clearCompareList, getCompareList } from "@/lib/compare-list";

export function CompareBar() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    function sync() {
      setIds(getCompareList().map((item) => item.id));
    }
    sync();
    window.addEventListener(COMPARE_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COMPARE_CHANGED_EVENT, sync);
  }, []);

  if (ids.length < 2) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
        <span className="text-sm text-text">
          {ids.length} de {MAX_COMPARE} productos para comparar
        </span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={clearCompareList} className="text-sm text-text-muted hover:text-text">
            Vaciar
          </button>
          <Link
            href={`/comparador?ids=${ids.join(",")}`}
            className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-hover"
          >
            Comparar
          </Link>
        </div>
      </div>
    </div>
  );
}
