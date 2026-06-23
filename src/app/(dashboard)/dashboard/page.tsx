import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { Camera, FolderOpen, DollarSign, Receipt, Eye } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();

  // Busca dados de estatísticas dos álbuns e pedidos do fotógrafo
  const albums = await prisma.album.findMany({
    where: { photographerId: user.id },
    select: {
      id: true,
      title: true,
      status: true,
      _count: {
        select: { photos: true, orders: true },
      },
    },
  });

  const orders = await prisma.order.findMany({
    where: {
      album: {
        photographerId: user.id,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      album: {
        select: { title: true },
      },
    },
  });

  // Estatísticas agregadas
  const totalAlbums = albums.length;
  const totalPhotos = albums.reduce((acc: number, curr: { _count: { photos: number } }) => acc + curr._count.photos, 0);

  const totalPaidOrders = await prisma.order.findMany({
    where: {
      album: { photographerId: user.id },
      status: "PAID",
    },
    select: { totalAmount: true },
  });

  const revenue = totalPaidOrders.reduce((acc: number, curr: { totalAmount: number }) => acc + curr.totalAmount, 0);
  const totalSales = totalPaidOrders.length;

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Olá, {user.name} 👋
        </h1>
        <p className="text-zinc-400 mt-2">
          Aqui está o resumo da performance das suas vendas de fotos.
        </p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Faturamento */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Faturamento Total</span>
            <h3 className="text-2xl font-bold text-emerald-400 mt-2">{formatCurrency(revenue)}</h3>
          </div>
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Total Vendas */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Pedidos Pagos</span>
            <h3 className="text-2xl font-bold text-violet-400 mt-2">{totalSales}</h3>
          </div>
          <div className="p-4 bg-violet-500/10 text-violet-400 rounded-xl">
            <Receipt size={22} />
          </div>
        </div>

        {/* Total Álbuns */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Álbuns Ativos</span>
            <h3 className="text-2xl font-bold text-white mt-2">{totalAlbums}</h3>
          </div>
          <div className="p-4 bg-zinc-800 text-zinc-300 rounded-xl">
            <FolderOpen size={22} />
          </div>
        </div>

        {/* Total Fotos */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Fotos Hospedadas</span>
            <h3 className="text-2xl font-bold text-white mt-2">{totalPhotos}</h3>
          </div>
          <div className="p-4 bg-zinc-800 text-zinc-300 rounded-xl">
            <Camera size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Pedidos Recentes */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Últimos Pedidos</h2>
            <Link href="/dashboard/pedidos" className="text-xs text-violet-400 hover:text-violet-300 font-semibold">
              Ver todos
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">Nenhum pedido recebido ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-3 font-semibold">Cliente</th>
                    <th className="py-3 font-semibold">Álbum</th>
                    <th className="py-3 font-semibold">Valor</th>
                    <th className="py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="py-4">
                        <div className="font-medium text-white">{order.customerName}</div>
                        <div className="text-xs text-zinc-500">{order.customerEmail}</div>
                      </td>
                      <td className="py-4">{order.album.title}</td>
                      <td className="py-4 font-semibold text-white">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${order.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : order.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                        >
                          {order.status === "PAID"
                            ? "Pago"
                            : order.status === "PENDING"
                              ? "Pendente"
                              : "Cancelado / Falhou"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumo de Álbuns */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Meus Álbuns</h2>
            <Link href="/dashboard/albuns/novo" className="text-xs text-violet-400 hover:text-violet-300 font-semibold">
              + Criar Álbum
            </Link>
          </div>

          {albums.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">Nenhum álbum criado ainda.</p>
          ) : (
            <div className="space-y-4">
              {albums.slice(0, 4).map((album) => (
                <div
                  key={album.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 transition-all"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{album.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {album._count.photos} fotos • {album._count.orders} pedidos
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${album.status === "PUBLISHED"
                        ? "bg-violet-500/10 text-violet-400 border-violet-500/25"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                  >
                    {album.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
