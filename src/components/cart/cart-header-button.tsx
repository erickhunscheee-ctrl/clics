"use client";

import { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-provider";
import { CartDrawer } from "./cart-drawer";

interface CartHeaderButtonProps {
  className?: string;
  iconSize?: number;
}

export function CartHeaderButton({ className = "", iconSize = 20 }: CartHeaderButtonProps) {
  const { items } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evita erros de hidratação (SSR vs Client-side state)
  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = mounted ? items.length : 0;

  return (
    <>
      <button
        onClick={() => setIsCartOpen(true)}
        className={`relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all ${className}`}
        aria-label="Abrir carrinho"
      >
        <ShoppingCart size={iconSize} style={{ color: "#061337" }} />
        
        {itemCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm transition-transform scale-100"
            style={{
              background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)",
            }}
          >
            {itemCount}
          </span>
        )}
      </button>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
