"use client";

import { User } from "lucide-react";

interface ProfileTriggerProps {
  avatarUrl?: string | null;
  name: string;
  className?: string;
  iconSize?: number;
}

export function ProfileTrigger({
  avatarUrl,
  name,
  className = "",
  iconSize = 22,
}: ProfileTriggerProps) {
  const openProfile = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("albums");
    params.delete("favorites");
    params.set("profile", "true");
    const query = params.toString();
    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <button
      type="button"
      onClick={openProfile}
      aria-label="Abrir perfil"
      data-loading-ignore="true"
      className={className}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <User size={iconSize} style={{ color: "#061337" }} />
      )}
    </button>
  );
}
