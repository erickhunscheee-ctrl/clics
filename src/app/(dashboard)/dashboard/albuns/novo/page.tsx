"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewAlbumPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [defaultPhotoPrice, setDefaultPhotoPrice] = useState("0");
  const [promotionEnabled, setPromotionEnabled] = useState(false);
  const [promotionMinPhotos, setPromotionMinPhotos] = useState("0");
  const [promotionDiscountPercent, setPromotionDiscountPercent] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/albuns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          eventDate: eventDate || null,
          location: location || null,
          defaultPhotoPrice: parseFloat(defaultPhotoPrice) || 0,
          promotionEnabled,
          promotionMinPhotos: parseInt(promotionMinPhotos) || 0,
          promotionDiscountPercent: parseFloat(promotionDiscountPercent) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao criar álbum.");
      }

      const album = await response.json();
      router.push(`/dashboard/albuns/${album.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao processar o formulario.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Botão de Voltar */}
      <div>
        <Link
          href="/dashboard/albuns"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para Meus Álbuns
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Criar Novo Álbum</h1>
        <p className="text-zinc-400 mt-1">Preencha as informações do seu evento ou ensaio fotográfico.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl space-y-5">
          <div>
            <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Título do Álbum *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Casamento Maria & João, Ensaio Gestante..."
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
              placeholder="Uma breve mensagem ou detalhes sobre o ensaio/evento para seus clientes..."
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
                placeholder="Ex: Espaço Verde, Estúdio da Vila..."
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
                placeholder="10.00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <p className="text-zinc-500 text-xs mt-1.5">
              Este valor será sugerido por padrão para cada foto adicionada ao álbum. Você poderá alterar fotos individualmente depois.
            </p>
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
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-violet-500/25 text-sm disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? "Criando Álbum..." : "Salvar e Continuar"}
        </button>
      </form>
    </div>
  );
}
