"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Trash2, Plus, X } from "lucide-react";
import Image from "next/image";
import { SendNotificationDialog } from "./send-notification-dialog";

interface Notification {
  id: string;
  subject: string;
  description: string;
  imageUrl: string | null;
  createdAt: string;
}

const STORAGE_KEY = "clics_notifications_last_read";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSendForm, setShowSendForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data: Notification[] = await res.json();
      setNotifications(data);

      // Calcular não lidas com base na última vez que abriu
      const lastRead = localStorage.getItem(STORAGE_KEY);
      const lastReadDate = lastRead ? new Date(lastRead) : new Date(0);
      const unread = data.filter(
        (n) => new Date(n.createdAt) > lastReadDate
      ).length;
      setUnreadCount(unread);
    } catch {
      // silenciar erro
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar ao montar
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSendForm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) {
      // Marcar como lidas ao abrir
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setUnreadCount(0);
      setShowSendForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSent = () => {
    setShowSendForm(false);
    fetchNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão sino */}
      <button
        id="notifications-bell-btn"
        onClick={handleOpen}
        data-loading-ignore="true"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#159BEF]/40 hover:bg-white/10 hover:text-white"
        aria-label="Notificações"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-2xl border border-white/10 bg-[#061337]/95 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          style={{ minHeight: "120px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#159BEF]" />
              <span className="text-xs font-bold text-white">Notificações</span>
              {notifications.length > 0 && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/50">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSendForm((v) => !v)}
                data-loading-ignore="true"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-[#159BEF]"
                title="Nova notificação"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => { setOpen(false); setShowSendForm(false); }}
                data-loading-ignore="true"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-y-auto px-3 py-2 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#159BEF] border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                  <Bell size={18} className="text-white/20" />
                </div>
                <p className="text-xs text-white/30">Nenhuma notificação</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-white/5"
                  >
                    {/* Imagem ou ícone */}
                    <div className="mt-0.5 flex-shrink-0">
                      {n.imageUrl ? (
                        <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-white/10">
                          <Image
                            src={n.imageUrl}
                            alt={n.subject}
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#159BEF22,#7B3FF222)] border border-[#159BEF]/20">
                          <Bell size={14} className="text-[#159BEF]" />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">
                        {n.subject}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-white/50">
                        {n.description}
                      </p>
                      <p className="mt-1 text-[10px] text-white/25">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    {/* Botão delete */}
                    <button
                      onClick={() => handleDelete(n.id)}
                      data-loading-ignore="true"
                      disabled={deletingId === n.id}
                      className="mt-0.5 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-white/30 hover:text-red-400 disabled:opacity-30"
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Form de envio */}
          {showSendForm && (
            <div className="border-t border-white/10 px-4 pb-4 pt-3">
              <SendNotificationDialog
                onSent={handleSent}
                onClose={() => setShowSendForm(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
