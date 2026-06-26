import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { HomePromotionsCarousel, type HomePromotion } from "@/components/home/home-promotions-carousel";

interface HomeHeroSectionProps {
  sellerHref: string;
  promotions: HomePromotion[];
}

export function HomeHeroSection({ sellerHref, promotions }: HomeHeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white bg-white px-5 py-6 shadow-[0_24px_80px_rgba(6,19,55,0.08)] md:px-8 md:py-8">
      <div className="absolute left-1/2 top-0 h-1 w-14 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#159BEF] to-[#7B3FF2]" />
      <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-[#159BEF]/10 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-[#7B3FF2]/10 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-stretch">
        <div className="flex flex-col justify-center text-center lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7B3FF2]">
            Marketplace de fotos
          </p>
          <div className="mt-5 flex items-center justify-center gap-4 lg:justify-start">
            <Image
              src="/logo_clics.png"
              alt="CLICS"
              width={112}
              height={112}
              className="h-16 w-16 object-contain drop-shadow-[0_18px_40px_rgba(21,155,239,0.2)] sm:h-20 sm:w-20"
              priority
            />
            <span
              className="text-4xl font-semibold tracking-[0.2em] text-[#061337] sm:text-5xl"
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
              href={sellerHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#7B3FF2]/40 bg-white px-5 py-3 text-sm font-bold text-[#7B3FF2] transition hover:-translate-y-0.5 hover:border-[#7B3FF2]"
            >
              Vender fotos <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <HomePromotionsCarousel promotions={promotions} />
      </div>
    </section>
  );
}
