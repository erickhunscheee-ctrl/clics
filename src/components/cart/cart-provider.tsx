"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string;
  originalFileName: string;
  previewUrl: string;
  price: number; // em centavos
}

interface CartContextType {
  items: CartItem[];
  albumId: string | null;
  albumSlug: string | null;
  addToCart: (albumId: string, item: CartItem, albumSlug?: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  isInCart: (itemId: string) => boolean;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [albumSlug, setAlbumSlug] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega o carrinho do localStorage ao iniciar
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedCart = localStorage.getItem("antigravity_fotos_cart");
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          if (parsed.albumId && Array.isArray(parsed.items)) {
            setAlbumId(parsed.albumId);
            setAlbumSlug(parsed.albumSlug ?? null);
            setItems(parsed.items);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar carrinho do localStorage:", e);
      }
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  // Salva no localStorage quando o estado mudar
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        "antigravity_fotos_cart",
        JSON.stringify({ albumId, albumSlug, items })
      );
    } catch (e) {
      console.error("Erro ao salvar carrinho no localStorage:", e);
    }
  }, [items, albumId, albumSlug, isLoaded]);

  const addToCart = (newAlbumId: string, item: CartItem, newAlbumSlug?: string) => {
    // Se o usuário mudar de álbum, limpa o carrinho antigo para evitar compras multi-álbum no mesmo pedido
    if (albumId && albumId !== newAlbumId) {
      if (
        confirm(
          "Você já possui fotos de outro álbum no carrinho. Deseja esvaziar o carrinho para adicionar fotos deste novo álbum?"
        )
      ) {
        setAlbumId(newAlbumId);
        setAlbumSlug(newAlbumSlug ?? null);
        setItems([item]);
      }
      return;
    }

    if (!albumId) {
      setAlbumId(newAlbumId);
    }
    if (newAlbumSlug && albumSlug !== newAlbumSlug) {
      setAlbumSlug(newAlbumSlug);
    }

    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== itemId);
      if (updated.length === 0) {
        setAlbumId(null);
        setAlbumSlug(null);
      }
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    setAlbumId(null);
    setAlbumSlug(null);
  };

  const isInCart = (itemId: string) => {
    return items.some((item) => item.id === itemId);
  };

  const totalAmount = items.reduce((acc, item) => acc + item.price, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        albumId,
        albumSlug,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
