import Link from "next/link";
import { ArrowUpRight, Calendar, ImageIcon, MapPin } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { formatCurrency } from "@/lib/money";

interface AlbumCardProps {
  album: {
    id: string; slug: string; title: string; coverImageUrl: string | null;
    defaultPhotoPrice: number; eventDate: Date | null; location: string | null;
    photographer: { name: string }; _count: { photos: number };
  };
  featured?: boolean;
}

export function AlbumCard({ album, featured }: AlbumCardProps) {
  return (
    <article className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg hover:shadow-slate-200/50 ${featured ? "sm:col-span-2 lg:col-span-2" : ""}`}>
      <Link href={`/album/${album.slug}`} aria-label={`Ver fotos de ${album.title}`} className="absolute inset-0 z-10 rounded-2xl" />
      <div className={`relative overflow-hidden bg-slate-100 ${featured ? "aspect-[3/2] sm:aspect-[2/1] lg:aspect-[16/7]" : "aspect-[3/2]"}`}>
        {album.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.coverImageUrl} alt={album.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]" />
        ) : <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon size={36} strokeWidth={1} /></div>}
        {featured && <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-900">Em destaque</span>}
        <div className="absolute right-3 top-3 z-20" data-loading-ignore="true">
          <FavoriteButton type="album" album={album} className="min-h-11 min-w-11 bg-white/95 text-slate-800 hover:bg-white" size={19} />
        </div>
        <span className="absolute bottom-3 left-3 rounded-md bg-black/65 px-2.5 py-1 text-xs font-medium text-white">{album._count.photos} fotos</span>
      </div>
      <div className={`space-y-3 p-4 ${featured ? "sm:p-6" : "sm:p-5"}`}>
        <div className="flex items-start justify-between gap-3"><h3 className={`line-clamp-2 font-semibold text-slate-950 ${featured ? "text-lg sm:text-2xl" : "text-base"}`}>{album.title}</h3><ArrowUpRight size={18} className="mt-0.5 shrink-0 text-slate-400" /></div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
          {album.eventDate && <span className="flex items-center gap-1.5"><Calendar size={13} />{new Date(album.eventDate).toLocaleDateString("pt-BR")}</span>}
          {album.location && <span className="flex min-w-0 items-center gap-1.5"><MapPin size={13} className="shrink-0" /><span className="truncate">{album.location}</span></span>}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs"><span className="truncate text-slate-500">{album.photographer.name}</span><span className="shrink-0 text-slate-600">A partir de <strong className="font-semibold text-slate-900">{formatCurrency(album.defaultPhotoPrice)}</strong></span></div>
      </div>
    </article>
  );
}
