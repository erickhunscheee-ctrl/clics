import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      className="mt-8 border-t py-10 pb-28 md:pb-10"
      style={{ background: "white", borderColor: "#e5e7eb" }}
    >
      <div
        className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm md:flex-row"
        style={{ color: "#9ca3af" }}
      >
        <div className="flex items-center gap-2">
          <Image
            src="/logo_clics.png"
            alt="CLICS"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <span>
            &copy; {new Date().getFullYear()} CLICS. Todos os direitos
            reservados.
          </span>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[#159BEF]/30 hover:text-[#159BEF]"
          style={{ color: "#9ca3af", borderColor: "#e5e7eb" }}
        >
          Área do Fotógrafo →
        </Link>
      </div>
    </footer>
  );
}
