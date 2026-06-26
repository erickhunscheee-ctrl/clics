"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgePercent } from "lucide-react";

export interface HomePromotion {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  promotionMinPhotos: number;
  promotionDiscountBps: number;
}

interface HomePromotionsCarouselProps {
  promotions: HomePromotion[];
}

export function HomePromotionsCarousel({ promotions }: HomePromotionsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePromotion = promotions[activeIndex];

  useEffect(() => {
    if (promotions.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % promotions.length);
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [promotions.length]);

  if (!activePromotion) {
    return (
      <div className="relative overflow-hidden rounded-[1.35rem] border border-dashed border-slate-200 bg-white px-4 py-3 text-left shadow-sm">
        <div className="flex min-h-24 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F6F8FC] text-[#159BEF] shadow-sm">
            <BadgePercent size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-[#061337]">Promocoes em breve</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Albuns com promocao ativa aparecem aqui automaticamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const discountPercent = activePromotion.promotionDiscountBps / 100;

  return (
    <div className="relative overflow-hidden rounded-[1.35rem] bg-[#061337] px-4 py-3 text-left text-white shadow-[0_14px_40px_rgba(6,19,55,0.16)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-45 scale-105"
        style={{ backgroundImage: `url(${activePromotion.coverImageUrl || "/placeholder.jpg"})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061337]/95 via-[#061337]/80 to-[#7B3FF2]/55" />

      <div className="relative flex min-h-24 items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md">
            <BadgePercent size={13} />
            Promocao ativa
          </div>
          <p className="mt-2 line-clamp-1 text-sm font-bold text-white/90">
            {activePromotion.title}
          </p>
          <h2 className="mt-1 text-xl font-black leading-tight md:text-2xl">
            {discountPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% OFF a partir de {activePromotion.promotionMinPhotos} fotos
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            href={`/album/${activePromotion.slug}`}
            className="hidden items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-[#061337] transition hover:-translate-y-0.5 sm:inline-flex"
          >
            Ver album <ArrowRight size={14} />
          </Link>

          {promotions.length > 1 && (
            <div className="flex items-center gap-1.5">
              {promotions.map((promotion, index) => (
                <button
                  key={promotion.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Ver promocao ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
