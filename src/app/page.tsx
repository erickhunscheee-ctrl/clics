import Link from "next/link";
import { Camera, UploadCloud, DollarSign, ArrowRight, ShieldCheck, Zap, Layers, Image as ImageIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              PhotoStore
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link 
              href="/cadastro" 
              className="text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-full px-5 py-2.5 border border-zinc-700/50 hover:border-zinc-600 transition-all duration-200"
            >
              Criar Conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="container mx-auto px-6 max-w-5xl text-center flex flex-col items-center gap-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wide uppercase animate-pulse">
              <Zap className="w-3.5 h-3.5" /> Entrega Automática via Google Drive
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
              Sua vitrine profissional de{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                venda de fotos
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
              Crie álbuns privados ou públicos, defina seus preços e venda fotos digitais em alta resolução. Receba via Pix e seu cliente faz o download na hora.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <Link
                href="/cadastro"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-full px-8 py-4 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/35 hover:-translate-y-0.5 transition-all duration-200"
              >
                Começar a Vender <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold rounded-full px-8 py-4 transition-all duration-200"
              >
                Acessar Painel
              </Link>
            </div>

            {/* Feature Mockup Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700/80 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Upload Rápido</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Suba centenas de fotos de uma vez. Nós criamos os previews com marca d'água automaticamente.
                </p>
              </div>

              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700/80 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Preço por Foto ou Álbum</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Defina um valor individual para cada imagem ou crie pacotes e preços promocionais para o álbum todo.
                </p>
              </div>

              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700/80 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Entrega 100% Segura</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Após aprovação do Pix via Mercado Pago, os links de download originais são gerados com expiração segura de 30 dias.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="bg-zinc-950 border-y border-zinc-900 py-20 md:py-24">
          <div className="container mx-auto px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
              Como funciona para os seus clientes?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 font-bold text-lg mb-4">
                  1
                </div>
                <h4 className="text-base font-semibold text-white mb-2">Acesso ao Link</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  O cliente acessa a galeria pública do seu evento pelo link exclusivo.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-pink-400 font-bold text-lg mb-4">
                  2
                </div>
                <h4 className="text-base font-semibold text-white mb-2">Seleção no Carrinho</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Navega pelas fotos e adiciona as preferidas ao carrinho com um clique.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 font-bold text-lg mb-4">
                  3
                </div>
                <h4 className="text-base font-semibold text-white mb-2">Pagamento Pix</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Finaliza o checkout e paga instantaneamente com Mercado Pago Checkout Pro.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 font-bold text-lg mb-4">
                  4
                </div>
                <h4 className="text-base font-semibold text-white mb-2">Download Imediato</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Acesso imediato aos downloads de alta qualidade integrados ao Google Drive.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8">
        <div className="container mx-auto px-6 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-zinc-400" />
            <span>&copy; {new Date().getFullYear()} PhotoStore. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-300 transition-colors">Termos de Uso</Link>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
