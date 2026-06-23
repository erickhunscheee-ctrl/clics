import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { Camera, Calendar, MapPin, Image as ImageIcon, Sparkles, User, ArrowRight, ShieldCheck, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Busca o usuário atual (caso esteja logado)
  const user = await getCurrentUser();

  // Busca todos os álbuns publicados no banco de dados
  const albums = await prisma.album.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      photographer: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          photos: true,
        },
      },
    },
    orderBy: {
      eventDate: "desc",
    },
  });

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Luzes de fundo / Gradients */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              PhotoStore
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-full px-4 py-2 transition-all duration-200"
                >
                  Painel do Fotógrafo
                </Link>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full border border-zinc-800"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-violet-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full px-5 py-2.5 shadow-lg shadow-violet-500/20 transition-all duration-200"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12 max-w-7xl space-y-16 relative z-10">
        
        {/* Hero Section para Compradores */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles size={12} /> Adquira suas fotos em alta resolução
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Encontre seu evento e{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-white">
              guarde suas memórias
            </span>
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Busque pelo seu evento abaixo, selecione suas fotos favoritas na galeria e receba os arquivos originais por download imediatamente após o Pix.
          </p>
        </section>

        {/* Galeria de Eventos/Álbuns */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Álbuns Disponíveis ({albums.length})
            </h2>
          </div>

          {albums.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900/10 border border-zinc-900 rounded-3xl space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <ImageIcon size={28} />
              </div>
              <h3 className="text-lg font-bold text-white">Nenhum evento ativo</h3>
              <p className="text-zinc-500 max-w-sm mx-auto text-sm">
                No momento não há álbuns públicos listados para venda. Entre em contato com seu fotógrafo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.slug}`}
                  className="group bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-350 shadow-lg hover:shadow-2xl hover:shadow-violet-600/5 hover:-translate-y-1"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="aspect-[16/10] bg-zinc-950 relative overflow-hidden">
                      <img
                        src={album.coverImageUrl || "/placeholder.jpg"}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                      
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="bg-violet-600/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-violet-500/20 text-white shadow-md">
                          {album._count.photos} fotos
                        </span>
                        <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 text-white">
                          A partir de {formatCurrency(album.defaultPhotoPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6 space-y-4">
                      <h3 className="text-lg font-extrabold text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                        {album.title}
                      </h3>
                      {album.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {album.description}
                        </p>
                      )}

                      <div className="pt-2 flex flex-col gap-2 text-xs text-zinc-500 border-t border-zinc-900">
                        {album.eventDate && (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-violet-400" />
                            <span>{new Date(album.eventDate).toLocaleDateString("pt-BR")}</span>
                          </div>
                        )}
                        {album.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-violet-400" />
                            <span className="truncate">{album.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-6 pt-2">
                    <div className="w-full py-3 bg-zinc-900 group-hover:bg-violet-600 group-hover:text-white rounded-2xl text-xs font-bold text-zinc-300 border border-zinc-800 group-hover:border-violet-500 flex items-center justify-center gap-2 transition-all">
                      Acessar Galeria <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 relative z-10">
        <div className="container mx-auto px-6 max-w-5xl space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-zinc-400" />
              <span>&copy; {new Date().getFullYear()} PhotoStore. Todos os direitos reservados.</span>
            </div>
            
            {/* Botão de área de fotógrafo discreto */}
            <div className="flex items-center gap-6">
              <Link 
                href="/dashboard" 
                className="text-xs font-semibold text-zinc-600 hover:text-violet-400 transition-colors border border-zinc-900 hover:border-violet-500/20 px-3 py-1.5 rounded-lg bg-zinc-900/20"
              >
                Área do Fotógrafo &rarr;
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
