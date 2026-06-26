export interface PromotionConfig {
  promotionEnabled: boolean;
  promotionMinPhotos: number;
  promotionDiscountBps: number;
}

export interface PromotionCalculation {
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  applied: boolean;
}

export function calculatePromotionTotal(
  prices: number[],
  promotion: PromotionConfig | null | undefined
): PromotionCalculation {
  const subtotalAmount = prices.reduce((sum, price) => sum + price, 0);
  const itemCount = prices.length;
  const minPhotos = promotion?.promotionMinPhotos ?? 0;
  const discountBps = promotion?.promotionDiscountBps ?? 0;
  const applied =
    Boolean(promotion?.promotionEnabled) &&
    minPhotos > 0 &&
    discountBps > 0 &&
    itemCount >= minPhotos;
  const discountAmount = applied ? Math.round((subtotalAmount * discountBps) / 10000) : 0;

  return {
    subtotalAmount,
    discountAmount,
    totalAmount: Math.max(0, subtotalAmount - discountAmount),
    applied,
  };
}

export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

export function bpsToPercent(bps: number): number {
  return bps / 100;
}
