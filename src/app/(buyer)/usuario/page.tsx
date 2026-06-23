import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, CreditCard, Download, PackageCheck } from "lucide-react";
import { BuyerCartPanel } from "@/components/buyer/buyer-cart-panel";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function BuyerHomePage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: {
      customerEmail: user.email,
    },
    include: {
      album: {
        select: {
          title: true,
          slug: true,
          coverImageUrl: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const paidOrders = orders.filter((order) => order.status === "PAID").length;

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#061337]">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="text-sm font-semibold text-sky-300 hover:text-sky-200">
                Voltar para albuns
              </Link>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                Minha area de comprador
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                Acompanhe seu carrinho, pagamentos e albuns comprados sem entrar no painel do fotografo.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-black">{orders.length}</p>
                <p className="text-xs text-slate-300">Pedidos</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-black">{paidOrders}</p>
                <p className="text-xs text-slate-300">Pagos</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-black">{user.role}</p>
                <p className="text-xs text-slate-300">Perfil</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">
                  Compras
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Albuns e pagamentos
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <PackageCheck size={18} />
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Camera className="mx-auto text-slate-400" size={34} />
                <h3 className="mt-4 text-lg font-bold text-slate-950">Nenhuma compra ainda</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Quando voce finalizar um pagamento, os albuns e downloads aparecem aqui.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Escolher fotos
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[96px,minmax(0,1fr),auto]"
                  >
                    <img
                      src={order.album.coverImageUrl || "/placeholder.jpg"}
                      alt={order.album.title}
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Pedido {order.orderNumber}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-bold text-slate-950">
                        {order.album.title}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          {order._count.items} fotos
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-stretch sm:justify-center">
                      <Link
                        href={`/pedido/${order.accessToken}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                      >
                        {order.status === "PAID" ? <Download size={14} /> : <CreditCard size={14} />}
                        {order.status === "PAID" ? "Downloads" : "Pagamento"}
                      </Link>
                      <Link
                        href={`/album/${order.album.slug}`}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver album
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <BuyerCartPanel />
        </div>
      </div>
    </main>
  );
}
