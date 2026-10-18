"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps { placeholder?: string; className?: string }

export function SearchBar(props: SearchBarProps) {
  const params = useSearchParams();
  const initialQuery = params.get("search") || "";
  return <SearchForm key={initialQuery} initialQuery={initialQuery} {...props} />;
}

function SearchForm({ initialQuery, placeholder = "Buscar evento, local ou fotógrafo", className = "" }: SearchBarProps & { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  function search(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("search", value.trim());
    else params.delete("search");
    startTransition(() => router.push(`/?${params.toString()}#albuns`, { scroll: false }));
  }

  return (
    <form role="search" aria-label="Buscar álbuns" aria-busy={isPending} data-loading-ignore="true" onSubmit={(event) => { event.preventDefault(); search(query); }} className={`flex min-h-14 items-center gap-2 rounded-xl border border-slate-300 bg-white p-1.5 pl-4 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100 ${className}`}>
      <Search size={19} className="shrink-0 text-slate-400" aria-hidden="true" />
      <input type="search" aria-label="Evento, local ou fotógrafo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 [&::-webkit-search-cancel-button]:hidden" />
      {query && <button type="button" aria-label="Limpar busca" onClick={() => { setQuery(""); search(""); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button>}
      <button type="submit" disabled={isPending} className="flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
        {isPending ? <Loader2 size={18} className="animate-spin" aria-label="Buscando" /> : "Buscar"}
      </button>
    </form>
  );
}
