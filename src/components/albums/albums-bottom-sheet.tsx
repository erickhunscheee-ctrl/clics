"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Images,
  Search,
  MapPin,
  Calendar,
  Camera,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  eventDate: string | null;
  coverImageUrl: string | null;
  defaultPhotoPrice: number;
  photographer: {
    name: string;
    avatarUrl: string | null;
  };
  _count: {
    photos: number;
  };
}

function AlbumCard({ album, onClose }: { album: Album; onClose: () => void }) {
  const eventDate = album.eventDate
    ? new Date(album.eventDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_16px_rgba(6,19,55,0.07)] overflow-hidden group">
      {/* Cover */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {album.coverImageUrl ? (
          <img
            src={album.coverImageUrl}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Camera size={32} />
          </div>
        )}

        {/* Favorite button */}
        <div className="absolute top-2.5 right-2.5">
          <FavoriteButton
            type="album"
            album={{
              id: album.id,
              title: album.title,
              slug: album.slug,
              coverImageUrl: album.coverImageUrl,
              defaultPhotoPrice: album.defaultPhotoPrice,
            }}
            size={16}
            className="bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
          />
        </div>

        {/* Photo count badge */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
          {album._count.photos} foto{album._count.photos !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2.5">
        <div>
          <h3
            className="text-sm font-black text-[#061337] line-clamp-1"
            style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
          >
            {album.title}
          </h3>

          {/* Photographer */}
          <div className="flex items-center gap-1.5 mt-1">
            {album.photographer.avatarUrl ? (
              <img
                src={album.photographer.avatarUrl}
                alt={album.photographer.name}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-black flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #159BEF 0%, #7B3FF2 100%)",
                }}
              >
                {album.photographer.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[10px] text-slate-400 truncate">
              {album.photographer.name}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-1.5">
          {eventDate && (
            <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
              <Calendar size={9} />
              {eventDate}
            </span>
          )}
          {album.location && (
            <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full truncate max-w-[120px]">
              <MapPin size={9} />
              {album.location}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/album/${album.slug}`}
          onClick={onClose}
          className="w-full py-2 rounded-2xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{
            background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)",
          }}
        >
          Ver álbum <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

export function AlbumsBottomSheet() {
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const showAlbums = searchParams.get("albums") === "true";

  // Animate in/out
  useEffect(() => {
    if (showAlbums) {
      setIsOpen(true);
      const t = setTimeout(() => {
        setAnimateOpen(true);
        // Auto-focus search on open
        setTimeout(() => inputRef.current?.focus(), 350);
      }, 50);
      return () => clearTimeout(t);
    } else {
      setAnimateOpen(false);
      const t = setTimeout(() => {
        setIsOpen(false);
        setSearchQuery("");
        setDebouncedQuery("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [showAlbums]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch albums
  const fetchAlbums = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/public/albums?search=${encodeURIComponent(q)}&limit=30`
      );
      const data = await res.json();
      setAlbums(data.albums ?? []);
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showAlbums) return;
    fetchAlbums(debouncedQuery);
  }, [showAlbums, debouncedQuery, fetchAlbums]);

  const handleClose = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("albums");
    const query = params.toString();
    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden flex items-end justify-center px-[10px]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          animateOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        data-loading-ignore="true"
        className={`relative w-full max-w-xl bg-[#F6F8FC] rounded-t-[2.5rem] shadow-[0_-8px_30px_rgba(6,19,55,0.15)] z-[130] flex flex-col h-[88vh] transition-transform duration-300 ease-out transform ${
          animateOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Pull Handle */}
        <div
          className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3.5 flex-shrink-0 cursor-pointer hover:bg-slate-300 transition-colors"
          onClick={handleClose}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Images size={20} className="text-[#7B3FF2]" />
            <h2
              className="text-lg font-black text-[#061337]"
              style={{
                fontFamily: "var(--font-poppins, Poppins, sans-serif)",
              }}
            >
              Álbuns
            </h2>
            {!loading && (
              <span className="text-xs text-slate-400 font-semibold ml-1">
                {albums.length} resultado{albums.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-[#061337] transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por álbum, fotógrafo, local…"
              className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-[#061337] placeholder:text-slate-400 focus:outline-none focus:border-[#159BEF] transition-colors shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#061337] transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <Loader2
                size={26}
                className="animate-spin text-[#7B3FF2]"
              />
              <p className="text-sm text-slate-400">Carregando álbuns…</p>
            </div>
          ) : albums.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                <Camera size={26} />
              </div>
              <h3 className="text-sm font-bold text-[#061337]">
                Nenhum álbum encontrado
              </h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {searchQuery
                  ? "Tente buscar com outras palavras."
                  : "Ainda não há álbuns publicados."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} onClose={handleClose} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
