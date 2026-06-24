import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { Search, Bell, User, Calendar, MapPin, Image as ImageIcon, Sparkles, ArrowRight, ShoppingCart } from "lucide-react";
import { MobileNavbar } from "@/components/public-album/mobile-navbar";
import { CartHeaderButton } from "@/components/cart/cart-header-button";
import { SearchBar } from "@/components/home/search-bar";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const user = await getCurrentUser();
  const { search } = await searchParams;
  const query = search || "";

  const userHomeHref = user?.role === "PHOTOGRAPHER" || user?.role === "ADMIN" ? "/dashboard" : "/usuario";
  const userHomeLabel = user?.role === "PHOTOGRAPHER" || user?.role === "ADMIN" ? "Painel fotografo" : "Minha area";
  const sellerHref = user?.role === "PHOTOGRAPHER" || user?.role === "ADMIN" ? "/dashboard" : "/cadastro";

  const albums = await prisma.album.findMany({
    where: {
      status: "PUBLISHED",
      OR: query
        ? [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
            { photographer: { name: { contains: query, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: {
      photographer: { select: { name: true, avatarUrl: true } },
      _count: { select: { photos: true } },
    },
    orderBy: { eventDate: "desc" },
  });

  const brandConcepts: Array<{ label: string; icon: typeof Sparkles }> = [];
  const visualStyles: Array<{ title: string; text: string; icon: typeof Sparkles }> = [];

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
                href={item === "Explorar" ? "/" : item === "Categorias" ? "/#categorias" : item === "Vender fotos" ? sellerHref : "/#como-funciona"}
                className="text-sm font-medium transition-colors hover:text-[#159BEF]"
                style={{ color: "#061337" }}
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <SearchBar className="hidden lg:flex w-60 py-1.5" />

            <CartHeaderButton />

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 mx-1" />

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={userHomeHref}
                  className="text-sm font-semibold px-4 py-2 rounded-full border transition-colors hover:bg-gray-50"
                  style={{ color: "#061337", borderColor: "#d1d5db" }}
                >
                  {userHomeLabel}
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
                <CartHeaderButton iconSize={22} />
                <button aria-label="Notificações" className="transition-opacity hover:opacity-70">
                  <Bell size={22} style={{ color: "#061337" }} />
                </button>
                {user ? (
                  <Link href={userHomeHref} aria-label="Meu perfil" className="transition-opacity hover:opacity-70">
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
            <SearchBar />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          CONTEÚDO — Galeria de Álbuns
      ═══════════════════════════════════════════ */}
      <main className="container mx-auto px-4 py-10 max-w-6xl space-y-12 pb-28 md:pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white bg-white px-6 py-10 text-center shadow-[0_24px_80px_rgba(6,19,55,0.08)] md:px-12 md:py-14">
          <div className="absolute left-1/2 top-0 h-1 w-14 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#159BEF] to-[#7B3FF2]" />
          <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-[#159BEF]/10 blur-3xl" />
          <div className="absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-[#7B3FF2]/10 blur-3xl" />

          <div className="relative mx-auto flex max-w-4xl flex-col items-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#7B3FF2]">
              Marketplace de fotos
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Image
                src="/logo_clics.png"
                alt="CLICS"
                width={152}
                height={152}
                className="h-28 w-28 object-contain drop-shadow-[0_18px_40px_rgba(21,155,239,0.2)] sm:h-36 sm:w-36"
                priority
              />
              <span
                className="text-6xl font-semibold tracking-[0.28em] text-[#061337] sm:text-7xl md:text-8xl"
                style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
              >
                CLICS
              </span>
            </div>
            <h1 className="mt-8 text-3xl font-black tracking-tight text-[#061337] md:text-5xl">
              Encontre seu evento e compre suas{" "}
              <span className="bg-gradient-to-r from-[#159BEF] to-[#7B3FF2] bg-clip-text text-transparent">
                fotos favoritas
              </span>{" "}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
              Acesse albuns publicados por fotografos, selecione as imagens que deseja e finalize o pagamento com seguranca.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#albuns"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#159BEF] to-[#7B3FF2] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_36px_rgba(21,155,239,0.24)] transition hover:-translate-y-0.5"
              >
                Ver albuns <ShoppingCart size={16} />
              </Link>
              <Link
                href={sellerHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#7B3FF2]/40 bg-white px-6 py-3 text-sm font-bold text-[#7B3FF2] transition hover:-translate-y-0.5 hover:border-[#7B3FF2]"
              >
                Vender fotos <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="hidden">
          <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_18px_60px_rgba(6,19,55,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#061337]">
              1. Conceito da marca
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {brandConcepts.map(({ label, icon: Icon }) => (
                <div key={label} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#7B3FF2] shadow-[0_10px_30px_rgba(6,19,55,0.08)] ring-1 ring-slate-100">
                    <Icon size={26} strokeWidth={1.8} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#061337]">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 text-sm leading-relaxed text-slate-500">
              Plataforma para comprar, vender e descobrir fotos com uma identidade moderna, clara e confiavel.
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_18px_60px_rgba(6,19,55,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#061337]">
              2. Paleta de cores
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                ["Azul CLICS", "#159BEF"],
                ["Roxo CLICS", "#7B3FF2"],
                ["Navy", "#061337"],
                ["Cinza Claro", "#F6F8FC"],
                ["Branco", "#FFFFFF"],
              ].map(([name, color]) => (
                <div key={name}>
                  <div className="h-20 rounded-2xl border border-slate-200 shadow-inner" style={{ background: color }} />
                  <p className="mt-3 text-sm font-semibold text-[#061337]">{name}</p>
                  <p className="mt-1 text-xs text-slate-400">{color}</p>
                </div>
              ))}
            </div>
            <div className="mt-7">
              <p className="text-sm font-semibold text-[#061337]">Gradiente da marca</p>
              <div className="mt-2 h-6 rounded-full bg-gradient-to-r from-[#159BEF] to-[#7B3FF2]" />
            </div>
          </div>
        </section>

        <section className="hidden">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#061337]">
            3. Estilo visual
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visualStyles.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(6,19,55,0.06)] ring-1 ring-slate-100">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7B3FF2]/10 text-[#7B3FF2]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#061337]">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Hero Section */}
        <section className="hidden text-center max-w-3xl mx-auto space-y-5 pt-4">
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
        <section id="albuns" className="space-y-6 scroll-mt-28">
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
      <footer className="border-t py-10 pb-28 md:pb-10 mt-8" style={{ background: "white", borderColor: "#e5e7eb" }}>
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
