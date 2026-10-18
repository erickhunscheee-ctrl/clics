"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { formatCurrency } from "@/lib/money";
import { ShoppingCart, Eye, Check, X, Calendar, MapPin, ChevronLeft, ChevronRight, ArrowRight, Folder, ShieldAlert, Search, Grid2X2, LayoutGrid, ImageIcon } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorites/favorite-button";

interface Photo {
  id: string;
  folderId: string | null;
  originalFileName: string;
  previewUrl: string;
  price: number;
}

interface Album {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  eventDate: Date | null;
  location: string | null;
  coverImageUrl: string | null;
  defaultPhotoPrice: number;
  promotionEnabled: boolean;
  promotionMinPhotos: number;
  promotionDiscountBps: number;
  folders: Array<{
    id: string;
    name: string;
  }>;
  photographer: {
    name: string;
    avatarUrl: string | null;
  };
}

interface PhotoGalleryProps {
  album: Album;
  photos: Photo[];
  videos: Omit<Photo, "folderId">[];
}

export function PhotoGallery({ album, photos, videos }: PhotoGalleryProps) {
  const { items, addToCart, removeFromCart, isInCart, subtotalAmount, discountAmount, totalAmount, promotionApplied } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>("all");
  const [photoQuery, setPhotoQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [largePhotos, setLargePhotos] = useState(false);
  const viewerRef = useRef<HTMLDialogElement>(null);
  const [printBlocked, setPrintBlocked] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promotion = {
    promotionEnabled: album.promotionEnabled,
    promotionMinPhotos: album.promotionMinPhotos,
    promotionDiscountBps: album.promotionDiscountBps,
  };
  const promotionPercent = album.promotionDiscountBps / 100;

  // --- Screenshot / Print-screen protection ---
  useEffect(() => {
    const showOverlay = () => {
      setPrintBlocked(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setPrintBlocked(false), 1200);
    };

    // visibilitychange fires on Windows (PrtScn), macOS (Cmd+Shift+3/4) and some Android captures
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") showOverlay();
    };

    // CSS media: print blocks print-to-PDF / Ctrl+P
    const printMQ = window.matchMedia("print");
    const handlePrint = (e: MediaQueryListEvent) => { if (e.matches) showOverlay(); };

    document.addEventListener("visibilitychange", handleVisibility);
    printMQ.addEventListener("change", handlePrint);
    window.addEventListener("beforeprint", showOverlay);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      printMQ.removeEventListener("change", handlePrint);
      window.removeEventListener("beforeprint", showOverlay);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);
  
  // Modal de visualização ampliada
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const hasUnfolderedPhotos = photos.some((photo) => photo.folderId === null);
  const visiblePhotos = photos.filter((photo) =>
    (activeFolderId === "all" || photo.folderId === activeFolderId) &&
    (!selectedOnly || isInCart(photo.id)) &&
    photo.originalFileName.toLocaleLowerCase("pt-BR").includes(photoQuery.trim().toLocaleLowerCase("pt-BR"))
  );
  const activePhoto = activePhotoIndex !== null ? visiblePhotos[activePhotoIndex] : null;
  const viewerOpen = activePhotoIndex !== null && !!activePhoto;
  const selectedCount = [...photos, ...videos].filter((item) => isInCart(item.id)).length;

  useEffect(() => {
    if (!viewerOpen) return;
    const dialog = viewerRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [viewerOpen]);

  const handleToggleCart = (photo: Photo) => {
    if (isInCart(photo.id)) {
      if (selectedOnly) setActivePhotoIndex(null);
      removeFromCart(photo.id);
    } else {
      addToCart(album.id, {
        id: photo.id,
        originalFileName: photo.originalFileName,
        previewUrl: photo.previewUrl,
        price: photo.price,
      }, album.slug, promotion);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(activePhotoIndex === 0 ? visiblePhotos.length - 1 : activePhotoIndex - 1);
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(activePhotoIndex === visiblePhotos.length - 1 ? 0 : activePhotoIndex + 1);
  };

  const checkoutHref = `/checkout?album=${album.slug}`;

  return (
    <div
      className="album-gallery min-h-screen bg-[#fafafa] text-slate-900 selection:bg-sky-100"
      style={{ fontFamily: "var(--font-inter, Inter, sans-serif)" }}
      // Block drag-to-save on all images in this container
      onDragStart={(e) => e.preventDefault()}
      // Ignore global loader on interactive local buttons
      data-loading-ignore="true"
    >
      {/* ===== Screenshot Blocker Overlay ===== */}
      {printBlocked && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
          aria-label="Captura de tela bloqueada"
        >
          <ShieldAlert size={56} color="#7B3FF2" strokeWidth={1.5} />
          <p style={{ color: "white", fontWeight: 700, fontSize: "1.1rem", textAlign: "center", maxWidth: 320 }}>
            As fotos desta galeria são protegidas contra cópia.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", textAlign: "center", maxWidth: 280 }}>
            Adquira as fotos para ter acesso à versão original sem marca d&apos;água.
          </p>
        </div>
      )}

      {/* CSS: block print media + protect photo images */}
      <style>{`
        @media print { body * { visibility: hidden !important; } }
        .photo-img {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
          pointer-events: none !important;
        }
      `}</style>
      {/* Back to Albums Header */}
      <div className="bg-white/95 border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-2 sm:py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="min-h-11 text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors flex items-center gap-2">
            <ChevronLeft size={16} /> Voltar para álbuns
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#061337]/60">Galeria de fotos</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-4 pt-5 sm:px-8 sm:pb-6 sm:pt-10">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div className="min-w-0 max-w-3xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Álbum · {photos.length} fotos</p>
            <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-4xl">{album.title}</h1>
            {album.description && <p className="mt-3 text-sm leading-6 text-slate-600">{album.description}</p>}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              {album.eventDate && <span className="flex items-center gap-2"><Calendar size={15} />{new Date(album.eventDate).toLocaleDateString("pt-BR")}</span>}
              {album.location && <span className="flex items-center gap-2"><MapPin size={15} className="shrink-0" />{album.location}</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-medium text-slate-600">
              {album.photographer.avatarUrl ? <img src={album.photographer.avatarUrl} alt="" className="h-full w-full object-cover" /> : album.photographer.name.substring(0, 2).toUpperCase()}
            </div>
            <div><p className="text-xs text-slate-500">Fotografia por</p><p className="text-sm font-medium">{album.photographer.name}</p></div>
          </div>
        </div>
        {album.promotionEnabled && album.promotionMinPhotos > 0 && album.promotionDiscountBps > 0 && <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs sm:text-sm text-emerald-800">{promotionPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% de desconto a partir de {album.promotionMinPhotos} fotos.</p>}
        {videos.length > 0 && <a href="#videos" className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800">Ver vídeos ({videos.length})</a>}
      </section>
      <main id="fotos" className="mx-auto max-w-7xl px-4 pb-36 sm:px-8">
        <div className="mb-4 flex flex-col gap-3 border-y border-slate-200 py-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 lg:w-80">
            <Search size={17} className="shrink-0 text-slate-400" />
            <span className="sr-only">Buscar foto pelo nome do arquivo</span>
            <input type="search" value={photoQuery} onChange={(event) => { setPhotoQuery(event.target.value); setActivePhotoIndex(null); }} placeholder="Buscar pelo nome da foto" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" aria-pressed={selectedOnly} onClick={() => { setSelectedOnly(!selectedOnly); setActivePhotoIndex(null); }} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${selectedOnly ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}><Check size={16} />Selecionadas ({selectedCount})</button>
            <div className="flex rounded-lg border border-slate-200 bg-white p-1" role="group" aria-label="Tamanho das fotos">
              <button type="button" aria-label="Grade compacta" aria-pressed={!largePhotos} onClick={() => setLargePhotos(false)} className={`flex h-10 w-10 items-center justify-center rounded-md ${!largePhotos ? "bg-slate-100 text-slate-950" : "text-slate-500"}`}><LayoutGrid size={18} /></button>
              <button type="button" aria-label="Fotos maiores" aria-pressed={largePhotos} onClick={() => setLargePhotos(true)} className={`flex h-10 w-10 items-center justify-center rounded-md ${largePhotos ? "bg-slate-100 text-slate-950" : "text-slate-500"}`}><Grid2X2 size={18} /></button>
            </div>
          </div>
        </div>
        {(album.folders.length > 0 || hasUnfolderedPhotos) && (
          <div className="mb-3">
            <div
              className="flex gap-2 overflow-x-auto pb-2" aria-label="Pastas do álbum"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <button
                type="button"
                aria-pressed={activeFolderId === "all"}
                onClick={() => {
                  setActiveFolderId("all");
                  setActivePhotoIndex(null);
                }}
                className={`flex shrink-0 items-center gap-1.5 min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeFolderId === "all"
                    ? "text-white"
                    : "bg-white text-[#061337] border border-slate-200 hover:border-slate-300"
                }`}
                style={activeFolderId === "all" ? { background: "#0f172a" } : undefined}
              >
                <Folder size={12} />
                Todas ({photos.length})
              </button>
              {album.folders.map((folder) => (
                <button
                  key={folder.id}
                  aria-pressed={activeFolderId === folder.id}
                  type="button"
                  onClick={() => {
                    setActiveFolderId(folder.id);
                    setActivePhotoIndex(null);
                  }}
                  className={`flex shrink-0 items-center gap-1.5 min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeFolderId === folder.id
                      ? "text-white"
                      : "bg-white text-[#061337] border border-slate-200 hover:border-slate-300"
                  }`}
                  style={activeFolderId === folder.id ? { background: "#0f172a" } : undefined}
                >
                  <Folder size={12} />
                  {folder.name} ({photos.filter((photo) => photo.folderId === folder.id).length})
                </button>
              ))}
              {hasUnfolderedPhotos && (
                <button
                  type="button"
                  aria-pressed={activeFolderId === null}
                  onClick={() => {
                    setActiveFolderId(null);
                    setActivePhotoIndex(null);
                  }}
                  className={`flex shrink-0 items-center gap-1.5 min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeFolderId === null
                      ? "text-white"
                      : "bg-white text-[#061337] border border-slate-200 hover:border-slate-300"
                  }`}
                  style={activeFolderId === null ? { background: "#0f172a" } : undefined}
                >
                  <Folder size={12} />
                  Sem pasta ({photos.filter((photo) => photo.folderId === null).length})
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <p role="status">{visiblePhotos.length} de {photos.length} fotos</p>
          <p>Toque na foto para ampliar · Prévia com marca d’água</p>
        </div>
        {visiblePhotos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <ImageIcon size={30} className="mx-auto mb-3 text-slate-400" />
            <h2 className="text-lg font-semibold">{photos.length === 0 ? "Fotos em breve" : "Nenhuma foto nesta seleção"}</h2>
            <p className="mt-2 text-sm text-slate-500">{photos.length === 0 ? "As fotos deste álbum ainda não estão disponíveis. Volte mais tarde." : "Experimente outra pasta, altere a busca ou veja todas as fotos."}</p>
            {photos.length > 0 && <button type="button" onClick={() => { setPhotoQuery(""); setSelectedOnly(false); setActiveFolderId("all"); }} className="mt-5 min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium">Ver todas as fotos</button>}
          </div>
        ) : (
          <div className={`grid gap-3 sm:gap-5 ${largePhotos ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
            {visiblePhotos.map((photo, index) => {
              const selected = isInCart(photo.id);
              return (
                <article key={photo.id} className={`group overflow-hidden rounded-xl border bg-white ${selected ? "border-sky-600 ring-1 ring-sky-600" : "border-slate-200"}`}>
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <button type="button" aria-label={`Ampliar foto ${photo.originalFileName}`} onClick={() => setActivePhotoIndex(index)} className="absolute inset-0 flex h-full w-full items-center justify-center">
                      <img src={photo.previewUrl} alt={photo.originalFileName} loading="lazy" decoding="async" className="photo-img h-full w-full object-contain select-none" />
                      <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700"><Eye size={16} /></span>
                    </button>
                    <div className="absolute right-2 top-2"><FavoriteButton type="photo" photo={{ id: photo.id, originalFileName: photo.originalFileName, previewUrl: photo.previewUrl, price: photo.price, albumId: album.id, albumSlug: album.slug }} className="min-h-10 min-w-10 bg-white/95 text-slate-600" size={17} /></div>
                    {selected && <span className="pointer-events-none absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-sky-700 text-white" aria-label="No carrinho"><Check size={16} /></span>}
                  </div>
                  <div className="space-y-2.5 p-2.5 sm:p-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"><p className="min-w-0 truncate text-xs text-slate-500" title={photo.originalFileName}>{photo.originalFileName}</p><p className="text-sm font-semibold">{formatCurrency(photo.price)}</p></div>
                    <button type="button" aria-pressed={selected} aria-label={`${selected ? "Remover" : "Adicionar"} ${photo.originalFileName} ${selected ? "do" : "ao"} carrinho`} onClick={() => handleToggleCart(photo)} className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold sm:text-sm ${selected ? "bg-sky-50 text-sky-800 hover:bg-sky-100" : "bg-slate-900 text-white hover:bg-slate-700"}`}>
                      {selected ? <Check size={15} /> : <ShoppingCart size={15} />}{selected ? "Selecionada" : "Selecionar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {videos.length > 0 && <section id="videos" className="mx-auto max-w-7xl px-4 pb-36 sm:px-8">
        <div className="mb-5 border-t border-slate-200 pt-8"><h2 className="text-2xl font-semibold">Vídeos</h2><p className="mt-1 text-sm text-slate-500">Prévia com marca d&apos;água · preço independente das fotos</p></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{videos.map((video) => {
          const selected = isInCart(video.id);
          return <article key={video.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><video src={video.previewUrl} controls controlsList="nodownload" preload="metadata" className="aspect-video w-full bg-black" onContextMenu={(event) => event.preventDefault()} /><div className="space-y-3 p-4"><div className="flex justify-between gap-3"><p className="truncate text-sm" title={video.originalFileName}>{video.originalFileName}</p><strong className="shrink-0 text-sm">{formatCurrency(video.price)}</strong></div><button type="button" onClick={() => selected ? removeFromCart(video.id) : addToCart(album.id, { ...video, type: "video" }, album.slug, promotion)} className={`min-h-11 w-full rounded-lg px-4 text-sm font-semibold ${selected ? "bg-sky-50 text-sky-800" : "bg-slate-900 text-white"}`}>{selected ? "Remover do carrinho" : "Adicionar vídeo ao carrinho"}</button></div></article>;
        })}</div>
      </section>}

      {/* Floating Cart Button & Checkout Shortcut */}
      {items.length > 0 && (
        <div 
          className="gallery-cart-bar fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 backdrop-blur-md px-3 py-2.5 flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-5 md:px-8 md:py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium">
              {items.length} {items.length === 1 ? "item selecionado" : "itens selecionados"}
            </p>
            <p className="truncate text-sm font-black text-[#061337] md:text-base">
              <span className="hidden sm:inline">{promotionApplied ? "Total com promo: " : "Subtotal: "}</span>
              <span className="text-slate-950">{formatCurrency(totalAmount)}</span>
            </p>
            {promotionApplied && (
              <p className="text-[11px] font-semibold text-emerald-600">
                {formatCurrency(discountAmount)} de desconto sobre {formatCurrency(subtotalAmount)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#061337] font-semibold min-h-11 py-2.5 px-3 rounded-lg text-xs transition-all md:px-4"
            >
              Ver Carrinho
            </button>
            <Link
              href={checkoutHref}
              className="flex items-center justify-center gap-2 text-white font-semibold min-h-11 py-2.5 px-3 rounded-lg text-xs shadow-md transition-all hover:opacity-95 md:px-5"
              style={{
                background: "#0f172a",
                boxShadow: "none",
              }}
            >
              <span className="hidden sm:inline">Finalizar </span>Compra <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Lightbox / Modal de Foto Ampliada */}
      {activePhotoIndex !== null && activePhoto && (
        <dialog ref={viewerRef} aria-label="Visualização ampliada da foto" onCancel={(event) => { event.preventDefault(); setActivePhotoIndex(null); }} onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); setActivePhotoIndex(null); }
          if (event.key === "ArrowLeft") { event.preventDefault(); setActivePhotoIndex((current) => current === null ? null : (current - 1 + visiblePhotos.length) % visiblePhotos.length); }
          if (event.key === "ArrowRight") { event.preventDefault(); setActivePhotoIndex((current) => current === null ? null : (current + 1) % visiblePhotos.length); }
        }} className="gallery-viewer fixed inset-0 m-0 flex h-dvh max-h-none w-screen max-w-none flex-col items-stretch justify-between bg-[#101114] text-white md:flex-row">
          <p className="absolute left-4 top-4 z-20 text-xs text-white/70" role="status">{activePhotoIndex + 1} / {visiblePhotos.length}<span className="ml-3 hidden md:inline">Use ← → para navegar · Esc para fechar</span></p>
          {/* Close button */}
          <button
            aria-label="Fechar foto ampliada"
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-3 right-3 md:top-4 md:right-4 z-50 h-11 w-11 rounded-full bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>

          {/* Main viewer (image) */}
          <div className="min-h-0 flex-1 flex items-center justify-center relative px-3 pb-3 pt-14 sm:px-12 md:px-16 md:py-14">
            {/* Nav Prev */}
            <button
              aria-label="Foto anterior"
              onClick={handlePrevPhoto}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-11 w-11 md:h-12 md:w-12 rounded-full bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors z-20"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Images Container */}
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              {visiblePhotos.map((photo, index) => {
                const isCurrent = index === activePhotoIndex;
                const isPrev = index === (activePhotoIndex === 0 ? visiblePhotos.length - 1 : activePhotoIndex! - 1);
                const isNext = index === (activePhotoIndex === visiblePhotos.length - 1 ? 0 : activePhotoIndex! + 1);

                // Renderiza apenas a atual, anterior e próxima para economizar memória,
                // mas as mantem no DOM para troca instantânea via opacidade.
                if (!isCurrent && !isPrev && !isNext && visiblePhotos.length > 3) return null;

                return (
                  <img
                    key={photo.id}
                    aria-hidden={!isCurrent}
                    src={photo.previewUrl}
                    alt={photo.originalFileName}
                    className={`absolute photo-img h-full w-full object-contain select-none ${
                      isCurrent ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                );
              })}
            </div>

            {/* Nav Next */}
            <button
              aria-label="Próxima foto"
              onClick={handleNextPhoto}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-11 w-11 md:h-12 md:w-12 rounded-full bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors z-20"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Detail Panel — bottom on mobile, right side on md+ */}
          <div className="gallery-viewer-details shrink-0 w-full md:w-80 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 p-4 md:p-6 flex flex-col md:justify-between text-white">
            {/* Mobile: horizontal layout */}
            <div className="flex md:block items-center justify-between gap-3 md:space-y-6">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Preço da Foto</p>
                <h4 className="text-xl md:text-2xl font-black">{formatCurrency(activePhoto.price)}</h4>
                <p className="hidden md:block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-4 mb-1">Nome do Arquivo</p>
                <p className="hidden md:block text-sm font-semibold truncate">{activePhoto.originalFileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <FavoriteButton
                  type="photo"
                  photo={{
                    id: activePhoto.id,
                    originalFileName: activePhoto.originalFileName,
                    previewUrl: activePhoto.previewUrl,
                    price: activePhoto.price,
                    albumId: album.id,
                    albumSlug: album.slug,
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm p-1.5"
                />
                {/* Mobile inline cart button */}
                <button
                  onClick={() => handleToggleCart(activePhoto)}
                  className={`md:hidden flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isInCart(activePhoto.id) ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "text-white"
                  }`}
                  style={!isInCart(activePhoto.id) ? {
                    background: "#0f172a",
                  } : undefined}
                >
                  {isInCart(activePhoto.id) ? <><Check size={13} /> Selecionada</> : <><ShoppingCart size={13} /> Adicionar</>}
                </button>
              </div>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:block pt-6 space-y-3">
              <button
                onClick={() => handleToggleCart(activePhoto)}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  isInCart(activePhoto.id)
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                    : "text-white shadow-lg"
                }`}
                style={!isInCart(activePhoto.id) ? {
                  background: "#0f172a",
                  boxShadow: "none",
                } : undefined}
              >
                {isInCart(activePhoto.id) ? (
                  <><Check size={16} />Selecionada no Carrinho</>
                ) : (
                  <><ShoppingCart size={16} />Adicionar ao Carrinho</>
                )}
              </button>
              {items.length > 0 && (
                <Link
                  href={checkoutHref}
                  onClick={() => setActivePhotoIndex(null)}
                  className="flex w-full items-center justify-center gap-2 bg-[#F6F8FC] hover:bg-slate-100 text-[#061337] py-3.5 px-4 rounded-xl text-sm font-bold transition-all text-center"
                >
                  Finalizar Compra <ArrowRight size={16} />
                </Link>
              )}
            </div>

            {/* Mobile: checkout link if cart has items */}
            {items.length > 0 && (
              <Link
                href={checkoutHref}
                onClick={() => setActivePhotoIndex(null)}
                className="md:hidden mt-2 flex w-full items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border border-zinc-800"
              >
                Finalizar Compra <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
