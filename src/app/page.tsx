import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { Search, Bell, User, Calendar, MapPin, Image as ImageIcon, Sparkles, ArrowRight } from "lucide-react";
import { MobileNavbar } from "@/components/public-album/mobile-navbar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  const albums = await prisma.album.findMany({
    where: { status: "PUBLISHED" },
    include: {
      photographer: { select: { name: true, avatarUrl: true } },
      _count: { select: { photos: true } },
    },
    orderBy: { eventDate: "desc" },
  });

  return (
    <div className="min-h-screen" style={{ background: "#F6F8FC", color: "#061337", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>

      {/* ═══════════════════════════════════════════
          HEADER — Desktop & Mobile
      ═══════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 px-4 pt-4 pb-2 md:py-5 md:px-8" style={{ background: "#F6F8FC" }}>

        {/* ── Desktop Header ── */}
        <div className="hidden md:flex items-center justify-between bg-white rounded-2xl shadow-sm px-6 py-3.5 max-w-6xl mx-auto" style={{ boxShadow: "0 2px 16px 0 rgba(6,19,55,0.07)" }}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/logo_clics.png" alt="CLICS" width={40} height={40} className="w-10 h-10 object-contain" />
            {/* <span className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}>
              CLICS
            </span> */}
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-7">
            {["Explorar", "Categorias", "Vender fotos", "Como funciona"].map((item) => (
              <Link
                key={item}
                href={item === "Explorar" ? "/" : item === "Categorias" ? "/#categorias" : item === "Vender fotos" ? "/dashboard" : "/#como-funciona"}
                className="text-sm font-medium transition-colors hover:text-[#159BEF]"
                style={{ color: "#061337" }}
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search icon */}
            <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" aria-label="Buscar">
              <Search size={20} style={{ color: "#061337" }} />
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 mx-1" />

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold px-4 py-2 rounded-full border transition-colors hover:bg-gray-50"
                  style={{ color: "#061337", borderColor: "#d1d5db" }}
                >
                  Meu painel
                </Link>
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #159BEF, #7B3FF2)" }}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold px-5 py-2 rounded-full border transition-all hover:bg-gray-50"
                  style={{ color: "#061337", borderColor: "#d1d5db" }}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="text-sm font-semibold px-5 py-2 rounded-full text-white transition-all hover:opacity-90 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
                >
                  Começar agora
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Mobile Header ── */}
        <div className="md:hidden">
          <div className="bg-white rounded-2xl px-4 pt-4 pb-3" style={{ boxShadow: "0 2px 16px 0 rgba(6,19,55,0.07)" }}>
            {/* Top row: Logo + Icons */}
            <div className="flex items-center justify-between mb-3">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo_clics.png" alt="CLICS" width={36} height={36} className="w-16 h-16 object-contain" />
                {/* <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}>
                  CLICS
                </span> */}
              </Link>

              <div className="flex items-center gap-4">
                <button aria-label="Buscar" className="transition-opacity hover:opacity-70">
                  <Search size={22} style={{ color: "#061337" }} />
                </button>
                <button aria-label="Notificações" className="transition-opacity hover:opacity-70">
                  <Bell size={22} style={{ color: "#061337" }} />
                </button>
                {user ? (
                  <Link href="/dashboard" aria-label="Meu perfil" className="transition-opacity hover:opacity-70">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <User size={22} style={{ color: "#061337" }} />
                    )}
                  </Link>
                ) : (
                  <Link href="/login" aria-label="Entrar" className="transition-opacity hover:opacity-70">
                    <User size={22} style={{ color: "#061337" }} />
                  </Link>
                )}
              </div>
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-3 bg-[#F6F8FC] rounded-full px-4 py-2.5 border border-gray-200">
              <Search size={18} style={{ color: "#9ca3af" }} className="flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar fotos incríveis..."
                className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
                style={{ color: "#061337" }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          CONTEÚDO — Galeria de Álbuns
      ═══════════════════════════════════════════ */}
      <main className="container mx-auto px-4 py-10 max-w-6xl space-y-12 pb-28 md:pb-10">

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-5 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide uppercase"
            style={{ background: "rgba(21,155,239,0.08)", borderColor: "rgba(21,155,239,0.25)", color: "#159BEF" }}>
            <Sparkles size={12} /> Adquira suas fotos em alta resolução
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}>
            Encontre seu evento e{" "}
            <span style={{ background: "linear-gradient(90deg, #159BEF, #7B3FF2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              guarde suas memórias
            </span>
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#6b7280" }}>
            Selecione suas fotos favoritas e receba os arquivos originais por download imediatamente após o pagamento.
          </p>
        </section>

        {/* Albums Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-base font-semibold uppercase tracking-wider" style={{ color: "#9ca3af", fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}>
              Álbuns disponíveis ({albums.length})
            </h2>
          </div>

          {albums.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border space-y-4" style={{ background: "white", borderColor: "#e5e7eb" }}>
              <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto" style={{ background: "#F6F8FC", borderColor: "#e5e7eb", color: "#9ca3af" }}>
                <ImageIcon size={28} />
              </div>
              <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}>Nenhum evento ativo</h3>
              <p className="text-sm max-w-sm mx-auto" style={{ color: "#9ca3af" }}>
                No momento não há álbuns públicos. Entre em contato com seu fotógrafo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                  style={{ boxShadow: "0 2px 16px 0 rgba(6,19,55,0.07)" }}
                >
                  {/* Cover Image */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <img
                      src={album.coverImageUrl || "/placeholder.jpg"}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(21,155,239,0.85)", backdropFilter: "blur(4px)" }}>
                        {album._count.photos} fotos
                      </span>
                      <span className="text-[10px] font-bold text-white px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                        A partir de {formatCurrency(album.defaultPhotoPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <h3 className="font-bold text-base line-clamp-1 group-hover:text-[#159BEF] transition-colors"
                      style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}>
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "#6b7280" }}>
                        {album.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-1.5 text-xs mt-auto" style={{ color: "#9ca3af" }}>
                      {album.eventDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} style={{ color: "#159BEF" }} />
                          <span>{new Date(album.eventDate).toLocaleDateString("pt-BR")}</span>
                        </div>
                      )}
                      {album.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} style={{ color: "#159BEF" }} />
                          <span className="truncate">{album.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5">
                    <div
                      className="w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all group-hover:opacity-90"
                      style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
                    >
                      Acessar Galeria <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10 mt-8" style={{ background: "white", borderColor: "#e5e7eb" }}>
        <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: "#9ca3af" }}>
          <div className="flex items-center gap-2">
            <Image src="/logo_clics.png" alt="CLICS" width={24} height={24} className="w-6 h-6 object-contain" />
            <span>&copy; {new Date().getFullYear()} CLICS. Todos os direitos reservados.</span>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:text-[#159BEF] hover:border-[#159BEF]/30"
            style={{ color: "#9ca3af", borderColor: "#e5e7eb" }}
          >
            Área do Fotógrafo →
          </Link>
        </div>
      </footer>

      {/* ── Mobile Bottom Navbar ── */}
      <MobileNavbar />
    </div>
  );
}
