/**
 * Format centavos to BRL currency string
 * e.g., 1500 => "R$ 15,00"
 */
export function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

/**
 * Convert reais (decimal) to centavos (integer)
 * e.g., 15.50 => 1550
 */
export function toCentavos(reais: number): number {
  return Math.round(reais * 100);
}

/**
 * Convert centavos (integer) to reais (decimal)
 * e.g., 1550 => 15.50
 */
export function toReais(centavos: number): number {
  return centavos / 100;
}

/**
 * Calculate total from an array of prices in centavos
 */
export function calculateTotal(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0);
}
