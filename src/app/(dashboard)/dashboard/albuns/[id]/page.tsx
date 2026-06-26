"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Globe, Sparkles } from "lucide-react";

interface Photo {
  id: string;
  originalFileName: string;
  previewUrl: string;
  price: number;
  status: "ACTIVE" | "HIDDEN";
}

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  defaultPhotoPrice: number;
  isFeatured: boolean;
  promotionEnabled: boolean;
  promotionMinPhotos: number;
  promotionDiscountBps: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  photos: Photo[];
}

interface EditAlbumPageProps {
  params: Promise<{ id: string }>;
}

export default function EditAlbumPage({ params }: EditAlbumPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [album, setAlbum] = useState<Album | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [defaultPhotoPrice, setDefaultPhotoPrice] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);
  const [promotionEnabled, setPromotionEnabled] = useState(false);
  const [promotionMinPhotos, setPromotionMinPhotos] = useState("0");
  const [promotionDiscountPercent, setPromotionDiscountPercent] = useState("0");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadAlbum() {
      try {
        const response = await fetch(`/api/albuns/${id}`);
        if (!response.ok) throw new Error("Álbum não encontrado.");
        const data = await response.json();
        
        setAlbum(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setEventDate(data.eventDate ? new Date(data.eventDate).toISOString().split("T")[0] : "");
        setLocation(data.location || "");
        setDefaultPhotoPrice((data.defaultPhotoPrice / 100).toFixed(2));
        setIsFeatured(Boolean(data.isFeatured));
        setPromotionEnabled(Boolean(data.promotionEnabled));
        setPromotionMinPhotos(String(data.promotionMinPhotos ?? 0));
        setPromotionDiscountPercent(((data.promotionDiscountBps ?? 0) / 100).toFixed(2));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao carregar album.");
      } finally {
        setLoading(false);
      }
    }
    loadAlbum();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/albuns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          eventDate: eventDate || null,
          location: location || null,
          defaultPhotoPrice: parseFloat(defaultPhotoPrice) || 0,
          isFeatured,
          promotionEnabled,
          promotionMinPhotos: parseInt(promotionMinPhotos) || 0,
          promotionDiscountPercent: parseFloat(promotionDiscountPercent) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao atualizar álbum.");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar alteracoes.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePublishAction = async (action: "publish" | "draft" | "archive") => {
    setError(null);
    try {
      const response = await fetch(`/api/albuns/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Falha ao mudar status.");
      }

      setAlbum(data);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao mudar status.");
    }
  };

  const handleDeleteAlbum = async () => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este álbum e todas as suas fotos?")) return;

    try {
      const response = await fetch(`/api/albuns/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir álbum.");

      router.push("/dashboard/albuns");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao deletar album.");
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-zinc-500 animate-pulse">Carregando detalhes do álbum...</div>;
  }

  if (!album) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Álbum não encontrado</h2>
        <Link href="/dashboard/albuns" className="text-violet-400 mt-4 inline-block hover:underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Voltar e Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard/albuns"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para Meus Álbuns
        </Link>

        {album.status === "PUBLISHED" && (
          <Link
            href={`/album/${album.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-xs bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 font-bold px-4 py-2 border border-violet-500/20 rounded-xl transition-colors"
          >
            <Globe size={14} />
            Visualizar Página Pública
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{album.title}</h1>
          <p className="text-zinc-400 mt-1">Gerencie os detalhes e visualize as fotos enviadas.</p>
        </div>

        {/* Ações Rápidas de Publicação */}
        <div className="flex flex-wrap gap-3">
          {album.status !== "PUBLISHED" ? (
            <button
              onClick={() => handlePublishAction("publish")}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors shadow-lg shadow-violet-500/20"
            >
              Publicar Álbum
            </button>
          ) : (
            <button
              onClick={() => handlePublishAction("draft")}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
            >
              Mudar para Rascunho
            </button>
          )}

          {album.status !== "ARCHIVED" && (
            <button
              onClick={() => handlePublishAction("archive")}
              className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
            >
              Arquivar
            </button>
          )}

          <button
            onClick={handleDeleteAlbum}
            className="bg-red-950/40 hover:bg-red-950 border border-red-900/50 hover:border-red-900 text-red-400 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-800 rounded-xl text-emerald-300 text-sm">
          Alterações salvas com sucesso!
        </div>
      )}

      {/* Grid de Seções */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário Dados do Álbum */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl space-y-5">
              <h3 className="text-lg font-bold text-white mb-2">Informações do Álbum</h3>

              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Título do Álbum
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Descrição
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    Data do Evento
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    Local
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Preço Padrão por Foto (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={defaultPhotoPrice}
                    onChange={(e) => setDefaultPhotoPrice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-sky-900/40 bg-sky-950/10 p-5">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-sky-500"
                  />
                  <span>
                    <span className="block text-sm font-bold text-white">Album em destaque na home</span>
                    <span className="mt-1 block text-xs text-zinc-400">
                      Quando ativado, este album aparece como o destaque principal. Os outros albuns saem para o carrossel.
                    </span>
                  </span>
                </label>
              </div>

              <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/10 p-5 space-y-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={promotionEnabled}
                    onChange={(e) => setPromotionEnabled(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-emerald-500"
                  />
                  <span>
                    <span className="block text-sm font-bold text-white">Ativar promocao por quantidade</span>
                    <span className="mt-1 block text-xs text-zinc-400">
                      Aplica um desconto percentual no total quando o cliente atingir a quantidade minima de fotos.
                    </span>
                  </span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                      Minimo de fotos
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={promotionMinPhotos}
                      onChange={(e) => setPromotionMinPhotos(e.target.value)}
                      disabled={!promotionEnabled}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                      Desconto (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99.99"
                      step="0.01"
                      value={promotionDiscountPercent}
                      onChange={(e) => setPromotionDiscountPercent(e.target.value)}
                      disabled={!promotionEnabled}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>

                <p className="text-xs text-zinc-500">
                  Exemplo: compre 2 e pague 1 = minimo 2 fotos e 50% de desconto.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-violet-500/25 text-sm disabled:opacity-50"
            >
              <Save size={18} />
              {updating ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
        </div>

        {/* Gerenciamento de Fotos */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl h-fit space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Fotos do Álbum</h3>
            <span className="text-xs font-semibold bg-zinc-800 text-zinc-300 py-1 px-3 border border-zinc-700 rounded-full">
              {album.photos?.length || 0}
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            Adicione fotos, altere preços individuais ou em lote, delete e organize a galeria pública deste álbum.
          </p>

          <Link
            href={`/dashboard/albuns/${album.id}/fotos`}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-md"
          >
            <Sparkles size={16} />
            Gerenciar & Enviar Fotos
          </Link>
        </div>
      </div>
    </div>
  );
}
