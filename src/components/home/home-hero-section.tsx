import { Suspense } from "react";
import { SearchBar } from "./search-bar";

export function HomeHeroSection() {
  return (
    <section className="border-b border-slate-200 pb-8 pt-6 sm:pb-10 sm:pt-10">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Seus momentos, por outro olhar</p>
      <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">Encontre seu álbum.<br />Escolha suas fotos.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">Explore os eventos, veja cada detalhe e escolha as fotos que fazem parte da sua história.</p>
      <Suspense fallback={<div className="mt-6 h-14 max-w-xl animate-pulse rounded-xl bg-slate-100" />}>
        <SearchBar placeholder="Buscar evento, local ou fotógrafo" className="mt-6 max-w-xl" />
      </Suspense>
    </section>
  );
}
