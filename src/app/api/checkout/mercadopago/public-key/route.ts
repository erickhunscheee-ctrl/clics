import { NextResponse } from "next/server";

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
    process.env.MERCADO_PAGO_PUBLIC_KEY ||
    process.env.mercado_pago_public_key ||
    process.env.MP_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { message: "Chave publica do Mercado Pago nao configurada." },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey });
}
