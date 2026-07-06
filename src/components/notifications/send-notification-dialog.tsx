"use client";

import { useState } from "react";
import { Send, X, Image as ImageIcon } from "lucide-react";

interface SendNotificationDialogProps {
  onSent: () => void;
  onClose: () => void;
}

export function SendNotificationDialog({
  onSent,
  onClose,
}: SendNotificationDialogProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao enviar.");
      }

      setSubject("");
      setDescription("");
      setImageUrl("");
      onSent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-white/10 pt-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[#159BEF] uppercase tracking-widest">
          Nova Notificação
        </p>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/70 transition-colors"
          data-loading-ignore="true"
        >
          <X size={14} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          placeholder="Assunto *"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={100}
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#159BEF]/50 focus:ring-0 transition-colors"
        />
        <textarea
          placeholder="Descrição *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          required
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#159BEF]/50 transition-colors"
        />
        <div className="relative">
          <ImageIcon
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="url"
            placeholder="URL da imagem (opcional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-white/30 outline-none focus:border-[#159BEF]/50 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !subject.trim() || !description.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#159BEF,#7B3FF2)] py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send size={12} />
          {loading ? "Enviando…" : "Enviar Notificação"}
        </button>
      </form>
    </div>
  );
}
