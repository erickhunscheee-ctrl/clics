"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgePercent, ChevronLeft, ChevronRight } from "lucide-react";

export interface HomePromotion {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  promotionMinPhotos: number;
  promotionDiscountBps: number;
}

export function HomePromotionsCarousel({ promotions }: { promotions: HomePromotion[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePromotion = promotions[activeIndex % promotions.length];
  if (!activePromotion) return null;
  const discountPercent = activePromotion.promotionDiscountBps / 100;
  return (
    <section aria-label="Promoções dos álbuns" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <BadgePercent size={22} className="shrink-0 text-sky-700" />
        <div aria-live="polite"><p className="text-sm font-semibold text-slate-900">{discountPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% de desconto a partir de {activePromotion.promotionMinPhotos} fotos</p><p className="mt-1 text-xs text-slate-600">{activePromotion.title}</p></div>
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/album/${activePromotion.slug}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sky-800">Ver álbum <ArrowRight size={16} /></Link>
        {promotions.length > 1 && <div className="flex items-center gap-1 border-l border-sky-200 pl-3" data-loading-ignore="true">
          <button type="button" aria-label="Promoção anterior" onClick={() => setActiveIndex((current) => (current - 1 + promotions.length) % promotions.length)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-sky-100"><ChevronLeft size={17} /></button>
          <span className="text-xs text-slate-500">{activeIndex % promotions.length + 1}/{promotions.length}</span>
          <button type="button" aria-label="Próxima promoção" onClick={() => setActiveIndex((current) => (current + 1) % promotions.length)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-sky-100"><ChevronRight size={17} /></button>
        </div>}
      </div>
    </section>
  );
}
