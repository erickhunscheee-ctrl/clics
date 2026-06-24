"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Home, Search, CalendarDays, Heart, User } from "lucide-react";

const regularNavItems = [
  {
    label: "Início",
    href: "/",
    icon: Home,
  },
  {
    label: "Explorar",
    href: "/#explorar",
    icon: Search,
    circled: true,
  },
  {
    label: "Eventos",
    href: "/#eventos",
    icon: CalendarDays,
    circled: true,
  },
];

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

export function MobileNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const favoritesOpen = searchParams.get("favorites") === "true";
  const profileOpen = searchParams.get("profile") === "true";

  const handleFavoritesOpen = () => {
    const params = new URLSearchParams(window.location.search);
    if (favoritesOpen) {
      params.delete("favorites");
    } else {
      params.set("favorites", "true");
      params.delete("profile"); // close profile if open
    }
    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const handleProfileOpen = () => {
    const params = new URLSearchParams(window.location.search);
    if (profileOpen) {
      params.delete("profile");
    } else {
      params.set("profile", "true");
      params.delete("favorites"); // close favorites if open
    }
    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <nav
      className="md:hidden fixed bottom-4 left-4 right-4 z-50"
      aria-label="Navegação principal mobile"
    >
      <div
        className="bg-white rounded-2xl px-2 py-3"
        style={{ boxShadow: "0 4px 32px 0 rgba(6,19,55,0.12)" }}
      >
        <div className="flex items-center justify-around">
          {/* Regular nav items */}
          {regularNavItems.map(({ label, href, icon: Icon, circled }) => {
            const isActive =
              pathname === href || (href === "/" && pathname === "/");

            return (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-1.5 min-w-[56px] py-0.5 transition-opacity active:opacity-70"
                aria-current={isActive ? "page" : undefined}
              >
                <NavIcon icon={Icon} isActive={isActive} circled={circled} />
                <NavLabel label={label} isActive={isActive} />
              </Link>
            );
          })}

          {/* Favorites — opens Bottom Sheet via query param */}
          <button
            onClick={handleFavoritesOpen}
            className="flex flex-col items-center gap-1.5 min-w-[56px] py-0.5 transition-opacity active:opacity-70"
            aria-label="Abrir favoritos"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border-[1.5px] transition-all"
              style={
                favoritesOpen
                  ? {
                      borderColor: "transparent",
                      background:
                        "linear-gradient(white, white) padding-box, linear-gradient(90deg, #159BEF, #7B3FF2) border-box",
                    }
                  : { borderColor: "#061337" }
              }
            >
              <Heart
                size={18}
                strokeWidth={1.8}
                className="transition-colors"
                style={{
                  color: favoritesOpen ? "#EF4444" : "#061337",
                  fill: favoritesOpen ? "#EF4444" : "none",
                }}
              />
            </div>
            <NavLabel label="Favoritos" isActive={favoritesOpen} />
          </button>

          {/* Profile — opens Bottom Sheet via query param */}
          <button
            onClick={handleProfileOpen}
            className="flex flex-col items-center gap-1.5 min-w-[56px] py-0.5 transition-opacity active:opacity-70"
            aria-label="Abrir perfil"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border-[1.5px] transition-all"
              style={
                profileOpen
                  ? {
                      borderColor: "transparent",
                      background:
                        "linear-gradient(white, white) padding-box, linear-gradient(90deg, #159BEF, #7B3FF2) border-box",
                    }
                  : { borderColor: "#061337" }
              }
            >
              <User
                size={18}
                strokeWidth={1.8}
                style={{ color: profileOpen ? "#7B3FF2" : "#061337" }}
              />
            </div>
            <NavLabel label="Perfil" isActive={profileOpen} />
          </button>
        </div>
      </div>
    </nav>
  );
}
