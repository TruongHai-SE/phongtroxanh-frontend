export interface PackagePlan {
  id: string;
  targetRole: "LANDLORD" | "TENANT" | string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string | any;
}

export interface PlanFeatures {
  swipes_per_day: number;
  boosts: number;
}

export interface ActiveSubscription {
  planId: string;
  planName: string;
  endDate: string;
}

export interface CreatePaymentRequest {
  packageId: string;
  paymentMethod: "VNPAY" | "MOMO" | "BANK_TRANSFER" | string;
  returnUrl?: string;
}

export interface CreatePaymentResponse {
  transactionCode: string;
  paymentMethod: string;
  amount: number;
  paymentUrl: string;
}

export interface TransactionResponse {
  id: string;
  transactionCode: string;
  packageId: string;
  amount: number;
  paymentMethod: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | string;
  vnpTransactionNo?: string;
  createdAt: string;
}

export interface ConsumableBalanceResponse {
  swipesLeft: number;
  boostsLeft: number;
  superMatchesLeft: number;
  boostCount?: number;
  priorityMatchingCount?: number;
  items?: ConsumableItem[];
}

export interface ConsumableItem {
  type: string;
  name: string;
  remaining: number;
  unit: string;
}

export interface VnPayReturnResponse {
  transactionCode: string;
  status: "SUCCESS" | "FAILED" | string;
}

export interface VNPayCallbackParams {
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode?: string;
  vnp_TmnCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_TxnRef?: string;
  vnp_SecureHash?: string;
  [key: string]: string | undefined;
}

// Legacy UI compatibility aliases
export type CreatePaymentUrlRequest = CreatePaymentRequest & {
  packageType?: string;
  amount?: number;
  orderInfo?: string;
};
export type PaymentUrlResponse = CreatePaymentResponse;
export type PaymentTransactionResponse = TransactionResponse;
export type PaymentCallbackResultResponse = VnPayReturnResponse & {
  success?: boolean;
  message?: string;
  orderId?: string;
  amount?: number;
};

