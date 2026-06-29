"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
    setPassword("");
    setConfirmPassword("");
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
            Nova senha
          </p>
          <h1
            className="mt-3 text-3xl font-black tracking-tight text-[#061337]"
            style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
          >
            Redefinir senha
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Crie uma senha nova para voltar a acessar sua conta com seguranca.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Senha atualizada com sucesso.
            </div>
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-[0_16px_36px_rgba(21,155,239,0.24)] transition hover:-translate-y-0.5"
              style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Nova senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
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
                  Salvando...
                </>
              ) : (
                "Salvar nova senha"
              )}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
