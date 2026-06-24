"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface FavAlbum {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  defaultPhotoPrice: number;
}

export interface FavPhoto {
  id: string;
  originalFileName: string;
  previewUrl: string;
  price: number;
  albumId: string;
  albumSlug: string;
}

interface FavoritesContextType {
  favoriteAlbums: FavAlbum[];
  favoritePhotos: FavPhoto[];
  toggleAlbumFavorite: (album: FavAlbum) => void;
  togglePhotoFavorite: (photo: FavPhoto) => void;
  isAlbumFavorite: (albumId: string) => boolean;
  isPhotoFavorite: (photoId: string) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteAlbums, setFavoriteAlbums] = useState<FavAlbum[]>([]);
  const [favoritePhotos, setFavoritePhotos] = useState<FavPhoto[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega do localStorage ao iniciar
  useEffect(() => {
    try {
      const storedAlbums = localStorage.getItem("clics_fav_albums");
      const storedPhotos = localStorage.getItem("clics_fav_photos");
      if (storedAlbums) {
        setFavoriteAlbums(JSON.parse(storedAlbums));
      }
      if (storedPhotos) {
        setFavoritePhotos(JSON.parse(storedPhotos));
      }
    } catch (e) {
      console.error("Erro ao carregar favoritos do localStorage:", e);
    }
    setIsLoaded(true);
  }, []);

  // Salva no localStorage quando mudar
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("clics_fav_albums", JSON.stringify(favoriteAlbums));
    } catch (e) {
      console.error("Erro ao salvar álbuns favoritos:", e);
    }
  }, [favoriteAlbums, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("clics_fav_photos", JSON.stringify(favoritePhotos));
    } catch (e) {
      console.error("Erro ao salvar fotos favoritas:", e);
    }
  }, [favoritePhotos, isLoaded]);

  const toggleAlbumFavorite = (album: FavAlbum) => {
    setFavoriteAlbums((prev) => {
      const exists = prev.some((a) => a.id === album.id);
      if (exists) {
        return prev.filter((a) => a.id !== album.id);
      }
      return [...prev, album];
    });
  };

  const togglePhotoFavorite = (photo: FavPhoto) => {
    setFavoritePhotos((prev) => {
      const exists = prev.some((p) => p.id === photo.id);
      if (exists) {
        return prev.filter((p) => p.id !== photo.id);
      }
      return [...prev, photo];
    });
  };

  const isAlbumFavorite = (albumId: string) => {
    return favoriteAlbums.some((a) => a.id === albumId);
  };

  const isPhotoFavorite = (photoId: string) => {
    return favoritePhotos.some((p) => p.id === photoId);
  };

  const clearFavorites = () => {
    setFavoriteAlbums([]);
    setFavoritePhotos([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteAlbums,
        favoritePhotos,
        toggleAlbumFavorite,
        togglePhotoFavorite,
        isAlbumFavorite,
        isPhotoFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites deve ser usado dentro de um FavoritesProvider");
  }
  return context;
}
