"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { formatCurrency } from "@/lib/money";
import { ShoppingCart, Eye, Check, X, Calendar, MapPin, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorites/favorite-button";

interface Photo {
  id: string;
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
  photographer: {
    name: string;
    avatarUrl: string | null;
  };
}

interface PhotoGalleryProps {
  album: Album;
  photos: Photo[];
}

export function PhotoGallery({ album, photos }: PhotoGalleryProps) {
  const { items, addToCart, removeFromCart, isInCart, subtotalAmount, discountAmount, totalAmount, promotionApplied } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const promotion = {
    promotionEnabled: album.promotionEnabled,
    promotionMinPhotos: album.promotionMinPhotos,
    promotionDiscountBps: album.promotionDiscountBps,
  };
  const promotionPercent = album.promotionDiscountBps / 100;
  
  // Modal de visualização ampliada
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const activePhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

  const handleToggleCart = (photo: Photo) => {
    if (isInCart(photo.id)) {
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
    setActivePhotoIndex(activePhotoIndex === 0 ? photos.length - 1 : activePhotoIndex - 1);
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(activePhotoIndex === photos.length - 1 ? 0 : activePhotoIndex + 1);
  };

  const checkoutHref = `/checkout?album=${album.slug}`;

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#061337] selection:bg-[#7B3FF2] selection:text-white" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
      {/* Back to Albums Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-4 shadow-[0_2px_16px_0_rgba(6,19,55,0.03)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-[#159BEF] hover:text-[#7B3FF2] transition-colors flex items-center gap-2">
            <ChevronLeft size={16} /> Voltar para álbuns
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#061337]/60">Galeria Oficial</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative h-[40vh] w-full overflow-hidden flex items-end">
        {/* Background Cover Image blurred */}
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-lg scale-105 opacity-15"
          style={{ backgroundImage: `url(${album.coverImageUrl || '/placeholder.jpg'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F6F8FC] via-[#F6F8FC]/40 to-transparent" />
        
        {/* Info */}
        <div className="relative max-w-7xl mx-auto w-full px-6 pb-10 grid md:grid-cols-3 gap-6 items-end z-10">
          <div className="md:col-span-2 space-y-3">
            <h1 
              className="text-3xl md:text-5xl font-black tracking-tight text-[#061337]"
              style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
            >
              {album.title}
            </h1>
            {album.description && (
              <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">{album.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {album.promotionEnabled && album.promotionMinPhotos > 0 && album.promotionDiscountBps > 0 && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-700 shadow-sm">
                  Promo: {promotionPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% OFF a partir de {album.promotionMinPhotos} fotos
                </div>
              )}
              {album.eventDate && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#061337]/80 shadow-sm">
                  <Calendar size={13} className="text-[#159BEF]" />
                  <span>{new Date(album.eventDate).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
              {album.location && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#061337]/80 shadow-sm">
                  <MapPin size={13} className="text-[#159BEF]" />
                  <span className="truncate max-w-[200px]">{album.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Photographer Card */}
          <div className="bg-white border border-slate-200/60 shadow-[0_4px_20px_rgba(6,19,55,0.04)] p-4 rounded-3xl flex items-center gap-4">
            <div 
              className="h-10 w-10 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #159BEF, #7B3FF2)" }}
            >
              {album.photographer.avatarUrl ? (
                <img src={album.photographer.avatarUrl} alt={album.photographer.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{album.photographer.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fotógrafo</p>
              <h4 className="text-sm font-bold text-[#061337] truncate">{album.photographer.name}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 pb-32">
        {photos.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-[#061337]" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}>Nenhuma foto publicada</h3>
            <p className="text-slate-400 max-w-sm mx-auto text-sm">
              Este álbum ainda não possui fotos disponíveis para compra. Volte mais tarde.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo, index) => {
              const selected = isInCart(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`bg-white border rounded-[2rem] overflow-hidden flex flex-col justify-between group transition-all duration-300 relative shadow-sm ${
                    selected ? "border-[#7B3FF2] ring-2 ring-[#7B3FF2]/20 -translate-y-1" : "border-slate-200/60 hover:border-slate-350 hover:-translate-y-1"
                  }`}
                >
                  {/* Preview Image Container */}
                  <div className="aspect-square bg-slate-50 relative overflow-hidden cursor-pointer" onClick={() => setActivePhotoIndex(index)}>
                    <img
                      src={photo.previewUrl}
                      alt={photo.originalFileName}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 select-none"
                    />

                    {/* Favorite Photo Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton
                        type="photo"
                        photo={{
                          id: photo.id,
                          originalFileName: photo.originalFileName,
                          previewUrl: photo.previewUrl,
                          price: photo.price,
                          albumId: album.id,
                          albumSlug: album.slug,
                        }}
                        className="bg-white/80 backdrop-blur-md hover:bg-white text-gray-800 shadow-sm"
                      />
                    </div>
                    
                    {/* Hover controls overlay */}
                    <div className="absolute inset-0 bg-[#061337]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex(index);
                        }}
                        className="h-10 w-10 rounded-full bg-white/95 text-[#061337] flex items-center justify-center hover:bg-white transition-all transform translate-y-2 group-hover:translate-y-0 duration-350 shadow-md"
                      >
                        <Eye size={18} />
                      </button>
                    </div>

                    {/* Preço Tag */}
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-200/50 text-xs font-black text-[#061337] shadow-sm select-none">
                      {formatCurrency(photo.price)}
                    </div>
                  </div>

                  {/* Buy Button */}
                  <div className="p-3.5 bg-white border-t border-slate-100">
                    <button
                      onClick={() => handleToggleCart(photo)}
                      className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        selected
                          ? "text-white shadow-md shadow-[#7B3FF2]/10"
                          : "bg-[#F6F8FC] hover:bg-slate-100 text-[#061337]/80 border border-slate-200/50"
                      }`}
                      style={selected ? {
                        background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)"
                      } : undefined}
                    >
                      {selected ? (
                        <>
                          <Check size={14} />
                          Selecionada
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={14} />
                          Selecionar Foto
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Cart Button & Checkout Shortcut */}
      {items.length > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/80 backdrop-blur-md px-3 py-2.5 shadow-[0_-8px_30px_rgba(6,19,55,0.12)] flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-5 md:px-8 md:py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {items.length} {items.length === 1 ? "foto selecionada" : "fotos selecionadas"}
            </p>
            <p className="truncate text-sm font-black text-[#061337] md:text-base">
              <span className="hidden sm:inline">{promotionApplied ? "Total com promo: " : "Subtotal: "}</span>
              <span className="bg-gradient-to-r from-[#159BEF] to-[#7B3FF2] bg-clip-text text-transparent">{formatCurrency(totalAmount)}</span>
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
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#061337] font-bold py-2.5 px-3 rounded-2xl text-xs transition-all md:px-4"
            >
              Ver Carrinho
            </button>
            <Link
              href={checkoutHref}
              className="flex items-center justify-center gap-2 text-white font-bold py-2.5 px-3 rounded-2xl text-xs shadow-md transition-all hover:opacity-95 md:px-5"
              style={{
                background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)",
                boxShadow: "0 10px 20px -5px rgba(123, 63, 242, 0.3)",
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
        <div className="fixed inset-0 bg-black/95 z-[110] flex flex-col md:flex-row items-stretch justify-between">
          {/* Close button */}
          <button
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-zinc-900/80 border border-zinc-850 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>

          {/* Main viewer (image) */}
          <div className="flex-1 flex items-center justify-center relative p-6">
            {/* Nav Prev */}
            <button
              onClick={handlePrevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-zinc-900/60 border border-zinc-850 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors z-10"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Image (With watermarked effect or standard protected view) */}
            <div className="relative max-h-[80vh] max-w-full aspect-auto">
              <img
                src={activePhoto.previewUrl}
                alt={activePhoto.originalFileName}
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
                onContextMenu={(e) => e.preventDefault()} // impede clique com o botão direito para salvar
              />
            </div>

            {/* Nav Next */}
            <button
              onClick={handleNextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-zinc-900/60 border border-zinc-850 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors z-10"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Detail Side Panel */}
          <div className="w-full md:w-80 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-900 p-6 flex flex-col justify-between text-white">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Nome do Arquivo</p>
                  <h4 className="text-sm font-semibold truncate">{activePhoto.originalFileName}</h4>
                </div>
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
              </div>

              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Preço da Foto</p>
                <h4 className="text-2xl font-black">{formatCurrency(activePhoto.price)}</h4>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <button
                onClick={() => handleToggleCart(activePhoto)}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  isInCart(activePhoto.id)
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                    : "text-white shadow-lg"
                }`}
                style={!isInCart(activePhoto.id) ? {
                  background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)",
                  boxShadow: "0 10px 20px -5px rgba(123, 63, 242, 0.3)",
                } : undefined}
              >
                {isInCart(activePhoto.id) ? (
                  <>
                    <Check size={16} />
                    Selecionada no Carrinho
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Adicionar ao Carrinho
                  </>
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
          </div>
        </div>
      )}
    </div>
  );
}
