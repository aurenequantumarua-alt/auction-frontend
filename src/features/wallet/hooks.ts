import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi, type UpsertBankAccountInput } from './api';

export const walletKeys = {
  balance: ['wallet', 'balance'] as const,
  transactions: (page: number, pageSize: number) =>
    ['wallet', 'transactions', page, pageSize] as const,
  bankAccount: ['wallet', 'bank-account'] as const,
  withdrawals: ['wallet', 'withdrawals'] as const,
};

export const useWallet = (enabled = true) =>
  useQuery({
    queryKey: walletKeys.balance,
    queryFn: () => walletApi.balance(),
    enabled,
  });

export const useWalletTransactions = (page = 1, pageSize = 20) =>
  useQuery({
    queryKey: walletKeys.transactions(page, pageSize),
    queryFn: () => walletApi.transactions({ page, pageSize }),
    placeholderData: (prev) => prev,
  });

export const useBankAccount = (enabled = true) =>
  useQuery({
    queryKey: walletKeys.bankAccount,
    queryFn: () => walletApi.getBankAccount(),
    enabled,
  });

export const useUpsertBankAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertBankAccountInput) => walletApi.upsertBankAccount(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.bankAccount });
    },
  });
};

export const useWithdrawals = () =>
  useQuery({
    queryKey: walletKeys.withdrawals,
    queryFn: () => walletApi.withdrawals(),
  });

export const useRequestWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: string) => walletApi.requestWithdrawal(amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.balance });
      qc.invalidateQueries({ queryKey: walletKeys.withdrawals });
      qc.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
  });
};

export const useDepositCheckout = () => {
  return useMutation({
    mutationFn: (amount: string) => walletApi.depositCheckout(amount),
  });
};

export const useDepositVerify = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      amount: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => walletApi.depositVerify(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.balance });
      qc.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
  });
};
