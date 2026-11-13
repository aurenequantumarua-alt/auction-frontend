import { api } from '@/lib/api';

export interface WalletBalance {
  balance: string;
  currency: 'INR';
}

export type WalletTransactionType =
  | 'SALE_CREDIT'
  | 'WITHDRAWAL_DEBIT'
  | 'REFUND_CREDIT'
  | 'ADJUSTMENT'
  | 'DEPOSIT_CREDIT'
  | 'PLATFORM_PROFIT_CREDIT';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
}

export interface WalletTransactionsPage {
  items: WalletTransaction[];
  page: number;
  pageSize: number;
  total: number;
}

export interface IfscInfo {
  ifsc: string;
  bank: string;
  branch: string;
  city: string;
  state: string;
  upi: boolean;
}

export type WithdrawalStatus = 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Withdrawal {
  id: string;
  amount: string;
  status: WithdrawalStatus;
  provider?: string;
  externalRef?: string | null;
  failureReason?: string | null;
  bankLast4: string;
  requestedAt: string;
  completedAt: string | null;
}

export type BankAccount =
  | {
      type: 'BANK';
      accountHolderName: string;
      last4: string;
      ifsc: string;
      bankName: string | null;
      status: 'PENDING' | 'VERIFIED';
    }
  | {
      type: 'UPI';
      accountHolderName: string;
      upiId: string;
      status: 'PENDING' | 'VERIFIED';
    };

export type UpsertBankAccountInput =
  | {
      type: 'BANK';
      accountHolderName: string;
      accountNumber: string;
      ifsc: string;
      bankName?: string;
    }
  | {
      type: 'UPI';
      accountHolderName: string;
      upiId: string;
    };

export type DepositCheckoutResponse =
  | { provider: 'mock'; message?: string; amountDue: string }
  | {
      provider: 'razorpay';
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      name: string;
      description?: string;
    };

export const walletApi = {
  balance: async (): Promise<WalletBalance> => {
    const { data } = await api.get<WalletBalance>('/wallet');
    return data;
  },

  transactions: async (params: {
    page?: number;
    pageSize?: number;
  }): Promise<WalletTransactionsPage> => {
    const { data } = await api.get<WalletTransactionsPage>('/wallet/transactions', {
      params,
    });
    return data;
  },

  getBankAccount: async (): Promise<{ bankAccount: BankAccount | null }> => {
    const { data } = await api.get<{ bankAccount: BankAccount | null }>('/bank-account');
    return data;
  },

  lookupIfsc: async (ifsc: string): Promise<IfscInfo | null> => {
    try {
      const { data } = await api.get<{ ifsc: IfscInfo }>(`/bank-account/ifsc/${ifsc}`);
      return data.ifsc;
    } catch {
      return null;
    }
  },

  upsertBankAccount: async (
    input: UpsertBankAccountInput,
  ): Promise<{ bankAccount: BankAccount }> => {
    const { data } = await api.put<{ bankAccount: BankAccount }>('/bank-account', input);
    return data;
  },

  requestWithdrawal: async (amount: string): Promise<{ withdrawal: Withdrawal }> => {
    const { data } = await api.post<{ withdrawal: Withdrawal }>('/withdrawals', { amount });
    return data;
  },

  withdrawals: async (): Promise<{ items: Withdrawal[] }> => {
    const { data } = await api.get<{ items: Withdrawal[] }>('/withdrawals');
    return data;
  },

  depositCheckout: async (amount: string): Promise<DepositCheckoutResponse> => {
    const { data } = await api.post<DepositCheckoutResponse>('/wallet/deposit/checkout', { amount });
    return data;
  },

  depositVerify: async (input: {
    amount: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>('/wallet/deposit/verify', input);
    return data;
  },
};
