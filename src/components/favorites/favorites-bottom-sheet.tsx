"use client";

import { useFavorites } from "./favorites-provider";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/money";
import { Heart, ShoppingCart, Trash2, X, Image as ImageIcon, FolderHeart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function FavoritesBottomSheet() {
  const { favoriteAlbums, favoritePhotos, toggleAlbumFavorite, togglePhotoFavorite } = useFavorites();
  const { addToCart, isInCart } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"albums" | "photos">("albums");
  const [isOpen, setIsOpen] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);

  const showFavorites = searchParams.get("favorites") === "true";

  // Controla animação de entrada e saída
  useEffect(() => {
    if (showFavorites) {
      setIsOpen(true);
      // Pequeno timeout para permitir que a animação CSS execute após o mount
      const t = setTimeout(() => setAnimateOpen(true), 50);
      return () => clearTimeout(t);
    } else {
      setAnimateOpen(false);
      const t = setTimeout(() => setIsOpen(false), 300);
      return () => clearTimeout(t);
    }
  }, [showFavorites]);

  const handleClose = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("favorites");
    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          animateOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Sheet Container */}
      <div
        className={`relative w-full max-w-xl bg-white rounded-t-[2.5rem] shadow-[0_-8px_30px_rgba(6,19,55,0.15)] z-[130] flex flex-col h-[80vh] transition-transform duration-300 ease-out transform ${
          animateOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Pull Handle Indicator */}
        <div 
          className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3.5 flex-shrink-0 cursor-pointer hover:bg-slate-350 transition-colors" 
          onClick={handleClose} 
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Heart size={20} className="fill-[#EF4444] text-[#EF4444]" />
            <h2 
              className="text-lg font-black text-[#061337]" 
              style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
            >
              Meus Favoritos
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-[#061337] transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* iOS Segmented Control */}
        <div className="px-6 py-4 flex-shrink-0">
          <div className="bg-slate-100/80 p-1 rounded-2xl flex relative w-64 mx-auto border border-slate-200/40">
            {/* Sliding Pill block */}
            <div 
              className="absolute top-1 bottom-1 left-1 bg-white rounded-xl shadow-sm transition-all duration-300 ease-out" 
              style={{
                width: "calc(50% - 4px)",
                transform: activeTab === "albums" ? "translateX(0)" : "translateX(calc(100% + 4px))"
              }}
            />
            <button
              onClick={() => setActiveTab("albums")}
              className={`flex-1 py-2 text-xs font-bold text-center z-10 transition-colors duration-200 ${
                activeTab === "albums" ? "text-[#061337]" : "text-slate-400 hover:text-[#061337]"
              }`}
            >
              Álbuns ({favoriteAlbums.length})
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`flex-1 py-2 text-xs font-bold text-center z-10 transition-colors duration-200 ${
                activeTab === "photos" ? "text-[#061337]" : "text-slate-400 hover:text-[#061337]"
              }`}
            >
              Fotos ({favoritePhotos.length})
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4">
          {activeTab === "albums" ? (
            favoriteAlbums.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10">
                <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400">
                  <FolderHeart size={24} />
                </div>
                <h3 className="text-sm font-bold text-[#061337]">Nenhum álbum favorito</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Favorite álbuns interessantes na página inicial para vê-los por aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {favoriteAlbums.map((album) => (
                  <div
                    key={album.id}
                    className="group bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col justify-between shadow-sm relative"
                  >
                    {/* Cover image */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-50">
                      <img
                        src={album.coverImageUrl || "/placeholder.jpg"}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => toggleAlbumFavorite(album)}
                        className="absolute top-2 right-2 p-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-sm text-red-500 hover:bg-white transition-all active:scale-90"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Meta */}
                    <div className="p-3.5 flex flex-col gap-2.5">
                      <h4 className="font-bold text-xs line-clamp-1 text-[#061337]">{album.title}</h4>
                      <Link
                        href={`/album/${album.slug}`}
                        onClick={handleClose}
                        className="w-full py-2 rounded-xl text-[10px] font-bold text-white flex items-center justify-center gap-1 hover:opacity-90"
                        style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
                      >
                        Acessar álbum <ArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : favoritePhotos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10">
              <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400">
                <ImageIcon size={24} />
              </div>
              <h3 className="text-sm font-bold text-[#061337]">Nenhuma foto favorita</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Você pode favoritar fotos dentro de qualquer galeria para salvá-las aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {favoritePhotos.map((photo) => {
                const inCart = isInCart(photo.id);
                return (
                  <div
                    key={photo.id}
                    className="bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col justify-between shadow-sm relative"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-slate-50 relative overflow-hidden">
                      <img
                        src={photo.previewUrl}
                        alt={photo.originalFileName}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => togglePhotoFavorite(photo)}
                        className="absolute top-2 right-2 p-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-sm text-red-500 hover:bg-white transition-all active:scale-90"
                      >
                        <Trash2 size={13} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-100 text-[10px] font-black text-[#061337]">
                        {formatCurrency(photo.price)}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2">
                      <p className="text-[9px] font-semibold text-slate-400 truncate">{photo.originalFileName}</p>
                      <button
                        onClick={() => addToCart(photo.albumId, photo, photo.albumSlug)}
                        disabled={inCart}
                        className={`w-full py-2 px-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                          inCart
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/40"
                            : "text-white shadow-xs"
                        }`}
                        style={!inCart ? {
                          background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)"
                        } : undefined}
                      >
                        <ShoppingCart size={11} />
                        {inCart ? "No Carrinho" : "Adicionar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
