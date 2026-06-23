"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/money";
import { ShoppingBag, ArrowLeft, Loader2, CreditCard, QrCode } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutFallback() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <Loader2 className="animate-spin text-violet-400" size={18} />
        Carregando checkout...
      </div>
    </div>
  );
}

function CheckoutContent() {
  const { items, albumId, albumSlug, totalAmount, clearCart } = useCart();
  const searchParams = useSearchParams();
  const returnAlbumSlug = albumSlug || searchParams.get("album");
  const galleryHref = returnAlbumSlug ? `/album/${returnAlbumSlug}` : "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  
  const [loadingMethod, setLoadingMethod] = useState<"PIX" | "CREDIT_CARD" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>,
    paymentMethod: "PIX" | "CREDIT_CARD"
  ) => {
    e.preventDefault();
    if (items.length === 0 || !albumId) return;
    if (!e.currentTarget.form?.reportValidity()) return;

    setLoadingMethod(paymentMethod);
    setError(null);

    try {
      const res = await fetch("/api/checkout/mercadopago", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          albumId,
          photoIds: items.map((i) => i.id),
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          customerDocument: document || null,
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erro ao processar o checkout.");
      }

      const { checkoutUrl } = await res.json();
      
      // Limpa o carrinho local antes do redirecionamento
      clearCart();

      // Redireciona o usuário para o checkout do Mercado Pago
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao processar seu pagamento. Tente novamente.");
      setLoadingMethod(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-6 mx-auto">
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Carrinho Vazio</h2>
        <p className="text-zinc-500 max-w-sm mx-auto mb-6 text-sm">
          Você não possui nenhuma foto no carrinho de compras. Retorne à galeria do álbum para selecionar suas fotos.
        </p>
        <Link
          href={galleryHref}
          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-semibold transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para a Galeria
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href={galleryHref}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all border border-zinc-800"
              aria-label="Voltar para a galeria"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">Finalizar Compra</h1>
              <p className="text-zinc-500 text-xs mt-0.5">Preencha seus dados para receber as fotos.</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-5 gap-8">
          {/* Formulário do Cliente */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard size={18} className="text-violet-400" />
                Dados do Comprador
              </h3>

              <form className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    E-mail (Para envio dos downloads)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="exemplo@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      WhatsApp/Telefone
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      CPF (Opcional)
                    </label>
                    <input
                      type="text"
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-xs">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={loadingMethod !== null}
                    onClick={(event) => handleSubmit(event, "PIX")}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                  >
                    {loadingMethod === "PIX" ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Gerando Pix...
                      </>
                    ) : (
                      <>
                        <QrCode size={18} />
                        Gerar Pix
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loadingMethod !== null}
                    onClick={(event) => handleSubmit(event, "CREDIT_CARD")}
                    className="w-full bg-zinc-950 hover:bg-zinc-900 text-white font-bold py-4 px-6 rounded-xl transition-all border border-zinc-800 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                  >
                    {loadingMethod === "CREDIT_CARD" ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Abrindo cartão...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Pagar com cartão
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] leading-relaxed text-zinc-500">
                  As duas opções são processadas pelo Mercado Pago. No Pix, você será direcionado para gerar o QR Code/copia e cola. No cartão, o Mercado Pago abre o checkout de crédito.
                </p>
              </form>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900">
                Resumo da Compra
              </h3>

              <div className="max-h-72 overflow-y-auto space-y-3 divide-y divide-zinc-900/50">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 pt-3 first:pt-0">
                    <div className="h-12 w-12 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                      <img src={item.previewUrl} alt={item.originalFileName} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 font-medium truncate">{item.originalFileName}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-900 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Fotos selecionadas</span>
                  <span className="text-white font-semibold">{items.length}</span>
                </div>
                <div className="flex justify-between items-center text-base pt-2">
                  <span className="font-bold text-white">Total a pagar</span>
                  <span className="font-black text-violet-400 text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
