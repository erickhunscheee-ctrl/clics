"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Trash2, Eye, EyeOff, Check, Edit2, Sparkles, DollarSign, X, Image } from "lucide-react";
import { formatCurrency } from "@/lib/money";

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
  defaultPhotoPrice: number;
}

interface PhotoManagementPageProps {
  params: Promise<{ id: string }>; // albumId
}

export default function PhotoManagementPage({ params }: PhotoManagementPageProps) {
  const { id: albumId } = use(params);
  const router = useRouter();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  // Seleção múltipla
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [batchPrice, setBatchPrice] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Edição individual de preço
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState("");

  const loadData = async () => {
    try {
      // Carrega o álbum
      const resAlbum = await fetch(`/api/albuns/${albumId}`);
      if (!resAlbum.ok) throw new Error("Álbum não encontrado.");
      const albumData = await resAlbum.json();
      setAlbum(albumData);
      setPhotos(albumData.photos || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [albumId]);

  // Upload múltiplo de fotos - envia direto ao servidor que comprime antes do R2
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setUploading(true);
    setError(null);

    for (const file of files) {
      const tempId = Math.random().toString();
      setUploadProgress((prev) => ({ ...prev, [tempId]: 10 }));

      try {
        // Envia o arquivo direto para o servidor via FormData
        // O servidor comprime com Sharp antes de salvar no R2
        const formData = new FormData();
        formData.append("file", file);

        setUploadProgress((prev) => ({ ...prev, [tempId]: 40 }));

        const resProcess = await fetch(`/api/fotos/${albumId}/process`, {
          method: "POST",
          body: formData,
          // Não define Content-Type: o browser define automaticamente com boundary correto
        });

        setUploadProgress((prev) => ({ ...prev, [tempId]: 80 }));

        if (!resProcess.ok) {
          const errData = await resProcess.json();
          throw new Error(errData.message || `Falha ao processar ${file.name}`);
        }

        const newPhoto = await resProcess.json();
        setPhotos((prev) => [newPhoto, ...prev]);
        setUploadProgress((prev) => ({ ...prev, [tempId]: 100 }));
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Erro no upload das fotos.");
      }
    }

    setUploading(false);
    setTimeout(() => {
      setUploadProgress({});
    }, 3000);
  };

  // Exclusão individual
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Deseja apagar definitivamente esta foto?")) return;

    try {
      const res = await fetch(`/api/fotos/${photoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao deletar foto.");

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setSelectedPhotos((prev) => prev.filter((id) => id !== photoId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Alteração de status (mostrar/ocultar)
  const handleToggleStatus = async (photo: Photo) => {
    const nextStatus = photo.status === "ACTIVE" ? "HIDDEN" : "ACTIVE";

    try {
      const res = await fetch(`/api/fotos/${photo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: photo.price / 100,
          status: nextStatus,
        }),
      });

      if (!res.ok) throw new Error("Falha ao atualizar status.");

      const updatedPhoto = await res.json();
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updatedPhoto : p)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Preço individual
  const handleSaveIndividualPrice = async (photo: Photo) => {
    try {
      const res = await fetch(`/api/fotos/${photo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: parseFloat(editingPrice) || 0,
          status: photo.status,
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar preço.");

      const updatedPhoto = await res.json();
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updatedPhoto : p)));
      setEditingPhotoId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Preço em Lote
  const handleSaveBatchPrice = async () => {
    if (selectedPhotos.length === 0) return;

    try {
      const res = await fetch("/api/fotos/batch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: selectedPhotos,
          price: parseFloat(batchPrice) || 0,
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar preço em lote.");

      setPhotos((prev) =>
        prev.map((p) =>
          selectedPhotos.includes(p.id)
            ? { ...p, price: Math.round((parseFloat(batchPrice) || 0) * 100) }
            : p
        )
      );

      setSelectedPhotos([]);
      setShowBatchModal(false);
      setBatchPrice("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map((p) => p.id));
    }
  };

  const toggleSelectPhoto = (photoId: string) => {
    if (selectedPhotos.includes(photoId)) {
      setSelectedPhotos((prev) => prev.filter((id) => id !== photoId));
    } else {
      setSelectedPhotos((prev) => [...prev, photoId]);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-zinc-500 animate-pulse">Carregando gerenciador de fotos...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Voltar */}
      <div>
        <Link
          href={`/dashboard/albuns/${albumId}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para Configuração do Álbum
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Fotos: {album?.title}</h1>
          <p className="text-zinc-400 mt-1">Carregue novas imagens e defina os valores por foto.</p>
        </div>

        {/* Input de Upload Oculto */}
        <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-lg shadow-violet-500/25 text-sm cursor-pointer disabled:opacity-50">
          <Upload size={18} />
          {uploading ? "Enviando..." : "Enviar Fotos (Múltiplas)"}
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={uploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Erros e progresso de upload */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Progresso do Upload</h4>
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3 text-xs">
                <span className="text-zinc-400 min-w-14">Aguardando...</span>
                <div className="flex-1 bg-zinc-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-350"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-zinc-300 font-semibold">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Ações em Lote */}
      {photos.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={handleSelectAll}
              className="text-xs font-semibold bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-xl border border-zinc-800 hover:text-white transition-colors"
            >
              {selectedPhotos.length === photos.length ? "Desmarcar Todos" : "Selecionar Todos"}
            </button>
            <span className="text-zinc-500">
              {selectedPhotos.length} de {photos.length} fotos selecionadas
            </span>
          </div>

          {selectedPhotos.length > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-2 bg-violet-600/15 hover:bg-violet-600/25 text-violet-400 font-semibold px-4 py-2 border border-violet-500/25 rounded-xl text-xs transition-colors"
            >
              <DollarSign size={14} />
              Definir Preço em Lote
            </button>
          )}
        </div>
      )}

      {/* Grid de Fotos */}
      {photos.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/10 border border-zinc-800 rounded-3xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-zinc-800/40 flex items-center justify-center mx-auto text-zinc-500">
            <Image size={28} />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhuma foto no álbum</h3>
          <p className="text-zinc-500 max-w-sm mx-auto text-sm">
            Clique no botão acima ou arraste imagens aqui para começar a subir as fotos deste evento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => {
                if (selectedPhotos.length > 0) toggleSelectPhoto(photo.id);
              }}
              className={`bg-zinc-900/40 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all relative ${
                selectedPhotos.includes(photo.id) ? "border-violet-500 ring-2 ring-violet-500/25" : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Checkbox de Seleção */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelectPhoto(photo.id);
                }}
                className={`absolute top-3 left-3 h-6 w-6 rounded-lg flex items-center justify-center border transition-all z-10 ${
                  selectedPhotos.includes(photo.id)
                    ? "bg-violet-500 border-violet-500 text-white"
                    : "bg-black/60 border-white/20 text-transparent hover:border-white/40"
                }`}
              >
                <Check size={14} />
              </button>

              {/* Preview da Imagem */}
              <div className="aspect-square bg-zinc-950 relative overflow-hidden">
                <img
                  src={photo.previewUrl}
                  alt={photo.originalFileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {photo.status === "HIDDEN" && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-2 text-zinc-400 font-semibold text-xs">
                    <EyeOff size={14} />
                    Oculta
                  </div>
                )}
              </div>

              {/* Detalhes e Ações da Foto */}
              <div className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  {editingPhotoId === photo.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-500 text-xs">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        className="w-16 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-white text-center focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveIndividualPrice(photo)}
                        className="p-1 bg-violet-600 text-white rounded hover:bg-violet-500"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group/price">
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(photo.price)}
                      </span>
                      <button
                        onClick={() => {
                          setEditingPhotoId(photo.id);
                          setEditingPrice((photo.price / 100).toFixed(2));
                        }}
                        className="p-1 text-zinc-500 hover:text-white rounded"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}

                  {/* Status & Deletar */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(photo)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        photo.status === "ACTIVE"
                          ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {photo.status === "ACTIVE" ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1.5 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-950 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Preço em Lote */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Preço em Lote</h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Defina o novo valor que será aplicado nas {selectedPhotos.length} fotos selecionadas.
            </p>

            <div>
              <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Preço por Foto (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={batchPrice}
                  onChange={(e) => setBatchPrice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none"
                  placeholder="10.00"
                />
              </div>
            </div>

            <button
              onClick={handleSaveBatchPrice}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              Aplicar a {selectedPhotos.length} Fotos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
