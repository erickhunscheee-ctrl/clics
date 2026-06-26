"use client";

import { useCart } from "./cart-provider";
import { X, Trash2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { formatCurrency } from "@/lib/money";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, albumSlug, removeFromCart, clearCart, subtotalAmount, discountAmount, totalAmount, promotionApplied } = useCart();
  const checkoutHref = albumSlug ? `/checkout?album=${albumSlug}` : "/checkout";

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-y-0 right-0 flex w-full justify-end">
        <div className="pointer-events-auto w-[min(calc(100vw-10px),28rem)] max-w-md">
          <div className="flex h-full flex-col overflow-hidden bg-[#F6F8FC] border-l border-slate-200/60 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-6">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white"
                  style={{
                    background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)",
                  }}
                >
                  <ShoppingCart size={16} />
                </div>
                <h2
                  className="text-lg font-bold text-[#061337]"
                  style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
                >
                  Carrinho
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-[#061337] transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                    <ShoppingCart size={22} />
                  </div>
                  <h3
                    className="text-sm font-bold text-[#061337]"
                    style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
                  >
                    Seu carrinho está vazio
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Navegue pela galeria e selecione as fotos que deseja comprar para adicioná-las aqui.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/50">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-[#061337]/60">
                      {items.length} {items.length === 1 ? "foto selecionada" : "fotos selecionadas"}
                    </span>
                    <button
                      onClick={clearCart}
                      className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
                    >
                      Esvaziar carrinho
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <div key={item.id} className="flex py-4 gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                          <img
                            src={item.previewUrl}
                            alt={item.originalFileName}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-1 flex-col justify-between py-0.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-semibold text-[#061337] line-clamp-2">
                              {item.originalFileName}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <span className="text-sm font-black text-[#061337]">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-slate-200/60 px-6 py-6 bg-white space-y-4">
                <div className="space-y-2 text-sm text-[#061337]">
                  {promotionApplied && (
                    <>
                      <div className="flex justify-between">
                        <p className="text-slate-500">Subtotal</p>
                        <p className="font-bold">{formatCurrency(subtotalAmount)}</p>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <p>Desconto promocional</p>
                        <p className="font-bold">- {formatCurrency(discountAmount)}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-between text-base font-semibold text-[#061337]">
                  <p>Total</p>
                  <p className="text-xl font-black text-[#7B3FF2]">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Os arquivos originais em alta qualidade serão liberados para download imediatamente após a confirmação do pagamento.
                </p>
                <div className="pt-2">
                  <Link
                    href={checkoutHref}
                    onClick={onClose}
                    className="flex w-full items-center justify-center rounded-2xl py-3.5 px-4 text-sm font-bold text-white shadow-lg transition-all text-center hover:opacity-95"
                    style={{
                      background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)",
                      boxShadow: "0 10px 25px -5px rgba(123, 63, 242, 0.3)",
                    }}
                  >
                    Prosseguir para o Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
