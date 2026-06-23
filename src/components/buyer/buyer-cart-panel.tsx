"use client";

import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/money";

export function BuyerCartPanel() {
  const { items, albumSlug, removeFromCart, clearCart, totalAmount } = useCart();
  const checkoutHref = albumSlug ? `/checkout?album=${albumSlug}` : "/checkout";
  const galleryHref = albumSlug ? `/album/${albumSlug}` : "/";

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">
            Carrinho
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Fotos selecionadas
          </h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <ShoppingCart size={18} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          Seu carrinho esta vazio. Escolha um album e selecione as fotos que deseja comprar.
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              Ver albuns
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <img
                  src={item.previewUrl}
                  alt={item.originalFileName}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {item.originalFileName}
                  </p>
                  <p className="mt-1 text-sm font-bold text-sky-600">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="Remover foto do carrinho"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Total</span>
              <span className="text-xl font-black">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={checkoutHref}
                className="rounded-full bg-white px-4 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-slate-100"
              >
                Finalizar compra
              </Link>
              <Link
                href={galleryHref}
                className="rounded-full border border-white/20 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
              >
                Continuar escolhendo
              </Link>
            </div>
            <button
              type="button"
              onClick={clearCart}
              className="mt-4 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              Esvaziar carrinho
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
