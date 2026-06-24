"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ placeholder = "Buscar fotos incríveis...", className = "" }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [isPending, startTransition] = useTransition();

  // Atualiza o estado se o parâmetro de busca na URL mudar externamente
  useEffect(() => {
    setQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Função para executar a busca
  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  // Efeito para debounce de 400ms na digitação
  useEffect(() => {
    const delayDebounceId = setTimeout(() => {
      const currentParam = searchParams.get("search") || "";
      if (query !== currentParam) {
        handleSearch(query);
      }
    }, 400);

    return () => clearTimeout(delayDebounceId);
  }, [query]);

  const handleClear = () => {
    setQuery("");
    handleSearch("");
  };

  return (
    <div className={`relative flex items-center bg-[#F6F8FC] rounded-full px-4 py-2.5 border border-gray-200 transition-all focus-within:border-[#159BEF] focus-within:ring-2 focus-within:ring-[#159BEF]/10 ${className}`}>
      <Search size={18} style={{ color: "#9ca3af" }} className="flex-shrink-0 mr-2.5" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 w-full text-[#061337] pr-6"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-[#061337] transition-colors"
          type="button"
          aria-label="Limpar busca"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
