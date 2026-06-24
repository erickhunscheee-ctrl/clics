"use client";

import { useFavorites, FavAlbum, FavPhoto } from "./favorites-provider";
import { Heart } from "lucide-react";
import { useState } from "react";

interface FavoriteButtonProps {
  type: "album" | "photo";
  album?: FavAlbum;
  photo?: FavPhoto;
  className?: string;
  size?: number;
}

export function FavoriteButton({
  type,
  album,
  photo,
  className = "",
  size = 20,
}: FavoriteButtonProps) {
  const { isAlbumFavorite, isPhotoFavorite, toggleAlbumFavorite, togglePhotoFavorite } = useFavorites();
  const [animate, setAnimate] = useState(false);

  const active = type === "album" ? isAlbumFavorite(album?.id || "") : isPhotoFavorite(photo?.id || "");

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);

    if (type === "album" && album) {
      toggleAlbumFavorite(album);
    } else if (type === "photo" && photo) {
      togglePhotoFavorite(photo);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center rounded-full p-2 transition-all hover:bg-slate-100/10 active:scale-95 ${className} ${
        animate ? "scale-125" : ""
      }`}
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        size={size}
        className={`transition-colors duration-300 ${
          active
            ? "fill-[#EF4444] stroke-[#EF4444]"
            : "stroke-current text-gray-400 hover:text-[#EF4444]"
        }`}
        strokeWidth={2}
      />
    </button>
  );
}
