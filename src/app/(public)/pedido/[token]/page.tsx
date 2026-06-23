import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/money";
import { CheckCircle2, Clock, XCircle, Download, CreditCard, ShoppingBag, Phone, Mail, User } from "lucide-react";
import Link from "next/link";

interface OrderPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { token } = await params;
  const { status: queryStatus } = await searchParams;

  // Busca o pedido pelo token com suas fotos e itens
  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: {
      album: {
        select: {
          title: true,
          coverImageUrl: true,
        },
      },
      items: {
        include: {
          photo: {
            select: {
              id: true,
              originalFileName: true,
              previewUrl: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Verifica se o token expirou
  const isExpired = new Date() > order.accessTokenExpiresAt;

  // Se o pedido está pendente, podemos dar o link de pagamento do Mercado Pago
  const payUrl = order.mercadoPagoPreferenceId
    ? `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${order.mercadoPagoPreferenceId}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Status Card */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {order.status === "PAID" ? (
              <div className="h-14 w-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <CheckCircle2 size={32} />
              </div>
            ) : order.status === "PENDING" ? (
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock size={32} className="animate-pulse" />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <XCircle size={32} />
              </div>
            )}

            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Código do Pedido: {order.orderNumber}</span>
              <h1 className="text-xl md:text-2xl font-black text-white mt-0.5">
                {order.status === "PAID"
                  ? "Pagamento Aprovado!"
                  : order.status === "PENDING"
                  ? "Aguardando Pagamento"
                  : "Pagamento não Confirmado"}
              </h1>
              <p className="text-zinc-500 text-xs mt-1">
                {order.status === "PAID"
                  ? "Seus downloads já estão liberados abaixo. Aproveite!"
                  : order.status === "PENDING"
                  ? "Assim que o Mercado Pago confirmar a transação, suas fotos estarão disponíveis para baixar."
                  : "Houve um problema com a transação. Tente efetuar o pagamento novamente."}
              </p>
            </div>
          </div>

          {/* Pay Button / Receipt Details */}
          {order.status === "PENDING" && payUrl && !isExpired && (
            <a
              href={payUrl}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl text-sm shadow-lg shadow-violet-500/25 transition-all w-full md:w-auto text-center justify-center cursor-pointer"
            >
              <CreditCard size={16} />
              Pagar com Mercado Pago
            </a>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Items / Downloads */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900 flex items-center gap-2">
                <ShoppingBag size={16} className="text-violet-400" />
                Fotos do Pedido ({order.items.length})
              </h3>

              {isExpired && order.status === "PAID" && (
                <div className="p-4 bg-amber-950/40 border border-amber-900/50 rounded-2xl text-amber-300 text-xs">
                  Atenção: O link de acesso expirou. O prazo limite para downloads é de 30 dias após a compra.
                </div>
              )}

              <div className="space-y-4 divide-y divide-zinc-900/50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-16 w-16 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                        <img src={item.photo.previewUrl} alt={item.photo.originalFileName} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{item.photo.originalFileName}</p>
                        <p className="text-xs text-zinc-500 mt-1">{formatCurrency(item.price)}</p>
                        {item.downloadCount > 0 && (
                          <span className="text-[10px] text-zinc-600 mt-1 block">
                            Baixada {item.downloadCount} {item.downloadCount === 1 ? "vez" : "vezes"}
                          </span>
                        )}
                      </div>
                    </div>

                    {order.status === "PAID" && !isExpired && (
                      <a
                        href={`/api/download/${item.photoId}?token=${token}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 hover:bg-violet-600 text-zinc-300 hover:text-white transition-all border border-zinc-800 hover:border-violet-500 shadow-md flex-shrink-0"
                        title="Baixar foto original"
                        download
                      >
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details / Summary */}
          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900">
                Resumo do Pedido
              </h3>

              <div className="space-y-4">
                {/* Comprador */}
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Comprador</span>
                  <div className="space-y-1.5 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-zinc-500" />
                      <span>{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-zinc-500" />
                      <span className="truncate">{order.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-zinc-500" />
                      <span>{order.customerPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Resumo financeiro */}
                <div className="space-y-2 pt-2 border-t border-zinc-900">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Valores</span>
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>Fotos ({order.items.length})</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1.5 border-t border-zinc-900/50">
                    <span className="font-bold text-white">Total Pago</span>
                    <span className="font-black text-violet-400">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
