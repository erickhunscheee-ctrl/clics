import Link from "next/link";
import { ArrowRight, CreditCard, Download, Shield, ShoppingCart } from "lucide-react";

export function HomeHeroSection() {
  const contactHref = "https://wa.me/55519991261";
  const highlights = [
    { icon: CreditCard, text: "Pague em ate 12x no cartao" },
    { icon: Download, text: "Download liberado apos pagamento" },
    { icon: Shield, text: "Compra segura pelo Mercado Pago" },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white bg-white px-5 py-6 shadow-[0_24px_80px_rgba(6,19,55,0.08)] md:px-8 md:py-8">
      <div className="absolute left-1/2 top-0 h-1 w-14 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#159BEF] to-[#7B3FF2]" />
      <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-[#159BEF]/10 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-[#7B3FF2]/10 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="flex flex-col justify-center text-center lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7B3FF2]">
            Marketplace de fotos
          </p>
          <div className="mt-5 flex items-center justify-center lg:justify-start">
            <span
              className="text-4xl font-semibold tracking-[0.24em] text-[#061337] sm:text-5xl"
              style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
            >
              CLICS
            </span>
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-[#061337] md:text-4xl">
            Encontre seu evento e compre suas{" "}
            <span className="bg-gradient-to-r from-[#159BEF] to-[#7B3FF2] bg-clip-text text-transparent">
              fotos favoritas
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500 md:text-base">
            Acesse albuns publicados por fotografos, selecione as imagens que deseja e finalize o pagamento com seguranca.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:justify-start">
            <Link
              href="#albuns"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#159BEF] to-[#7B3FF2] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_36px_rgba(21,155,239,0.24)] transition hover:-translate-y-0.5"
            >
              Ver albuns <ShoppingCart size={16} />
            </Link>
            <Link
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#7B3FF2]/40 bg-white px-5 py-3 text-sm font-bold text-[#7B3FF2] transition hover:-translate-y-0.5 hover:border-[#7B3FF2]"
            >
              Entre em contato <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          {highlights.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-[#F6F8FC] p-4 text-left shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#159BEF] shadow-sm">
                <Icon size={21} />
              </div>
              <div>
                <p className="text-sm font-black text-[#061337]">{text}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Plataforma simples para escolher fotos e finalizar a compra sem depender do fotografo.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
