"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/money";

type Video = { id: string; originalFileName: string; previewUrl: string; price: number; status: "ACTIVE" | "HIDDEN" };
type Album = { id: string; title: string; defaultVideoPrice: number; videos: Video[] };

export default function VideosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [album, setAlbum] = useState<Album | null>(null);
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  useEffect(() => {
    fetch(`/api/albuns/${id}`).then((response) => response.json()).then((data) => {
      if (!Array.isArray(data.videos)) throw new Error(data.message || "Não foi possível carregar os vídeos.");
      setAlbum(data);
      setPrice((data.defaultVideoPrice / 100).toFixed(2));
    }).catch((cause) => setError(cause.message));
  }, [id]);

  async function upload(file: File) {
    setBusy(true); setError(""); setProgress("Preparando upload...");
    try {
      const init = await fetch("/api/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ albumId: id, fileName: file.name, contentType: file.type, fileSize: file.size }) });
      const data = await init.json();
      if (!init.ok) throw new Error(data.message);
      setProgress("Enviando vídeo original...");
      const sent = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!sent.ok) throw new Error("Falha no envio ao armazenamento. Confira a configuração CORS do R2.");
      setProgress("Aplicando marca d'água à prévia...");
      const result = await fetch("/api/videos/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ albumId: id, key: data.key, fileName: file.name, contentType: file.type }) });
      const video = await result.json();
      if (!result.ok) throw new Error(video.message);
      setAlbum((current) => current ? { ...current, videos: [video, ...current.videos] } : current);
      setProgress("Vídeo pronto.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha no upload."); }
    finally { setBusy(false); }
  }

  async function saveDefaultPrice() {
    setError("");
    const response = await fetch(`/api/albuns/${id}/video-price`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: Number(price) }) });
    const data = await response.json();
    if (!response.ok) setError(data.message);
    else setAlbum((current) => current ? { ...current, defaultVideoPrice: data.defaultVideoPrice } : current);
  }

  async function update(video: Video, next: Partial<Video>) {
    const response = await fetch(`/api/videos/${video.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: (next.price ?? video.price) / 100, status: next.status ?? video.status }) });
    const data = await response.json();
    if (!response.ok) setError(data.message);
    else setAlbum((current) => current ? { ...current, videos: current.videos.map((item) => item.id === video.id ? data : item) } : current);
  }

  async function remove(video: Video) {
    if (!confirm(`Excluir ${video.originalFileName}?`)) return;
    const response = await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) setError(data.message);
    else setAlbum((current) => current ? { ...current, videos: current.videos.filter((item) => item.id !== video.id) } : current);
  }

  return <div className="space-y-6 text-white">
    <Link href={`/dashboard/albuns/${id}`} className="text-sm text-zinc-400 hover:text-white">← Voltar ao álbum</Link>
    <div><h1 className="text-3xl font-bold">Vídeos · {album?.title}</h1><p className="mt-2 text-sm text-zinc-400">A prévia pública recebe marca d&apos;água e mostra os primeiros 20 segundos. O comprador recebe o original após o pagamento.</p></div>
    {error && <p role="alert" className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-red-200">{error}</p>}
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <h2 className="font-bold">Preço padrão por vídeo</h2>
      <div className="flex flex-wrap gap-3"><label className="flex items-center gap-2">R$ <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 p-2" /></label><button onClick={saveDefaultPrice} className="rounded-lg bg-violet-600 px-4 py-2 font-semibold">Salvar preço</button></div>
      <p className="text-xs text-zinc-400">Aplicado aos novos vídeos. Cada vídeo pode ter seu próprio valor.</p>
    </section>
    <label className="inline-flex cursor-pointer rounded-xl bg-violet-600 px-5 py-3 font-semibold">{busy ? progress : "Enviar vídeo"}<input type="file" accept="video/mp4,video/quicktime,video/webm" disabled={busy} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} /></label>
    {progress && !busy && <p className="text-sm text-zinc-400">{progress}</p>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{album?.videos.map((video) => <article key={video.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"><video src={video.previewUrl} controls preload="metadata" className="aspect-video w-full bg-black" /><div className="space-y-3 p-4"><p className="truncate font-semibold" title={video.originalFileName}>{video.originalFileName}</p><p className="text-xs text-zinc-400">Prévia com marca d&apos;água · {formatCurrency(video.price)}</p><label className="block text-xs">Preço (R$)<input type="number" min="0" step="0.01" defaultValue={(video.price / 100).toFixed(2)} onBlur={(event) => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0) void update(video, { price: Math.round(value * 100) }); }} className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm" /></label><div className="flex gap-3 text-sm"><button onClick={() => void update(video, { status: video.status === "ACTIVE" ? "HIDDEN" : "ACTIVE" })} className="rounded-lg border border-zinc-700 px-3 py-2">{video.status === "ACTIVE" ? "Ocultar" : "Mostrar"}</button><button onClick={() => void remove(video)} className="rounded-lg border border-red-900 px-3 py-2 text-red-300">Excluir</button></div></div></article>)}</div>
  </div>;
}
