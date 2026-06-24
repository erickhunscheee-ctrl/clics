"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import Image from "next/image";

interface LoadingContextType {
  startLoading: (durationMs?: number) => void;
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopLoading = useCallback(() => {
    clearLoadingTimeout();
    setIsLoading(false);
  }, [clearLoadingTimeout]);

  const startLoading = useCallback(
    (durationMs = 700) => {
      clearLoadingTimeout();
      setIsLoading(true);
      if (durationMs > 0) {
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          timeoutRef.current = null;
        }, durationMs);
      }
    },
    [clearLoadingTimeout]
  );

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    clearLoadingTimeout();
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      stopLoading();
    }
  }, [clearLoadingTimeout, stopLoading]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const actionable = target.closest(
        "button, a, [role='button'], input[type='submit']"
      );
      if (!actionable) return;
      if (actionable.matches("[disabled], [aria-disabled='true']")) return;
      if (actionable.closest("[data-loading-ignore='true']")) return;

      startLoading(650);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [startLoading]);

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
              src="/icone_clics.png"
              alt="CLICS"
              width={80}
              height={80}
              className="h-20 w-20 object-contain drop-shadow-[0_4px_24px_rgba(21,155,239,0.3)]"
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
