"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { formatCurrency } from "@/lib/money";
import { ShoppingCart, Eye, Check, X, Calendar, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

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
  const { items, addToCart, removeFromCart, isInCart, totalAmount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
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
      }, album.slug);
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-violet-600 selection:text-white">
      {/* Hero Header */}
      <div className="relative h-[45vh] w-full overflow-hidden flex items-end">
        {/* Background Cover Image blurred */}
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-md scale-105 opacity-30"
          style={{ backgroundImage: `url(${album.coverImageUrl || '/placeholder.jpg'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        
        {/* Info */}
        <div className="relative max-w-7xl mx-auto w-full px-6 pb-12 grid md:grid-cols-3 gap-8 items-end z-10">
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              {album.title}
            </h1>
            {album.description && (
              <p className="text-zinc-400 text-sm max-w-2xl">{album.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-2">
              {album.eventDate && (
                <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-full">
                  <Calendar size={14} className="text-violet-400" />
                  <span>{new Date(album.eventDate).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
              {album.location && (
                <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-full">
                  <MapPin size={14} className="text-violet-400" />
                  <span>{album.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Photographer Card */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-violet-400">
              {album.photographer.avatarUrl ? (
                <img src={album.photographer.avatarUrl} alt={album.photographer.name} className="h-full w-full object-cover" />
              ) : (
                album.photographer.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fotógrafo</p>
              <h4 className="text-sm font-bold text-white">{album.photographer.name}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 pb-32">
        {photos.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/10 border border-zinc-900 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white">Nenhuma foto publicada</h3>
            <p className="text-zinc-500 max-w-sm mx-auto text-sm">
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
                  className={`bg-zinc-900/20 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all relative ${
                    selected ? "border-violet-500 ring-2 ring-violet-500/20" : "border-zinc-900 hover:border-zinc-800"
                  }`}
                >
                  {/* Preview Image Container */}
                  <div className="aspect-square bg-zinc-950 relative overflow-hidden cursor-pointer" onClick={() => setActivePhotoIndex(index)}>
                    <img
                      src={photo.previewUrl}
                      alt={photo.originalFileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                    />
                    
                    {/* Hover controls overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex(index);
                        }}
                        className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-all transform translate-y-2 group-hover:translate-y-0 duration-350"
                      >
                        <Eye size={18} />
                      </button>
                    </div>

                    {/* Preço Tag */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-bold text-white select-none">
                      {formatCurrency(photo.price)}
                    </div>
                  </div>

                  {/* Buy Button */}
                  <div className="p-3 bg-zinc-900/40 border-t border-zinc-900/60">
                    <button
                      onClick={() => handleToggleCart(photo)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        selected
                          ? "bg-violet-600 hover:bg-violet-700 text-white"
                          : "bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800"
                      }`}
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

      {/* Floating Cart Button */}
      {items.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/90 border border-zinc-800 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 max-w-md w-[calc(100%-2rem)]">
          <div className="flex-1">
            <p className="text-xs text-zinc-400 font-medium">
              {items.length} {items.length === 1 ? "foto selecionada" : "fotos selecionadas"}
            </p>
            <p className="text-sm font-black text-white">
              Total: <span className="text-violet-400">{formatCurrency(totalAmount)}</span>
            </p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-lg shadow-violet-500/25 transition-all"
          >
            <ShoppingCart size={14} />
            Ver Carrinho
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Lightbox / Modal de Foto Ampliada */}
      {activePhotoIndex !== null && activePhoto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col md:flex-row items-stretch justify-between">
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
          <div className="w-full md:w-80 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-900 p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Nome do Arquivo</p>
                <h4 className="text-sm font-semibold text-white truncate">{activePhoto.originalFileName}</h4>
              </div>

              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Preço da Foto</p>
                <h4 className="text-2xl font-black text-white">{formatCurrency(activePhoto.price)}</h4>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleToggleCart(activePhoto)}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  isInCart(activePhoto.id)
                    ? "bg-violet-600 hover:bg-violet-750 text-white"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25"
                }`}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
