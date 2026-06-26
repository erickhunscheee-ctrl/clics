"use client";

import { useEffect, useState } from "react";
import { CreditCard, Download, Shield } from "lucide-react";

const highlights = [
  {
    icon: CreditCard,
    title: "Pague em ate 12x no cartao",
    text: "Escolha suas fotos e parcele pelo Mercado Pago direto no checkout.",
  },
  {
    icon: Download,
    title: "Download liberado apos pagamento",
    text: "Depois da confirmacao, os arquivos ficam disponiveis na area do pedido.",
  },
  {
    icon: Shield,
    title: "Compra segura pelo Mercado Pago",
    text: "Pagamento protegido, com Pix e cartao em uma experiencia simples.",
  },
];

export function HomeHighlightsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeHighlight = highlights[activeIndex];
  const Icon = activeHighlight.icon;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % highlights.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-100 bg-[#F6F8FC] p-5 text-left shadow-sm">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#159BEF]/10 blur-2xl" />
      <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-[#7B3FF2]/10 blur-2xl" />

      <div className="relative min-h-44">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#159BEF] shadow-sm">
          <Icon size={24} />
        </div>
        <p className="mt-5 text-xl font-black leading-tight text-[#061337] md:text-2xl">
          {activeHighlight.title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {activeHighlight.text}
        </p>

        <div className="mt-6 flex items-center gap-1.5">
          {highlights.map((highlight, index) => (
            <button
              key={highlight.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? "w-7 bg-[#159BEF]" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Ver destaque ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
