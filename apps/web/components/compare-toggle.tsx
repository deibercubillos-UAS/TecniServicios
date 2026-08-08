"use client";

import { useEffect, useState } from "react";
import { MAX_COMPARE, getCompareList, isInCompareList, toggleCompareItem } from "@/lib/compare-list";

export function CompareToggle({ productId, categoryId }: { productId: string; categoryId: string }) {
  const [checked, setChecked] = useState(false);
  const [atLimit, setAtLimit] = useState(false);

  useEffect(() => {
    setChecked(isInCompareList(productId));
    setAtLimit(getCompareList().length >= MAX_COMPARE);
  }, [productId]);

  function handleChange() {
    const next = toggleCompareItem({ id: productId, categoryId });
    setChecked(next.some((item) => item.id === productId));
    setAtLimit(next.length >= MAX_COMPARE);
  }

  return (
    <label
      className="flex items-center gap-2 text-xs text-text-muted"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={!checked && atLimit}
        onChange={handleChange}
        aria-label="Agregar al comparador"
      />
      Comparar
    </label>
  );
}
