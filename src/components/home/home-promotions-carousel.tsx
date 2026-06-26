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
      <div className="relative min-h-56 overflow-hidden rounded-[1.5rem] border border-dashed border-slate-200 bg-[#F6F8FC] p-6 text-left">
        <div className="flex h-full min-h-44 flex-col justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#159BEF] shadow-sm">
            <BadgePercent size={22} />
          </div>
          <h2 className="mt-4 text-xl font-black text-[#061337]">Promocoes em breve</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Quando houver albuns com promocao ativa, eles aparecem aqui automaticamente.
          </p>
        </div>
      </div>
    );
  }

  const discountPercent = activePromotion.promotionDiscountBps / 100;

  return (
    <div className="relative min-h-56 overflow-hidden rounded-[1.5rem] bg-[#061337] p-5 text-left text-white shadow-[0_18px_50px_rgba(6,19,55,0.18)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35 blur-[1px] scale-105"
        style={{ backgroundImage: `url(${activePromotion.coverImageUrl || "/placeholder.jpg"})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#061337] via-[#061337]/85 to-[#7B3FF2]/70" />

      <div className="relative flex min-h-48 flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md">
            <BadgePercent size={13} />
            Promocao ativa
          </div>
          <h2 className="mt-5 max-w-sm text-2xl font-black leading-tight md:text-3xl">
            {discountPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% OFF
          </h2>
          <p className="mt-2 text-sm font-semibold text-white/85">
            A partir de {activePromotion.promotionMinPhotos} fotos no album
          </p>
          <p className="mt-1 line-clamp-1 text-lg font-bold text-white">
            {activePromotion.title}
          </p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <Link
            href={`/album/${activePromotion.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-[#061337] transition hover:-translate-y-0.5"
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
