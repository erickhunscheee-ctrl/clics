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

export interface ProcessPaymentParams {
  orderId: string;
  orderNumber: string;
  paymentMethod: "PIX" | "CREDIT_CARD";
  transactionAmount: number; // Em reais (ex: 45.90)
  payer: {
    name: string;
    email: string;
    phone: string;
    document?: string | null;
  };
  // Campos específicos de cartão de crédito
  cardToken?: string | null;
  installments?: number | null;
  paymentMethodId?: string | null;
  issuerId?: number | null;
}

type TransparentPaymentData = {
  transaction_amount: number;
  description: string;
  external_reference: string;
  notification_url: string;
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    phone: {
      area_code: string;
      number: string;
    };
    identification?: {
      type: "CPF" | "CNPJ";
      number: string;
    };
  };
  payment_method_id?: string;
  token?: string;
  installments?: number;
  issuer_id?: number;
};

/**
 * Process a transparent payment (PIX or CREDIT_CARD) using Mercado Pago SDK
 */
export async function processTransparentPayment(params: ProcessPaymentParams) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const payment = new Payment(client);

  // Divide o nome em first_name e last_name
  const nameParts = params.payer.name.trim().split(/\s+/);
  const firstName = nameParts[0] || "Cliente";
  const lastName = nameParts.slice(1).join(" ") || "Fotos";

  // Formata telefone (separa DDD e número se possível, senão manda padrão)
  const cleanPhone = params.payer.phone.replace(/\D/g, "");
  const areaCode = cleanPhone.substring(0, 2) || "11";
  const number = cleanPhone.substring(2) || cleanPhone || "999999999";

  const paymentData: TransparentPaymentData = {
    transaction_amount: params.transactionAmount,
    description: `Pedido #${params.orderNumber} - Fotos`,
    external_reference: params.orderId,
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
    payer: {
      email: params.payer.email,
      first_name: firstName,
      last_name: lastName,
      phone: {
        area_code: areaCode,
        number: number,
      },
    },
  };

  // Se tiver CPF informado, envia
  if (params.payer.document) {
    const cleanDoc = params.payer.document.replace(/\D/g, "");
    if (cleanDoc.length === 11) {
      paymentData.payer.identification = {
        type: "CPF",
        number: cleanDoc,
      };
    } else if (cleanDoc.length === 14) {
      paymentData.payer.identification = {
        type: "CNPJ",
        number: cleanDoc,
      };
    }
  }

  if (params.paymentMethod === "PIX") {
    paymentData.payment_method_id = "pix";
  } else {
    // Cartão de crédito
    if (!params.cardToken) {
      throw new Error("Token do cartão é obrigatório para pagamentos com cartão de crédito.");
    }
    if (!params.paymentMethodId) {
      throw new Error("Bandeira do cartao e obrigatoria para pagamentos com cartao de credito.");
    }
    paymentData.token = params.cardToken;
    paymentData.installments = params.installments || 1;
    paymentData.payment_method_id = params.paymentMethodId;
    if (params.issuerId) {
      paymentData.issuer_id = params.issuerId;
    }
  }

  const result = await payment.create({
    body: paymentData,
    requestOptions: {
      idempotencyKey: params.orderId,
    },
  });

  // Detalhes do Pix
  let pixCopiaECola = null;
  let pixQrCodeBase64 = null;
  if (params.paymentMethod === "PIX" && result.point_of_interaction?.transaction_data) {
    pixCopiaECola = result.point_of_interaction.transaction_data.qr_code;
    pixQrCodeBase64 = result.point_of_interaction.transaction_data.qr_code_base64;
  }

  return {
    id: result.id?.toString(),
    status: result.status,
    statusDetail: result.status_detail,
    pixCopiaECola,
    pixQrCodeBase64,
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
