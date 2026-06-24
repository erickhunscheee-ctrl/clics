"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Home, Images, Heart, User } from "lucide-react";

function NavIcon({
  icon: Icon,
  isActive,
  circled,
}: {
  icon: typeof Home;
  isActive: boolean;
  circled?: boolean;
}) {
  if (circled) {
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center border-[1.5px] transition-all"
        style={
          isActive
            ? {
                borderColor: "transparent",
                background:
                  "linear-gradient(white, white) padding-box, linear-gradient(90deg, #159BEF, #7B3FF2) border-box",
              }
            : { borderColor: "#061337" }
        }
      >
        <Icon
          size={18}
          strokeWidth={1.8}
          style={{ color: isActive ? "#159BEF" : "#061337" }}
        />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 flex items-center justify-center">
      <Icon
        size={22}
        strokeWidth={1.8}
        style={isActive ? { stroke: "url(#navGradient)" } : { color: "#061337" }}
      />
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#159BEF" />
            <stop offset="100%" stopColor="#7B3FF2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function NavLabel({ label, isActive }: { label: string; isActive: boolean }) {
  return (
    <span
      className="text-[10px] font-semibold leading-none"
      style={
        isActive
          ? {
              background: "linear-gradient(90deg, #159BEF, #7B3FF2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }
          : { color: "#061337" }
      }
    >
      {label}
    </span>
  );
}

function SheetButton({
  isOpen,
  onToggle,
  label,
  ariaLabel,
  activeColor,
  children,
}: {
  isOpen: boolean;
  onToggle: () => void;
  label: string;
  ariaLabel: string;
  activeColor: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-col items-center gap-1.5 min-w-[52px] py-0.5 transition-opacity active:opacity-70"
      aria-label={ariaLabel}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center border-[1.5px] transition-all"
        style={
          isOpen
            ? {
                borderColor: "transparent",
                background:
                  "linear-gradient(white, white) padding-box, linear-gradient(90deg, #159BEF, #7B3FF2) border-box",
              }
            : { borderColor: "#061337" }
        }
      >
        {children}
      </div>
      <NavLabel label={label} isActive={isOpen} />
    </button>
  );
}

export function MobileNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const albumsOpen = searchParams.get("albums") === "true";
  const favoritesOpen = searchParams.get("favorites") === "true";
  const profileOpen = searchParams.get("profile") === "true";

  const openSheet = (key: "albums" | "favorites" | "profile") => {
    const current = searchParams.get(key) === "true";
    const params = new URLSearchParams(window.location.search);
    // Close all sheets
    params.delete("albums");
    params.delete("favorites");
    params.delete("profile");
    // Toggle clicked one
    if (!current) params.set(key, "true");
    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const isHomeActive = pathname === "/";

  return (
    <nav
      className="md:hidden fixed bottom-4 left-4 right-4 z-50"
      aria-label="Navegação principal mobile"
    >
      <div
        className="bg-white rounded-2xl px-1 py-3"
        style={{ boxShadow: "0 4px 32px 0 rgba(6,19,55,0.12)" }}
      >
        <div className="flex items-center justify-around">
          {/* Início — direct link */}
          <Link
            href="/"
            className="flex flex-col items-center gap-1.5 min-w-[52px] py-0.5 transition-opacity active:opacity-70"
            aria-current={isHomeActive ? "page" : undefined}
          >
            <NavIcon icon={Home} isActive={isHomeActive} />
            <NavLabel label="Início" isActive={isHomeActive} />
          </Link>

          {/* Álbuns — bottom sheet */}
          <SheetButton
            isOpen={albumsOpen}
            onToggle={() => openSheet("albums")}
            label="Álbuns"
            ariaLabel="Abrir álbuns"
            activeColor="#7B3FF2"
          >
            <Images
              size={18}
              strokeWidth={1.8}
              style={{ color: albumsOpen ? "#7B3FF2" : "#061337" }}
            />
          </SheetButton>

          {/* Favoritos — bottom sheet */}
          <SheetButton
            isOpen={favoritesOpen}
            onToggle={() => openSheet("favorites")}
            label="Favoritos"
            ariaLabel="Abrir favoritos"
            activeColor="#EF4444"
          >
            <Heart
              size={18}
              strokeWidth={1.8}
              style={{
                color: favoritesOpen ? "#EF4444" : "#061337",
                fill: favoritesOpen ? "#EF4444" : "none",
              }}
            />
          </SheetButton>

          {/* Perfil — bottom sheet */}
          <SheetButton
            isOpen={profileOpen}
            onToggle={() => openSheet("profile")}
            label="Perfil"
            ariaLabel="Abrir perfil"
            activeColor="#7B3FF2"
          >
            <User
              size={18}
              strokeWidth={1.8}
              style={{ color: profileOpen ? "#7B3FF2" : "#061337" }}
            />
          </SheetButton>
        </div>
      </div>
    </nav>
  );
}
