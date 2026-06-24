import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const albums = await prisma.album.findMany({
      where: {
        status: "PUBLISHED",
        OR: search
          ? [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
              {
                photographer: {
                  name: { contains: search, mode: "insensitive" },
                },
              },
            ]
          : undefined,
      },
      include: {
        photographer: { select: { name: true, avatarUrl: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { eventDate: "desc" },
      take: limit,
    });

    return NextResponse.json({ albums });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      { error: "Erro ao carregar álbuns" },
      { status: 500 }
    );
  }
}
