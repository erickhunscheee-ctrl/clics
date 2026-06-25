"use client";

import { Suspense, useEffect } from "react";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/money";
import { ShoppingBag, ArrowLeft, Loader2, CreditCard, QrCode, Copy, CheckCircle2, Lock, Shield } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";

// Tipagem global do script do Mercado Pago
declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string }
    ) => MercadoPagoInstance;
  }
}

interface MercadoPagoInstance {
  createCardToken: (cardData: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType?: string;
    identificationNumber?: string;
  }) => Promise<{ id?: string }>;
  getPaymentMethods: (params: { bin: string }) => Promise<{
    results?: Array<{
      id?: string;
      issuer?: { id?: number | string };
    }>;
  }>;
  getInstallments: (params: {
    amount: string;
    bin: string;
    paymentTypeId: "credit_card";
  }) => Promise<MercadoPagoInstallmentResponse>;
}

type MercadoPagoInstallmentResponse = Array<{
  payer_costs?: Array<{
    installments?: number;
    installment_amount?: number;
    total_amount?: number;
    recommended_message?: string;
    labels?: string[];
  }>;
}>;

type InstallmentOption = {
  installments: number;
  installmentAmount: number;
  totalAmount: number;
  message: string;
  hasInterest: boolean;
};

type InstallmentsResult = {
  bin: string;
  options: InstallmentOption[];
  notice: string;
};

function toCentavosFromReais(value: number) {
  return Math.round(value * 100);
}

function buildFallbackInstallments(totalAmount: number): InstallmentOption[] {
  return Array.from({ length: 12 }, (_, index) => {
    const installments = index + 1;
    const installmentAmount = Math.ceil(totalAmount / installments);

    return {
      installments,
      installmentAmount,
      totalAmount,
      message: `${installments}x de ${formatCurrency(installmentAmount)} sem juros`,
      hasInterest: false,
    };
  });
}

function normalizeMercadoPagoInstallments(
  response: MercadoPagoInstallmentResponse,
  totalAmount: number
): InstallmentOption[] {
  const payerCosts = response.flatMap((item) => item.payer_costs ?? []);

  return payerCosts
    .filter((payerCost) => {
      const installments = payerCost.installments ?? 0;
      return installments >= 1 && installments <= 12;
    })
    .map((payerCost) => {
      const installments = payerCost.installments ?? 1;
      const totalAmountFromMp = toCentavosFromReais(payerCost.total_amount ?? totalAmount / 100);
      const installmentAmount = toCentavosFromReais(
        payerCost.installment_amount ?? totalAmountFromMp / installments / 100
      );
      const message =
        payerCost.recommended_message ||
        `${installments}x de ${formatCurrency(installmentAmount)}${
          totalAmountFromMp > totalAmount ? ` - total ${formatCurrency(totalAmountFromMp)}` : " sem juros"
        }`;

      return {
        installments,
        installmentAmount,
        totalAmount: totalAmountFromMp,
        message,
        hasInterest: totalAmountFromMp > totalAmount || !(payerCost.labels ?? []).includes("recommended_installment"),
      };
    })
    .sort((a, b) => a.installments - b.installments);
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#F6F8FC" }}
    >
      <div className="flex items-center gap-3 text-sm font-semibold" style={{ color: "#061337" }}>
        <Loader2 className="animate-spin" size={20} style={{ color: "#159BEF" }} />
        Carregando checkout...
      </div>
    </div>
  );
}

function CheckoutContent() {
  const { items, albumId, albumSlug, totalAmount, clearCart } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnAlbumSlug = albumSlug || searchParams.get("album");
  const galleryHref = returnAlbumSlug ? `/album/${returnAlbumSlug}` : "/";

  // Dados complementares do comprador
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");

  // Dados do Cartão
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState("1");
  const [installmentsResult, setInstallmentsResult] = useState<InstallmentsResult | null>(null);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);

  // Estados de Transação e UI
  const [loadingMethod, setLoadingMethod] = useState<"PIX" | "CREDIT_CARD" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  // Estado do Modal do Pix
  const [pixModalData, setPixModalData] = useState<{
    copiaECola: string;
    qrCodeBase64: string;
    accessToken: string;
  } | null>(null);

  // Instância do Mercado Pago no Cliente
  const [mpInstance, setMpInstance] = useState<MercadoPagoInstance | null>(null);
  const cardBin = cardNumber.replace(/\D/g, "").substring(0, 6);
  const fallbackInstallmentOptions = buildFallbackInstallments(totalAmount);
  const hasMercadoPagoInstallments =
    cardBin.length === 6 && installmentsResult?.bin === cardBin && installmentsResult.options.length > 0;
  const installmentOptions = hasMercadoPagoInstallments
    ? installmentsResult.options
    : fallbackInstallmentOptions;
  const installmentsNotice =
    cardBin.length < 6
      ? "Digite os 6 primeiros numeros do cartao para ver os juros reais do Mercado Pago."
      : installmentsLoading
        ? "Atualizando parcelas..."
        : installmentsResult?.bin === cardBin
          ? installmentsResult.notice
          : "Carregando o Mercado Pago para consultar os juros reais.";

  const handleScriptLoad = async () => {
    if (typeof window !== "undefined" && window.MercadoPago) {
      const publicKey =
        process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
        (await fetch("/api/checkout/mercadopago/public-key")
          .then((res) => (res.ok ? res.json() : null))
          .then((data: { publicKey?: string } | null) => data?.publicKey)
          .catch(() => null));

      if (!publicKey) {
        setError("Chave publica do Mercado Pago nao configurada.");
        return;
      }
      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      setMpInstance(mp);
      setSdkReady(true);
    }
  };

  // Polling para checar pagamento do Pix
  useEffect(() => {
    if (!pixModalData) return;
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedido/${pixModalData.accessToken}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "PAID") {
            clearInterval(intervalId);
            clearCart();
            router.push(`/pedido/${pixModalData.accessToken}?status=success`);
          }
        }
      } catch (err) {
        console.error("Erro no polling de status:", err);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [pixModalData, clearCart, router]);

  useEffect(() => {
    if (!showCardForm || cardBin.length < 6 || !sdkReady || !mpInstance) return;

    let shouldUpdate = true;
    void Promise.resolve().then(async () => {
      if (!shouldUpdate) return;
      setInstallmentsLoading(true);

      try {
        const response = await mpInstance.getInstallments({
          amount: (totalAmount / 100).toFixed(2),
          bin: cardBin,
          paymentTypeId: "credit_card",
        });
        if (!shouldUpdate) return;

        const mercadoPagoOptions = normalizeMercadoPagoInstallments(response, totalAmount);
        const fallbackOptions = buildFallbackInstallments(totalAmount);
        const nextOptions = mercadoPagoOptions.length > 0 ? mercadoPagoOptions : fallbackOptions;

        setInstallmentsResult({
          bin: cardBin,
          options: nextOptions,
          notice:
            mercadoPagoOptions.length > 0
              ? "Valores calculados pelo Mercado Pago conforme o cartao informado."
              : "Nao foi possivel consultar o Mercado Pago para este cartao. Confira o valor final antes de confirmar.",
        });
        setInstallments((current) =>
          nextOptions.some((option) => String(option.installments) === current)
            ? current
            : String(nextOptions[0]?.installments ?? 1)
        );
      } catch {
        if (!shouldUpdate) return;
        setInstallmentsResult({
          bin: cardBin,
          options: buildFallbackInstallments(totalAmount),
          notice: "Nao foi possivel consultar os juros agora. O Mercado Pago validara o valor final ao processar.",
        });
      } finally {
        if (shouldUpdate) setInstallmentsLoading(false);
      }
    });

    return () => {
      shouldUpdate = false;
    };
  }, [cardBin, mpInstance, sdkReady, showCardForm, totalAmount]);

  const handleCopyPix = () => {
    if (pixModalData) {
      navigator.clipboard.writeText(pixModalData.copiaECola);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const handleGeneratePix = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (items.length === 0 || !albumId) return;
    setLoadingMethod("PIX");
    setError(null);
    try {
      const res = await fetch("/api/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId,
          photoIds: items.map((i) => i.id),
          customerPhone: phone,
          customerDocument: document || null,
          paymentMethod: "PIX",
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erro ao processar o Pix.");
      }
      const responseData = await res.json();
      setPixModalData({
        copiaECola: responseData.pixCopiaECola,
        qrCodeBase64: responseData.pixQrCodeBase64,
        accessToken: responseData.accessToken,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao gerar o Pix.");
    } finally {
      setLoadingMethod(null);
    }
  };

  const handlePayCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !albumId) return;
    if (!sdkReady || !mpInstance) {
      setError("O gateway de pagamento ainda está carregando. Por favor, aguarde alguns segundos.");
      return;
    }
    setLoadingMethod("CREDIT_CARD");
    setError(null);
    try {
      const [expiryMonth, expiryYear] = cardExpiry.split("/");
      if (!expiryMonth || !expiryYear) throw new Error("Data de vencimento inválida. Use MM/AA.");

      const cleanDocument = document.replace(/\D/g, "");
      if (cleanDocument.length !== 11) throw new Error("Informe um CPF valido para pagar com cartao.");

      const cardTokenResponse = await mpInstance.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ""),
        cardholderName: cardName,
        cardExpirationMonth: expiryMonth.trim(),
        cardExpirationYear: "20" + expiryYear.trim(),
        securityCode: cardCvv,
        identificationType: "CPF",
        identificationNumber: cleanDocument,
      });
      if (!cardTokenResponse?.id) throw new Error("Falha ao validar os dados do cartão.");

      let detectedMethodId: string | null = null;
      let issuerId: number | null = null;
      try {
        const bin = cardNumber.replace(/\D/g, "").substring(0, 6);
        const paymentMethods = await mpInstance.getPaymentMethods({ bin });
        const paymentMethod = paymentMethods?.results?.[0];
        if (paymentMethod?.id) detectedMethodId = paymentMethod.id;
        const parsedIssuerId = Number(paymentMethod?.issuer?.id);
        if (Number.isInteger(parsedIssuerId) && parsedIssuerId > 0) issuerId = parsedIssuerId;
      } catch { /* usa padrão */ }

      const res = await fetch("/api/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId,
          photoIds: items.map((i) => i.id),
          customerPhone: phone,
          customerDocument: document || null,
          paymentMethod: "CREDIT_CARD",
          cardToken: cardTokenResponse.id,
          installments: parseInt(installments),
          paymentMethodId: detectedMethodId,
          issuerId,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erro ao processar o cartão.");
      }
      const responseData = await res.json();
      clearCart();
      router.push(`/pedido/${responseData.accessToken}?status=${responseData.status === "PAID" ? "success" : "pending"}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao processar o cartão.");
      setLoadingMethod(null);
    }
  };

  const inputClass = "w-full border rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none";
  const inputStyle = {
    background: "#F6F8FC",
    borderColor: "#e5e7eb",
    color: "#061337",
  };
  const labelClass = "block text-[10px] font-bold uppercase tracking-wider mb-1.5";
  const labelStyle = { color: "#9ca3af" };

  // ─── Carrinho vazio ─────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: "#F6F8FC" }}>
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6 mx-auto"
          style={{ background: "white", border: "1px solid #e5e7eb", color: "#9ca3af", boxShadow: "0 2px 16px rgba(6,19,55,0.07)" }}
        >
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}>
          Carrinho Vazio
        </h2>
        <p className="max-w-sm mx-auto mb-6 text-sm" style={{ color: "#6b7280" }}>
          Você não possui nenhuma foto no carrinho. Retorne à galeria do álbum para selecionar suas fotos.
        </p>
        <Link
          href={galleryHref}
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: "#159BEF" }}
        >
          <ArrowLeft size={16} />
          Voltar para a Galeria
        </Link>
      </div>
    );
  }

  // ─── Página principal ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-12" style={{ background: "#F6F8FC", color: "#061337", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" onLoad={handleScriptLoad} />

      {/* ── Header ────────────────────────────────────── */}
      <header className="sticky top-0 z-40 px-4 pt-4 pb-2" style={{ background: "#F6F8FC" }}>
        <div
          className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 max-w-4xl mx-auto"
          style={{ boxShadow: "0 2px 16px rgba(6,19,55,0.07)" }}
        >
          <Link
            href={galleryHref}
            className="p-2 rounded-xl transition-colors hover:bg-[#F6F8FC]"
            aria-label="Voltar"
            style={{ color: "#061337" }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Link href="/">
              <Image src="/logo_clics.png" alt="CLICS" width={32} height={32} className="w-8 h-8 object-contain" />
            </Link>
            <div className="h-4 w-px mx-1" style={{ background: "#e5e7eb" }} />
            <div>
              <h1
                className="text-base font-bold leading-tight"
                style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}
              >
                Finalizar Compra
              </h1>
              <p className="text-[11px]" style={{ color: "#9ca3af" }}>Escolha a forma de pagamento para receber as fotos.</p>
            </div>
          </div>
          {/* Badge segurança */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#159BEF" }}>
            <Shield size={14} />
            Compra segura
          </div>
        </div>
      </header>

      {/* ── Conteúdo ─────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 pt-6 grid md:grid-cols-5 gap-6">

        {/* ── Formulário ── */}
        <div className="md:col-span-3 space-y-4">

          {/* Card: Pagamento */}
          <div className="bg-white rounded-3xl p-6 md:p-8 space-y-5" style={{ boxShadow: "0 2px 16px rgba(6,19,55,0.07)" }}>
            <h2
              className="text-base font-bold flex items-center gap-2"
              style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #159BEF, #7B3FF2)" }}
              >
                <CreditCard size={14} className="text-white" />
              </div>
              Dados do Pagamento
            </h2>

            <form onSubmit={handlePayCard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={labelStyle}>WhatsApp / Telefone {showCardForm ? "" : "(Opcional)"}</label>
                  <input
                    type="tel"
                    required={showCardForm}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>CPF {showCardForm ? "(Obrigatório para Cartão)" : "(Opcional)"}</label>
                  <input
                    type="text"
                    required={showCardForm}
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              {/* ── Formulário de Cartão ── */}
              {showCardForm && (
                <div
                  className="rounded-2xl p-5 space-y-4"
                  style={{ background: "#F6F8FC", border: "1px solid #e5e7eb" }}
                >
                  <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #159BEF, #7B3FF2)" }}
                    >
                      <CreditCard size={11} className="text-white" />
                    </div>
                    <h3
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#7B3FF2" }}
                    >
                      Dados do Cartão de Crédito
                    </h3>
                  </div>

                  <div>
                    <label className={labelClass} style={labelStyle}>Número do Cartão</label>
                    <input
                      type="text"
                      required={showCardForm}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim())}
                      className={inputClass}
                      style={{ ...inputStyle, background: "white" }}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                  </div>

                  <div>
                    <label className={labelClass} style={labelStyle}>Nome Impresso no Cartão</label>
                    <input
                      type="text"
                      required={showCardForm}
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className={inputClass}
                      style={{ ...inputStyle, background: "white" }}
                      placeholder="NOME DO TITULAR"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} style={labelStyle}>Vencimento (MM/AA)</label>
                      <input
                        type="text"
                        required={showCardForm}
                        value={cardExpiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "");
                          if (v.length > 2) v = v.substring(0, 2) + "/" + v.substring(2, 4);
                          setCardExpiry(v);
                        }}
                        className={inputClass}
                        style={{ ...inputStyle, background: "white" }}
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className={labelClass} style={labelStyle}>Código CVV</label>
                      <input
                        type="text"
                        required={showCardForm}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        className={inputClass}
                        style={{ ...inputStyle, background: "white" }}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} style={labelStyle}>Parcelas</label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className={inputClass + " cursor-pointer"}
                      style={{ ...inputStyle, background: "white" }}
                      disabled={installmentsLoading}
                    >
                      {installmentOptions.map((option) => (
                        <option key={option.installments} value={option.installments}>
                          {option.message}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "#9ca3af" }}>
                      {installmentsLoading ? "Atualizando parcelas..." : installmentsNotice}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Erro ── */}
              {error && (
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
                >
                  {error}
                </div>
              )}

              {/* ── Botões ── */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Pix */}
                <button
                  type="button"
                  disabled={loadingMethod !== null}
                  onClick={handleGeneratePix}
                  className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)",
                    boxShadow: "0 8px 24px rgba(21,155,239,0.25)",
                  }}
                >
                  {loadingMethod === "PIX" ? (
                    <><Loader2 className="animate-spin" size={17} /> Gerando Pix...</>
                  ) : (
                    <><QrCode size={17} /> Pagar via Pix</>
                  )}
                </button>

                {/* Cartão */}
                {!showCardForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCardForm(true)}
                    className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer"
                    style={{
                      background: "white",
                      color: "#061337",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 2px 8px rgba(6,19,55,0.06)",
                    }}
                  >
                    <CreditCard size={17} />
                    Pagar com Cartão
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loadingMethod !== null}
                    className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    style={{
                      background: "#061337",
                      boxShadow: "0 4px 16px rgba(6,19,55,0.2)",
                    }}
                  >
                    {loadingMethod === "CREDIT_CARD" ? (
                      <><Loader2 className="animate-spin" size={17} /> Processando...</>
                    ) : (
                      <><Lock size={15} /> Finalizar com Cartão</>
                    )}
                  </button>
                )}
              </div>

              {/* Nota de segurança */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Shield size={12} style={{ color: "#9ca3af" }} />
                <p className="text-[11px] text-center" style={{ color: "#9ca3af" }}>
                  Pagamento processado com segurança pelo Mercado Pago
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* ── Resumo ── */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 space-y-5" style={{ boxShadow: "0 2px 16px rgba(6,19,55,0.07)" }}>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-3"
              style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}
            >
              Resumo da Compra
            </h2>

            <div className="max-h-72 overflow-y-auto space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3" style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "12px" }}>
                  <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "1px solid #e5e7eb" }}>
                    <img src={item.previewUrl} alt={item.originalFileName} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "#061337" }}>{item.originalFileName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{formatCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-1" style={{ borderTop: "1px solid #e5e7eb" }}>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: "#6b7280" }}>Fotos selecionadas</span>
                <span className="font-semibold" style={{ color: "#061337" }}>{items.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-base" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}>
                  Total a pagar
                </span>
                <span
                  className="font-black text-xl"
                  style={{
                    fontFamily: "var(--font-poppins, Poppins, sans-serif)",
                    background: "linear-gradient(90deg, #159BEF, #7B3FF2)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Info */}
          <div className="bg-white rounded-2xl p-4 space-y-2.5" style={{ boxShadow: "0 2px 16px rgba(6,19,55,0.07)" }}>
            {[
              { icon: CheckCircle2, text: "Download imediato após confirmação" },
              { icon: Shield, text: "Pagamento criptografado e seguro" },
              { icon: Lock, text: "Seus dados nunca são compartilhados" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs" style={{ color: "#6b7280" }}>
                <Icon size={14} style={{ color: "#159BEF", flexShrink: 0 }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Modal do Pix ── */}
      {pixModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(6,19,55,0.7)", backdropFilter: "blur(8px)" }}>
          <div
            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-6 text-center relative"
            style={{ boxShadow: "0 24px 80px rgba(6,19,55,0.2)" }}
          >
            {/* Topo gradiente */}
            <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full" style={{ background: "linear-gradient(90deg, #159BEF, #7B3FF2)" }} />

            <button
              onClick={() => setPixModalData(null)}
              className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-lg transition-colors hover:bg-[#F6F8FC] cursor-pointer"
              style={{ color: "#9ca3af", border: "1px solid #e5e7eb" }}
            >
              Fechar
            </button>

            <div className="space-y-1 pt-2">
              <h3
                className="text-lg font-bold flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}
              >
                <QrCode size={20} style={{ color: "#159BEF" }} />
                Pagamento via Pix
              </h3>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                Abra o app do seu banco e escaneie o QR Code ou cole o código abaixo.
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-3 rounded-2xl inline-block mx-auto" style={{ border: "2px solid #e5e7eb" }}>
              <img
                src={`data:image/jpeg;base64,${pixModalData.qrCodeBase64}`}
                alt="QR Code Pix"
                className="w-44 h-44"
              />
            </div>

            {/* Copia e cola */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                Código Pix Copia e Cola
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixModalData.copiaECola}
                  className="flex-1 rounded-xl px-3 py-2 text-xs select-all focus:outline-none"
                  style={{ background: "#F6F8FC", border: "1px solid #e5e7eb", color: "#6b7280" }}
                />
                <button
                  onClick={handleCopyPix}
                  className="px-3 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
                  style={{
                    background: pixCopied ? "#dcfce7" : "linear-gradient(90deg, #159BEF, #7B3FF2)",
                    color: pixCopied ? "#16a34a" : "white",
                    minWidth: "80px",
                    justifyContent: "center",
                  }}
                >
                  {pixCopied ? <><CheckCircle2 size={14} /> Copiado!</> : <><Copy size={14} /> Copiar</>}
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "#9ca3af" }}>
              <Loader2 className="animate-spin" size={13} style={{ color: "#159BEF" }} />
              Aguardando confirmação do pagamento...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
