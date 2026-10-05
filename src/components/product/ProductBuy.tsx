"use client";

import { useState } from "react";
import { ProductAction } from "@/components/AddToBagButton";
import { Stepper } from "@/components/BagDrawer";
import type { Product } from "@/data/products";

export function ProductBuy({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const orderable = product.price !== null && !product.soldOut;
  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
      {orderable && (
        <div className="flex items-center gap-3">
          <span className="text-muted">Quantity</span>
          <Stepper value={qty} onChange={(q) => setQty(Math.max(1, q))} label={product.name} />
        </div>
      )}
      <ProductAction
        product={product}
        qty={qty}
        size="lg"
        className="min-h-[52px] flex-1 text-[1.02rem]"
        flyFrom={() => document.querySelector("[data-gallery-main]")}
      />
    </div>
  );
}
