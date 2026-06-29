"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, Loader2, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function getSafeNextPath() {
  if (typeof window === "undefined") return "/";

  const nextPath = new URLSearchParams(window.location.search).get("next");
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.refresh();
    router.replace(getSafeNextPath());
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const callbackParams = new URLSearchParams({ next: getSafeNextPath() });
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?${callbackParams.toString()}`,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setGoogleLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-[#F6F8FC] px-4 py-3 text-sm text-[#061337] placeholder:text-slate-400 transition-colors focus:border-[#159BEF] focus:outline-none focus:ring-4 focus:ring-[#159BEF]/10 md:py-3.5";

  return (
    <main
      className="relative flex h-dvh items-center justify-center overflow-hidden px-3 py-3 text-[#061337] sm:px-4 md:p-4"
      style={{ background: "#F6F8FC", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
    >
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#159BEF]/15 blur-3xl" />
      <div className="absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-[#7B3FF2]/15 blur-3xl" />

      <section
        className="relative z-10 grid max-h-[calc(100dvh-1.5rem)] min-w-0 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_80px_rgba(6,19,55,0.10)] ring-1 ring-white md:h-[min(620px,calc(100dvh-2rem))] md:grid-cols-2 md:rounded-[2rem]"
        style={{ width: "min(64rem, calc(100vw - 2rem))" }}
      >
        <div className="relative hidden min-h-0 flex-col justify-between overflow-hidden bg-[#061337] p-8 text-white md:flex lg:p-10">
          <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#159BEF]/30 blur-3xl" />
          <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#7B3FF2]/30 blur-3xl" />
          <div className="relative">
            <Image
              src="/icone_clics.png"
              alt="CLICS"
              width={96}
              height={96}
              className="h-20 w-20 object-contain drop-shadow-[0_16px_40px_rgba(21,155,239,0.35)] lg:h-24 lg:w-24"
              priority
            />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.32em] text-white/55 lg:mt-8">
              Marketplace de fotos
            </p>
            <h1
              className="mt-3 max-w-sm text-3xl font-black leading-tight lg:mt-4 lg:text-4xl"
              style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
            >
              Acesse seus álbuns, pedidos e vendas em um só lugar.
            </h1>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md lg:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#7B3FF2]">
                <Camera size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">CLICS</p>
                <p className="text-xs text-white/60">
                  Compre, venda e baixe fotos com segurança.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col p-5 sm:p-6 md:p-8 lg:p-10">
          <Link
            href="/"
            aria-label="Voltar"
            className="mb-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#061337] shadow-[0_2px_12px_rgba(6,19,55,0.06)] transition hover:-translate-y-0.5 hover:border-[#159BEF]/40 hover:text-[#159BEF] md:mb-5 md:h-9 md:w-9"
          >
            <ArrowLeft size={17} />
          </Link>

          <div className="mb-5 text-center md:hidden">
            <Image
              src="/icone_clics.png"
              alt="CLICS"
              width={96}
              height={96}
              className="mx-auto h-16 w-16 object-contain drop-shadow-[0_16px_40px_rgba(21,155,239,0.25)] sm:h-20 sm:w-20"
              priority
            />
          </div>

          <div className="mb-5 md:mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B3FF2]">
              Bem-vindo de volta
            </p>
            <h2
              className="mt-2 text-2xl font-black tracking-tight text-[#061337] md:mt-3 md:text-3xl"
              style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
            >
              Entrar na CLICS
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 md:mt-2">
              Entre na sua conta para acessar pedidos, downloads ou gerenciar seus álbuns.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 md:mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="max-w-[65%] whitespace-normal text-right text-xs font-bold leading-tight text-[#7B3FF2] underline decoration-[#7B3FF2]/30 underline-offset-4 transition hover:text-[#159BEF]"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_16px_36px_rgba(21,155,239,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 md:py-3.5"
              style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar com e-mail <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-4 text-center md:my-6 lg:my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Ou continue com
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#061337] shadow-[0_2px_16px_rgba(6,19,55,0.05)] transition hover:bg-[#F6F8FC] disabled:cursor-not-allowed disabled:opacity-60 md:py-3.5"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin text-[#159BEF]" size={18} />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? "Redirecionando..." : "Entrar com Google"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500 md:mt-6 lg:mt-7">
            Não tem uma conta?{" "}
            <Link
              href="/cadastro"
              className="font-bold text-[#7B3FF2] underline decoration-[#7B3FF2]/30 underline-offset-4 hover:text-[#159BEF]"
            >
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
