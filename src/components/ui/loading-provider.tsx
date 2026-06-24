"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Image from "next/image";

interface LoadingContextType {
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, withLoading }}>
      {children}
      {isLoading && <PageLoader />}
    </LoadingContext.Provider>
  );
}

function PageLoader() {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: "rgba(246,248,252,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "linear-gradient(135deg, #159BEF, #7B3FF2)", animationDuration: "1.2s" }}
          />
          <div className="relative w-16 h-16 flex items-center justify-center">
            <Image
              src="/logo_clics.png"
              alt="CLICS"
              width={64}
              height={64}
              className="w-16 h-16 object-contain drop-shadow-[0_4px_24px_rgba(21,155,239,0.3)]"
              priority
            />
          </div>
        </div>

        {/* Animated gradient bar */}
        <div className="w-32 h-1 rounded-full overflow-hidden bg-slate-200">
          <div
            className="h-full rounded-full animate-[slide_1.2s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)",
              width: "50%",
            }}
          />
        </div>

        <p
          className="text-sm font-semibold text-[#061337] opacity-60"
          style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
        >
          Carregando…
        </p>
      </div>

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
