"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const nextParams = new URLSearchParams({ next: "/redefinir-senha" });
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?${nextParams.toString()}`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-[#F6F8FC] px-4 py-3.5 text-sm text-[#061337] placeholder:text-slate-400 transition-colors focus:border-[#159BEF] focus:outline-none focus:ring-4 focus:ring-[#159BEF]/10";

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-[#061337]"
      style={{ background: "#F6F8FC", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
    >
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#159BEF]/15 blur-3xl" />
      <div className="absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-[#7B3FF2]/15 blur-3xl" />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_24px_80px_rgba(6,19,55,0.10)] ring-1 ring-white sm:p-8 md:p-10">
        <Link
          href="/login"
          aria-label="Voltar para o login"
          className="mb-7 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[#061337] shadow-[0_2px_12px_rgba(6,19,55,0.06)] transition hover:-translate-y-0.5 hover:border-[#159BEF]/40 hover:text-[#159BEF]"
        >
          <ArrowLeft size={17} />
        </Link>

        <div className="mb-8 text-center">
          <Image
            src="/icone_clics.png"
            alt="CLICS"
            width={88}
            height={88}
            className="mx-auto h-20 w-20 object-contain drop-shadow-[0_16px_40px_rgba(21,155,239,0.22)]"
            priority
          />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-[#7B3FF2]">
            Recuperar acesso
          </p>
          <h1
            className="mt-3 text-3xl font-black tracking-tight text-[#061337]"
            style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
          >
            Esqueceu a senha?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Informe seu e-mail e enviaremos um link seguro para criar uma nova senha.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Se este e-mail estiver cadastrado, voce recebera as instrucoes de recuperacao em instantes.
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-[0_16px_36px_rgba(21,155,239,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={17} />
                Enviando...
              </>
            ) : (
              <>
                Enviar link <Send size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-xs text-slate-500">
          Lembrou sua senha?{" "}
          <Link
            href="/login"
            className="font-bold text-[#7B3FF2] underline decoration-[#7B3FF2]/30 underline-offset-4 hover:text-[#159BEF]"
          >
            Fazer login
          </Link>
        </p>
      </section>
    </main>
  );
}
