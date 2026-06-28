import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { Bell, User, Calendar, MapPin, Image as ImageIcon, Sparkles, ArrowRight } from "lucide-react";
import { MobileNavbar } from "@/components/public-album/mobile-navbar";
import { CartHeaderButton } from "@/components/cart/cart-header-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { HomePromotionsCarousel } from "@/components/home/home-promotions-carousel";
import { ProfileTrigger } from "@/components/profile/profile-trigger";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const user = await getCurrentUser();
  const { search } = await searchParams;
  const query = search || "";

  const canAccessDashboard = isAdminEmail(user?.email);
  const userHomeHref = canAccessDashboard ? "/dashboard" : "/usuario";
  const userHomeLabel = canAccessDashboard ? "Painel fotografo" : "Minha area";
  const sellerHref = canAccessDashboard ? "/dashboard" : "/cadastro";

  const albums = await prisma.album
    .findMany({
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
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        eventDate: true,
        location: true,
        coverImageUrl: true,
        defaultPhotoPrice: true,
        photographer: { select: { name: true, avatarUrl: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { eventDate: "desc" },
    })
    .catch((error) => {
      console.error("Erro ao carregar albuns da home:", error);
      return [];
    });
  const activePromotions = await prisma
    .$queryRaw<
      Array<{
        id: string;
        slug: string;
        title: string;
        coverImageUrl: string | null;
        promotionMinPhotos: number;
        promotionDiscountBps: number;
      }>
    >`
      SELECT
        a.id,
        a.slug,
        a.title,
        a."coverImageUrl",
        a."promotionMinPhotos",
        a."promotionDiscountBps"
      FROM "albums" a
      WHERE
        a.status = 'PUBLISHED'
        AND a."promotionEnabled" = true
        AND a."promotionMinPhotos" > 0
        AND a."promotionDiscountBps" > 0
        AND (
          SELECT COUNT(*)
          FROM "photos" p
          WHERE p."albumId" = a.id AND p.status = 'ACTIVE'
        ) >= a."promotionMinPhotos"
      ORDER BY a."eventDate" DESC NULLS LAST
    `
    .catch(() => []);
  const featuredAlbumId = await prisma
    .$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "albums"
      WHERE status = 'PUBLISHED' AND "isFeatured" = true
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `
    .then((rows) => rows[0]?.id ?? null)
    .catch(() => null);
  const featuredAlbum =
    albums.find((album) => album.id === featuredAlbumId) ?? albums[0] ?? null;
  const carouselAlbums = featuredAlbum
    ? albums.filter((album) => album.id !== featuredAlbum.id)
    : [];

  const brandConcepts: Array<{ label: string; icon: typeof Sparkles }> = [];
  const visualStyles: Array<{ title: string; text: string; icon: typeof Sparkles }> = [];

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        background: "#F6F8FC",
        color: "#061337",
        fontFamily: "var(--font-inter, Inter, sans-serif)",
      }}
    >

      {/* ═══════════════════════════════════════════
          HEADER — Desktop & Mobile
      ═══════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: "#F6F8FC" }}>

        {/* ── Desktop Header ── */}
        <div className="hidden md:flex items-center justify-between bg-white shadow-sm px-8 py-3.5 w-full" style={{ boxShadow: "0 2px 16px 0 rgba(6,19,55,0.07)" }}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/icone_clics.png" alt="CLICS" width={64} height={64} className="h-16 w-16 object-contain" priority />
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
                <ProfileTrigger
                  avatarUrl={user.avatarUrl}
                  name={user.name}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center transition hover:opacity-80"
                />
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
          <div className="bg-white px-4 py-2.5" style={{ boxShadow: "0 2px 16px 0 rgba(6,19,55,0.07)" }}>
            {/* Top row: Logo + Icons */}
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/icone_clics.png" alt="CLICS" width={64} height={64} className="h-16 w-16 object-contain" priority />
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
                  <ProfileTrigger
                    avatarUrl={user.avatarUrl}
                    name={user.name}
                    className="h-6 w-6 rounded-full overflow-hidden transition-opacity hover:opacity-70 flex items-center justify-center"
                    iconSize={22}
                  />
                ) : (
                  <Link href="/login" aria-label="Entrar" className="transition-opacity hover:opacity-70">
                    <User size={22} style={{ color: "#061337" }} />
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          CONTEÚDO — Galeria de Álbuns
      ═══════════════════════════════════════════ */}
      <main className="container mx-auto px-4 pt-28 md:pt-32 max-w-6xl space-y-6 pb-24 md:pb-10">
        <HomePromotionsCarousel promotions={activePromotions} />
        <HomeHeroSection />

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
          ) : featuredAlbum ? (
            <div className="space-y-8">
              <Link
                href={`/album/${featuredAlbum.slug}`}
                className="group grid overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_60px_rgba(6,19,55,0.08)] transition-all duration-300 hover:-translate-y-1 md:grid-cols-[1.15fr_0.85fr]"
              >
                <div className="relative min-h-[20rem] overflow-hidden bg-gray-100 md:min-h-[25rem]">
                  <img
                    src={featuredAlbum.coverImageUrl || "/placeholder.jpg"}
                    alt={featuredAlbum.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#061337] shadow-sm backdrop-blur-md">
                    Album em destaque
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white"
                      style={{ background: "rgba(21,155,239,0.9)", backdropFilter: "blur(4px)" }}
                    >
                      {featuredAlbum._count.photos} fotos
                    </span>
                    <span
                      className="rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                    >
                      A partir de {formatCurrency(featuredAlbum.defaultPhotoPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-between p-6 md:p-8">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#159BEF]">
                          Destaque da semana
                        </p>
                        <h3
                          className="mt-3 text-3xl font-black leading-tight text-[#061337] md:text-4xl"
                          style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
                        >
                          {featuredAlbum.title}
                        </h3>
                      </div>
                      <div>
                        <FavoriteButton
                          type="album"
                          album={{
                            id: featuredAlbum.id,
                            slug: featuredAlbum.slug,
                            title: featuredAlbum.title,
                            coverImageUrl: featuredAlbum.coverImageUrl,
                            defaultPhotoPrice: featuredAlbum.defaultPhotoPrice,
                          }}
                          className="bg-[#F6F8FC] hover:bg-slate-100 text-gray-800 shadow-sm"
                        />
                      </div>
                    </div>

                    {featuredAlbum.description && (
                      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-500">
                        {featuredAlbum.description}
                      </p>
                    )}

                    <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500">
                      {featuredAlbum.eventDate && (
                        <div className="flex items-center gap-2">
                          <Calendar size={15} style={{ color: "#159BEF" }} />
                          <span>{new Date(featuredAlbum.eventDate).toLocaleDateString("pt-BR")}</span>
                        </div>
                      )}
                      {featuredAlbum.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={15} style={{ color: "#159BEF" }} />
                          <span className="truncate">{featuredAlbum.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white transition-all group-hover:opacity-90"
                    style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
                  >
                    Acessar album em destaque <ArrowRight size={16} />
                  </div>
                </div>
              </Link>

              {carouselAlbums.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#9ca3af]">
                      Outros albuns
                    </h3>
                    <span className="text-xs font-semibold text-[#9ca3af]">
                      Arraste para ver mais
                    </span>
                  </div>

                  <div className="flex snap-x gap-5 overflow-x-auto pb-3">
                    {carouselAlbums.map((album) => (
                      <Link
                        key={album.id}
                        href={`/album/${album.slug}`}
                        className="group min-w-[78%] snap-start bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 sm:min-w-[22rem] md:min-w-[24rem]"
                        style={{ boxShadow: "0 2px 16px 0 rgba(6,19,55,0.07)" }}
                      >
                        <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                          <img
                            src={album.coverImageUrl || "/placeholder.jpg"}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                          />

                          <div className="absolute top-3 right-3 z-10">
                            <FavoriteButton
                              type="album"
                              album={{
                                id: album.id,
                                slug: album.slug,
                                title: album.title,
                                coverImageUrl: album.coverImageUrl,
                                defaultPhotoPrice: album.defaultPhotoPrice,
                              }}
                              className="bg-white/80 backdrop-blur-md hover:bg-white text-gray-800 shadow-sm"
                            />
                          </div>

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
                </div>
              )}
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
                    
                    {/* Favorite Album Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton
                        type="album"
                        album={{
                          id: album.id,
                          slug: album.slug,
                          title: album.title,
                          coverImageUrl: album.coverImageUrl,
                          defaultPhotoPrice: album.defaultPhotoPrice,
                        }}
                        className="bg-white/80 backdrop-blur-md hover:bg-white text-gray-800 shadow-sm"
                      />
                    </div>

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

      <SiteFooter />

      {/* ── Mobile Bottom Navbar ── */}
      <Suspense fallback={null}>
        <MobileNavbar />
      </Suspense>
    </div>
  );
}
