"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderPlus, Calendar, MapPin, Image as ImageIcon, ExternalLink, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/money";

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  defaultPhotoPrice: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  _count: {
    photos: number;
  };
}

export default function AlbunsListPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlbums() {
      try {
        const res = await fetch("/api/albuns");
        if (res.ok) {
          const data = await res.json();
          setAlbums(data);
        }
      } catch (error) {
        console.error("Erro ao carregar álbuns:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAlbums();
  }, []);

  return (
    <div className="space-y-8">
      {/* Topo Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Meus Álbuns</h1>
          <p className="text-zinc-400 mt-1">Crie e gerencie os álbuns de fotos dos seus eventos.</p>
        </div>
        <Link
          href="/dashboard/albuns/novo"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-lg shadow-violet-500/25 text-sm"
        >
          <FolderPlus size={18} />
          Novo Álbum
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800 h-64 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/20 backdrop-blur-md border border-zinc-800 rounded-3xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto text-zinc-500">
            <FolderPlus size={28} />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum álbum criado</h3>
          <p className="text-zinc-500 max-w-sm mx-auto text-sm">
            Comece criando o seu primeiro álbum de fotos para disponibilizar aos seus clientes.
          </p>
          <Link
            href="/dashboard/albuns/novo"
            className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm"
          >
            Começar Agora
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl flex flex-col justify-between overflow-hidden group hover:border-zinc-700 transition-all shadow-xl"
            >
              <div className="p-6 space-y-4">
                {/* Badge Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      album.status === "PUBLISHED"
                        ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                        : album.status === "ARCHIVED"
                        ? "bg-zinc-800 text-zinc-500 border-zinc-700"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {album.status === "PUBLISHED"
                      ? "Publicado"
                      : album.status === "ARCHIVED"
                      ? "Arquivado"
                      : "Rascunho"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(album.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors truncate">
                    {album.title}
                  </h3>
                  <p className="text-sm text-zinc-400 line-clamp-2 h-10">
                    {album.description || "Sem descrição disponível."}
                  </p>
                </div>

                {/* Infos adicionais */}
                <div className="pt-2 space-y-2 border-t border-zinc-900 text-xs text-zinc-500">
                  {album.eventDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{new Date(album.eventDate).toLocaleDateString("pt-BR")}</span>
                    </div>
                  )}
                  {album.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span className="truncate">{album.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} />
                    <span>{album._count.photos} fotos no álbum</span>
                  </div>
                </div>
              </div>

              {/* Botões Ações */}
              <div className="bg-zinc-950/60 border-t border-zinc-900 p-4 grid grid-cols-2 gap-3">
                <Link
                  href={`/dashboard/albuns/${album.id}`}
                  className="w-full text-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2 rounded-xl text-xs transition-colors border border-zinc-800"
                >
                  Gerenciar
                </Link>
                {album.status === "PUBLISHED" ? (
                  <Link
                    href={`/album/${album.slug}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-1.5 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 font-semibold py-2 rounded-xl text-xs transition-colors border border-violet-500/20"
                  >
                    <ExternalLink size={12} />
                    Página Pública
                  </Link>
                ) : (
                  <div className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 text-zinc-600 font-medium py-2 rounded-xl text-xs border border-zinc-900 cursor-not-allowed">
                    <Lock size={12} />
                    Link Privado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
