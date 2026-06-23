"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, CalendarDays, Heart, User } from "lucide-react";

const navItems = [
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
  {
    label: "Favoritos",
    href: "/#favoritos",
    icon: Heart,
    circled: true,
  },
  {
    label: "Perfil",
    href: "/usuario",
    icon: User,
    circled: true,
  },
];

export function MobileNavbar() {
  const pathname = usePathname();

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
          {navItems.map(({ label, href, icon: Icon, circled }) => {
            const isActive = pathname === href || (href === "/" && pathname === "/");

            return (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-1.5 min-w-[56px] py-0.5 transition-opacity active:opacity-70"
                aria-current={isActive ? "page" : undefined}
              >
                {/* Icon — with circle border for non-home items, gradient stroke for active */}
                {circled ? (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center border-[1.5px] transition-all"
                    style={
                      isActive
                        ? {
                            borderColor: "transparent",
                            background: "linear-gradient(white, white) padding-box, linear-gradient(90deg, #159BEF, #7B3FF2) border-box",
                          }
                        : { borderColor: "#061337" }
                    }
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.8}
                      style={{
                        color: isActive ? "#159BEF" : "#061337",
                      }}
                    />
                  </div>
                ) : (
                  /* Home icon — no circle, just the icon itself */
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Icon
                      size={22}
                      strokeWidth={1.8}
                      style={
                        isActive
                          ? {
                              stroke: "url(#navGradient)",
                            }
                          : { color: "#061337" }
                      }
                    />
                    {/* SVG gradient definition (rendered once, invisible) */}
                    <svg width="0" height="0" className="absolute">
                      <defs>
                        <linearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#159BEF" />
                          <stop offset="100%" stopColor="#7B3FF2" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}

                {/* Label */}
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
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
