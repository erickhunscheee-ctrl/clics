"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Trash2, Eye, EyeOff, Check, Edit2, DollarSign, X, Image as ImageIcon, Star, Folder, FolderPlus } from "lucide-react";
import { formatCurrency } from "@/lib/money";

interface Photo {
  id: string;
  folderId: string | null;
  originalFileName: string;
  previewUrl: string;
  price: number;
  status: "ACTIVE" | "HIDDEN";
}

interface Album {
  id: string;
  title: string;
  coverImageUrl: string | null;
  defaultPhotoPrice: number;
  folders: AlbumFolder[];
}

interface AlbumFolder {
  id: string;
  name: string;
  _count?: {
    photos: number;
  };
}

interface AlbumCoverResponse {
  coverImageUrl: string | null;
}

interface PhotoManagementPageProps {
  params: Promise<{ id: string }>; // albumId
}

export default function PhotoManagementPage({ params }: PhotoManagementPageProps) {
  const { id: albumId } = use(params);
  const router = useRouter();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [folders, setFolders] = useState<AlbumFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [coverUpdatingPhotoId, setCoverUpdatingPhotoId] = useState<string | null>(null);

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
      setFolders(albumData.folders || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (activeFolderId && activeFolderId !== "all") {
          formData.append("folderId", activeFolderId);
        }

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
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Erro no upload das fotos.");
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao deletar foto.");
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
          folderId: photo.folderId,
        }),
      });

      if (!res.ok) throw new Error("Falha ao atualizar status.");

      const updatedPhoto = await res.json();
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updatedPhoto : p)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar status.");
    }
  };

  const handleSetCover = async (photo: Photo) => {
    setCoverUpdatingPhotoId(photo.id);
    setError(null);

    try {
      const res = await fetch(`/api/albuns/${albumId}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Falha ao definir capa.");
      }

      const updatedAlbum = (await res.json()) as AlbumCoverResponse;
      setAlbum((prev) =>
        prev ? { ...prev, coverImageUrl: updatedAlbum.coverImageUrl } : prev
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao definir capa.");
    } finally {
      setCoverUpdatingPhotoId(null);
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar preco.");
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar preco em lote.");
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;

    setCreatingFolder(true);
    setError(null);

    try {
      const res = await fetch(`/api/albuns/${albumId}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao criar pasta.");
      }

      setFolders((prev) => [...prev, data]);
      setNewFolderName("");
      setActiveFolderId(data.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar pasta.");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Excluir esta pasta? As fotos continuam no album, mas ficam sem pasta.")) return;

    try {
      const res = await fetch(`/api/albuns/${albumId}/folders/${folderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao excluir pasta.");
      }

      setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
      setPhotos((prev) =>
        prev.map((photo) => (photo.folderId === folderId ? { ...photo, folderId: null } : photo))
      );
      if (activeFolderId === folderId) setActiveFolderId("all");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir pasta.");
    }
  };

  const handleMovePhotoToFolder = async (photo: Photo, folderId: string | null) => {
    try {
      const res = await fetch(`/api/fotos/${photo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: photo.price / 100,
          status: photo.status,
          folderId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao mover foto.");
      }

      const updatedPhoto = await res.json();
      setPhotos((prev) => prev.map((item) => (item.id === photo.id ? updatedPhoto : item)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao mover foto.");
    }
  };

  const handleSelectAll = () => {
    const visiblePhotoIds = visiblePhotos.map((photo) => photo.id);

    if (visiblePhotoIds.length > 0 && visiblePhotoIds.every((photoId) => selectedPhotos.includes(photoId))) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(visiblePhotoIds);
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

  const visiblePhotos =
    activeFolderId === "all"
      ? photos
      : photos.filter((photo) => photo.folderId === activeFolderId);
  const hasUnfolderedPhotos = photos.some((photo) => photo.folderId === null);

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
          <p className="text-zinc-400 mt-1">
            Carregue novas imagens, defina os valores por foto e use a estrela para escolher a capa do album.
          </p>
        </div>

        {/* Input de Upload Oculto */}
        <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-lg shadow-violet-500/25 text-sm cursor-pointer disabled:opacity-50">
          <Upload size={18} />
          {uploading ? "Enviando..." : activeFolderId && activeFolderId !== "all" ? "Enviar para pasta" : "Enviar Fotos"}
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

      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Folder size={16} className="text-violet-400" />
              Pastas do album
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Selecione uma pasta antes de enviar fotos para organizar este album.
            </p>
          </div>

          <form onSubmit={handleCreateFolder} className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nome da pasta"
              className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={creatingFolder || newFolderName.trim().length < 2}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              <FolderPlus size={14} />
              Criar
            </button>
          </form>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setActiveFolderId("all");
              setSelectedPhotos([]);
            }}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
              activeFolderId === "all"
                ? "bg-violet-600 text-white"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
            }`}
          >
            Todas ({photos.length})
          </button>

          {folders.map((folder) => {
            const count = photos.filter((photo) => photo.folderId === folder.id).length;

            return (
              <div key={folder.id} className="group flex shrink-0 overflow-hidden rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFolderId(folder.id);
                    setSelectedPhotos([]);
                  }}
                  className={`px-3 py-2 text-xs font-bold transition ${
                    activeFolderId === folder.id
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  {folder.name} ({count})
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="border-l border-zinc-800 bg-zinc-900 px-2 text-zinc-600 transition hover:bg-red-950 hover:text-red-300"
                  title="Excluir pasta"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}

          {hasUnfolderedPhotos && (
            <button
              type="button"
              onClick={() => {
                setActiveFolderId(null);
                setSelectedPhotos([]);
              }}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
                activeFolderId === null
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
              }`}
            >
              Sem pasta ({photos.filter((photo) => photo.folderId === null).length})
            </button>
          )}
        </div>
      </div>

      {/* Barra de Ações em Lote */}
      {visiblePhotos.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={handleSelectAll}
              className="text-xs font-semibold bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-xl border border-zinc-800 hover:text-white transition-colors"
            >
              {visiblePhotos.length > 0 && visiblePhotos.every((photo) => selectedPhotos.includes(photo.id)) ? "Desmarcar Todos" : "Selecionar Todos"}
            </button>
            <span className="text-zinc-500">
              {selectedPhotos.length} de {visiblePhotos.length} fotos selecionadas nesta pasta
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
      {visiblePhotos.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/10 border border-zinc-800 rounded-3xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-zinc-800/40 flex items-center justify-center mx-auto text-zinc-500">
            <ImageIcon size={28} />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhuma foto no álbum</h3>
          <p className="text-zinc-500 max-w-sm mx-auto text-sm">
            Clique no botão acima ou arraste imagens aqui para começar a subir as fotos deste evento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visiblePhotos.map((photo) => {
              const isCover = album?.coverImageUrl === photo.previewUrl;

              return (
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
                {isCover && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-violet-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                    <Star size={11} fill="currentColor" />
                    Capa
                  </div>
                )}
                {photo.status === "HIDDEN" && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-2 text-zinc-400 font-semibold text-xs">
                    <EyeOff size={14} />
                    Oculta
                  </div>
                )}
              </div>

              {/* Detalhes e Ações da Foto */}
              <div className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <select
                  value={photo.folderId ?? ""}
                  onChange={(e) => handleMovePhotoToFolder(photo, e.target.value || null)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[11px] font-semibold text-zinc-300 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Sem pasta</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
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
                      onClick={() => handleSetCover(photo)}
                      disabled={coverUpdatingPhotoId === photo.id || isCover}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isCover
                          ? "bg-violet-500/15 border-violet-500/30 text-violet-300 cursor-default"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-yellow-300"
                      }`}
                      title={isCover ? "Foto de capa" : "Definir como capa"}
                    >
                      <Star size={14} fill={isCover ? "currentColor" : "none"} />
                    </button>
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
              );
            })}
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
