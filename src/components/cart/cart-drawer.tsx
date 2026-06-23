"use client";

import { useCart } from "./cart-provider";
import { X, Trash2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/money";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeFromCart, clearCart, totalAmount } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="pointer-events-auto w-screen max-w-md">
          <div className="flex h-full flex-col overflow-y-scroll bg-zinc-950 border-l border-zinc-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-400">
                  <ShoppingCart size={18} />
                </div>
                <h2 className="text-lg font-bold text-white">Carrinho</h2>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20">
                  <div className="h-12 w-12 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-500">
                    <ShoppingCart size={22} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Seu carrinho está vazio</h3>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    Navegue pela galeria e selecione as fotos que deseja comprar para adicioná-las aqui.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-xs font-semibold text-zinc-500">
                      {items.length} {items.length === 1 ? "foto selecionada" : "fotos selecionadas"}
                    </span>
                    <button
                      onClick={clearCart}
                      className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                    >
                      Esvaziar carrinho
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-900/50">
                    {items.map((item) => (
                      <div key={item.id} className="flex py-4 gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-850">
                          <img
                            src={item.previewUrl}
                            alt={item.originalFileName}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-medium text-zinc-300 line-clamp-1">
                              {item.originalFileName}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-white">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-zinc-900 px-6 py-6 bg-zinc-950 space-y-4">
                <div className="flex justify-between text-base font-medium text-white">
                  <p>Subtotal</p>
                  <p className="text-lg font-bold text-violet-400">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <p className="text-xs text-zinc-500">
                  Os arquivos originais em alta qualidade serão liberados para download imediatamente após a confirmação do pagamento.
                </p>
                <div className="pt-2">
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all text-center"
                  >
                    Prosseguir para o Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
