import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PhotoGallery } from "@/components/public-album/photo-gallery";

interface PublicAlbumPageProps {
  params: Promise<{ slug: string }>;
}

// Configuração dinâmica de SEO para os metadados do álbum
export async function generateMetadata({
  params,
}: PublicAlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const album = await prisma.album.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, description: true },
  });

  if (!album) {
    return {
      title: "Álbum não encontrado",
    };
  }

  return {
    title: `${album.title} | Galeria de Fotos`,
    description: album.description || "Veja e adquira as fotos deste evento online.",
  };
}

export default async function PublicAlbumPage({ params }: PublicAlbumPageProps) {
  const { slug } = await params;

  // Busca o álbum publicado, suas fotos e os dados do fotógrafo
  const album = await prisma.album.findUnique({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      photos: {
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          folderId: true,
          originalFileName: true,
          previewUrl: true,
          price: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      folders: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      },
      photographer: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!album) {
    notFound();
  }

  return <PhotoGallery album={album} photos={album.photos} />;
}
