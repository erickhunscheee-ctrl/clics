import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";

interface HomeHeroSectionProps {
  sellerHref: string;
}

export function HomeHeroSection({ sellerHref }: HomeHeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white bg-white px-6 py-10 text-center shadow-[0_24px_80px_rgba(6,19,55,0.08)] md:px-12 md:py-14">
      <div className="absolute left-1/2 top-0 h-1 w-14 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#159BEF] to-[#7B3FF2]" />
      <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-[#159BEF]/10 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-[#7B3FF2]/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#7B3FF2]">
          Marketplace de fotos
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Image
            src="/logo_clics.png"
            alt="CLICS"
            width={152}
            height={152}
            className="h-28 w-28 object-contain drop-shadow-[0_18px_40px_rgba(21,155,239,0.2)] sm:h-36 sm:w-36"
            priority
          />
          <span
            className="text-6xl font-semibold tracking-[0.28em] text-[#061337] sm:text-7xl md:text-8xl"
            style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
          >
            CLICS
          </span>
        </div>
        <h1 className="mt-8 text-3xl font-black tracking-tight text-[#061337] md:text-5xl">
          Encontre seu evento e compre suas{" "}
          <span className="bg-gradient-to-r from-[#159BEF] to-[#7B3FF2] bg-clip-text text-transparent">
            fotos favoritas
          </span>{" "}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
          Acesse albuns publicados por fotografos, selecione as imagens que
          deseja e finalize o pagamento com seguranca.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="#albuns"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#159BEF] to-[#7B3FF2] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_36px_rgba(21,155,239,0.24)] transition hover:-translate-y-0.5"
          >
            Ver albuns <ShoppingCart size={16} />
          </Link>
          <Link
            href={sellerHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#7B3FF2]/40 bg-white px-6 py-3 text-sm font-bold text-[#7B3FF2] transition hover:-translate-y-0.5 hover:border-[#7B3FF2]"
          >
            Vender fotos <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
