"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
  Suspense,
} from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

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

/**
 * Inner component that watches route changes to stop loading.
 * Must be inside Suspense because useSearchParams() requires it.
 */
function NavigationWatcher({ onNavigationComplete }: { onNavigationComplete: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first render — we only want to react to changes
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Route changed → navigation is done → stop loading
    onNavigationComplete();
  }, [pathname, searchParams, onNavigationComplete]);

  return null;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  // Safety-net timeout ref: if route never changes (e.g. same-page button),
  // we still stop the loader after a maximum wait.
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafetyTimeout = useCallback(() => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  }, []);

  const stopLoading = useCallback(() => {
    clearSafetyTimeout();
    setIsLoading(false);
  }, [clearSafetyTimeout]);

  const startLoading = useCallback(() => {
    clearSafetyTimeout();
    setIsLoading(true);
    // Safety net: never keep loading for more than 8 seconds
    safetyTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      safetyTimeoutRef.current = null;
    }, 8000);
  }, [clearSafetyTimeout]);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      clearSafetyTimeout();
      setIsLoading(true);
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [clearSafetyTimeout, stopLoading]
  );

  // Listen for clicks on navigable elements to start loading
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

      // Only trigger for <a> tags that have an href pointing to a different page
      // (avoid triggering for buttons that don't navigate)
      if (actionable.tagName === "A") {
        const href = (actionable as HTMLAnchorElement).href;
        const currentUrl = window.location.href;
        // Same-page anchor or javascript: links → skip
        if (!href || href.startsWith("javascript:") || href === currentUrl) return;
        // Same origin navigation → start loading
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return;
          // Same pathname + search → skip (no real navigation will happen)
          if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        } catch {
          return;
        }
      }

      startLoading();
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [startLoading]);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, withLoading }}>
      {children}
      {/* NavigationWatcher detects when the route actually changes and stops the loader */}
      <Suspense fallback={null}>
        <NavigationWatcher onNavigationComplete={stopLoading} />
      </Suspense>
      {isLoading && <PageLoader />}
    </LoadingContext.Provider>
  );
}

function PageLoader() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200] flex flex-col items-center justify-center"
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
