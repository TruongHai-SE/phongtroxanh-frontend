import { api } from "@/lib/api";
import type {
  PackagePlan,
  CreatePaymentRequest,
  CreatePaymentResponse,
  TransactionResponse,
  ConsumableBalanceResponse,
  VnPayReturnResponse,
  ActiveSubscription,
  PlanFeatures,
} from "../types/payment.types";

export const parseFeatures = (plan: PackagePlan): PlanFeatures => {
  let f: any = plan.features;
  if (typeof f === "string") {
    try { f = JSON.parse(f); } catch { f = {}; }
  }
  return { swipes_per_day: Number(f?.swipes_per_day) || 0, boosts: Number(f?.boosts) || 0 };
};

export const paymentApi = {
  // #73 GET /api/v1/monetization/plans
  getPlans: (): Promise<PackagePlan[]> => {
    return api.get<PackagePlan[]>("/monetization/plans");
  },

  // #74 POST /api/v1/monetization/create-payment
  createPayment: (body: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    return api.post<CreatePaymentResponse>("/monetization/create-payment", body);
  },

  // #75 GET /api/v1/monetization/vnpay-ipn
  processVnPayIpn: (params: Record<string, string>): Promise<Record<string, string>> => {
    return api.get<Record<string, string>>("/monetization/vnpay-ipn", params);
  },

  // #76 GET /api/v1/monetization/payos-return (hoặc /vnpay-return)
  verifyPaymentReturn: (params: Record<string, string>): Promise<VnPayReturnResponse> => {
    return api.get<VnPayReturnResponse>("/monetization/payos-return", params);
  },
  verifyVnPayReturn: (params: Record<string, string>): Promise<VnPayReturnResponse> => {
    return api.get<VnPayReturnResponse>("/monetization/payos-return", params);
  },

  // #77 GET /api/v1/monetization/transactions/me
  getMyTransactions: (): Promise<TransactionResponse[]> => {
    return api.get<TransactionResponse[]>("/monetization/transactions/me");
  },

  // #78 GET /api/v1/monetization/consumables/me
  getMyConsumables: (): Promise<ConsumableBalanceResponse> => {
    return api.get<ConsumableBalanceResponse>("/monetization/consumables/me");
  },

  getMySubscriptions: (): Promise<ActiveSubscription[]> => {
    return api.get<ActiveSubscription[]>("/monetization/subscriptions/me");
  },

  /** Creates a PayOS payment and redirects the browser to the PayOS checkout page. */
  checkout: async (packageId: string): Promise<void> => {
    const res = await api.post<CreatePaymentResponse>("/monetization/create-payment", {
      packageId,
      paymentMethod: "PAYOS",
      returnUrl: `${window.location.origin}/payment/callback`,
    });
    if (!res?.paymentUrl) throw new Error("Không tạo được liên kết thanh toán");
    window.location.href = res.paymentUrl;
  },

  // Backward compatibility alias methods
  createPaymentUrl: (body: any): Promise<CreatePaymentResponse> => {
    return api.post<CreatePaymentResponse>("/monetization/create-payment", {
      packageId: body.packageId || body.packageType,
      paymentMethod: body.paymentMethod || "PAYOS",
      returnUrl: body.returnUrl,
    });
  },
  getPaymentHistory: (): Promise<TransactionResponse[]> => {
    return api.get<TransactionResponse[]>("/monetization/transactions/me");
  },
  getConsumableBalance: (): Promise<ConsumableBalanceResponse> => {
    return api.get<ConsumableBalanceResponse>("/monetization/consumables/me");
  },

  // Admin Plan Management
  adminCreatePlan: (data: any): Promise<PackagePlan> => {
    return api.post<PackagePlan>("/monetization/admin/plans", data);
  },
  adminUpdatePlan: (id: string, data: any): Promise<PackagePlan> => {
    return api.put<PackagePlan>(`/monetization/admin/plans/${id}`, data);
  },
  adminDeletePlan: (id: string): Promise<void> => {
    return api.delete<void>(`/monetization/admin/plans/${id}`);
  },
};


