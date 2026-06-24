import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Suspense } from "react";
import { CartProvider } from "@/components/cart/cart-provider";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { FavoritesBottomSheet } from "@/components/favorites/favorites-bottom-sheet";
import { ProfileBottomSheet } from "@/components/profile/profile-bottom-sheet";
import { AlbumsBottomSheet } from "@/components/albums/albums-bottom-sheet";
import { LoadingProvider } from "@/components/ui/loading-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "CLICS — Marketplace de Fotos",
  description: "Transforme seus clics em vendas. Compre e venda fotos profissionais em alta resolução.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F6F8FC] text-[#061337]">
        <LoadingProvider>
          <FavoritesProvider>
            <CartProvider>
              {children}
              <Suspense fallback={null}>
                <FavoritesBottomSheet />
              </Suspense>
              <Suspense fallback={null}>
                <ProfileBottomSheet />
              </Suspense>
              <Suspense fallback={null}>
                <AlbumsBottomSheet />
              </Suspense>
            </CartProvider>
          </FavoritesProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
