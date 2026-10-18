import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { Image as ImageIcon } from "lucide-react";
import { MobileNavbar } from "@/components/public-album/mobile-navbar";
import { CartHeaderButton } from "@/components/cart/cart-header-button";
import { AlbumCard } from "@/components/home/album-card";
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
  const userHomeLabel = canAccessDashboard ? "Painel do fotógrafo" : "Minhas compras";
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
  const orderedAlbums = featuredAlbumId
    ? [...albums].sort((a, b) => Number(b.id === featuredAlbumId) - Number(a.id === featuredAlbumId))
    : albums;
  return (
    <div className="storefront min-h-screen bg-[#fafafa] text-slate-900">
      <a href="#albuns" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-4">Ir para os álbuns</a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/" aria-label="CLICS — início" className="flex shrink-0 items-center gap-2">
            <Image src="/icone_clics.png" alt="" width={48} height={48} priority className="h-12 w-12 object-contain" />
            <span className="text-xl font-semibold tracking-tight">CLICS<span className="text-sky-600">.</span></span>
          </Link>
          <nav aria-label="Navegação principal" className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
            <Link href="/#albuns" className="hover:text-slate-950">Explorar álbuns</Link>
            <Link href="/#como-funciona" className="hover:text-slate-950">Como funciona</Link>
            <Link href={sellerHref} className="hover:text-slate-950">Sou fotógrafo</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <CartHeaderButton className="min-h-11 min-w-11" />
            {user ? <>
              <Link href={userHomeHref} className="hidden text-sm font-medium text-slate-700 sm:block">{userHomeLabel}</Link>
              <ProfileTrigger avatarUrl={user.avatarUrl} name={user.name} className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200" />
            </> : <Link href="/login" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">Entrar</Link>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-4 pb-12 sm:px-8">
        <HomeHeroSection />
        <HomePromotionsCarousel promotions={activePromotions} />
        <section id="albuns" className="scroll-mt-24" aria-labelledby="albums-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Explore e encontre você</p>
              <h2 id="albums-heading" className="text-2xl font-semibold tracking-tight">{query ? `Resultados para “${query}”` : "Álbuns recentes"}</h2>
            </div>
            <span className="text-sm text-slate-500">{albums.length} {albums.length === 1 ? "álbum" : "álbuns"}</span>
          </div>
          {albums.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <ImageIcon size={32} className="mx-auto mb-4 text-slate-400" />
            <h3 className="font-semibold">{query ? "Nenhum álbum encontrado" : "Novos álbuns em breve"}</h3>
            <p className="mt-2 text-sm text-slate-500">{query ? "Tente o nome do evento, outro local ou fotógrafo." : "As fotos dos próximos eventos aparecerão aqui."}</p>
            {query && <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium">Ver todos os álbuns</Link>}
          </div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {orderedAlbums.map((album) => <AlbumCard key={album.id} album={album} featured={album.id === featuredAlbumId} />)}
          </div>}
        </section>
        <section id="como-funciona" className="scroll-mt-24 border-t border-slate-200 pt-8" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-lg font-semibold">Suas fotos, em três passos</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            {[["01", "Encontre seu evento", "Busque pelo nome, local ou fotógrafo e abra o álbum."], ["02", "Escolha suas fotos", "Amplie as imagens e adicione suas favoritas ao carrinho."], ["03", "Guarde seus momentos", "Após a confirmação do pagamento, acesse os downloads nas suas compras."]].map(([number, title, description]) => <div key={number} className="flex gap-3"><span className="pt-0.5 text-xs font-medium text-slate-400">{number}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div></div>)}
          </div>
          <a href="https://wa.me/5551999129161" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-sm font-medium text-slate-600 underline underline-offset-4">Precisa de ajuda? Entre em contato</a>
        </section>
      </main>
      <SiteFooter />
      <Suspense fallback={null}><MobileNavbar /></Suspense>
    </div>
  );
}
