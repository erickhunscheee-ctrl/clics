import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

interface CreatePreferenceParams {
  orderId: string;
  orderNumber: string;
  accessToken: string;
  paymentMethod: "PIX" | "CREDIT_CARD";
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number; // In BRL (reais, not centavos)
  }>;
  payer: {
    name: string;
    email: string;
  };
}

/**
 * Create a Mercado Pago payment preference (Checkout Pro)
 */
export async function createPaymentPreference(params: CreatePreferenceParams) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const preference = new Preference(client);
  const paymentMethods =
    params.paymentMethod === "PIX"
      ? {
          default_payment_method_id: "pix",
          excluded_payment_types: [
            { id: "credit_card" },
            { id: "debit_card" },
            { id: "ticket" },
            { id: "atm" },
          ],
          installments: 1,
        }
      : {
          excluded_payment_methods: [{ id: "pix" }],
          excluded_payment_types: [
            { id: "bank_transfer" },
            { id: "debit_card" },
            { id: "ticket" },
            { id: "atm" },
          ],
          installments: 12,
        };

  const result = await preference.create({
    body: {
      items: params.items.map((item) => ({
        id: params.orderId,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: "BRL",
      })),
      payer: {
        name: params.payer.name,
        email: params.payer.email,
      },
      external_reference: params.orderId,
      payment_methods: paymentMethods,
      back_urls: {
        success: `${appUrl}/pedido/${params.accessToken}?status=success`,
        failure: `${appUrl}/pedido/${params.accessToken}?status=failure`,
        pending: `${appUrl}/pedido/${params.accessToken}?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      statement_descriptor: "FOTOS",
    },
  });

  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxInitPoint: result.sandbox_init_point,
  };
}

/**
 * Get payment details from Mercado Pago API
 */
export async function getPaymentDetails(paymentId: string) {
  const payment = new Payment(client);
  const result = await payment.get({ id: paymentId });

  return {
    id: result.id?.toString(),
    status: result.status,
    externalReference: result.external_reference,
    statusDetail: result.status_detail,
    transactionAmount: result.transaction_amount,
    dateApproved: result.date_approved,
    paymentMethodId: result.payment_method_id,
    paymentTypeId: result.payment_type_id,
  };
}

/**
 * Map Mercado Pago payment status to our OrderStatus
 */
export function mapPaymentStatus(
  mpStatus: string
): "PAID" | "PENDING" | "FAILED" | "CANCELLED" | "REFUNDED" {
  const statusMap: Record<string, "PAID" | "PENDING" | "FAILED" | "CANCELLED" | "REFUNDED"> = {
    approved: "PAID",
    pending: "PENDING",
    in_process: "PENDING",
    rejected: "FAILED",
    cancelled: "CANCELLED",
    refunded: "REFUNDED",
    charged_back: "REFUNDED",
  };

  return statusMap[mpStatus] || "PENDING";
}
