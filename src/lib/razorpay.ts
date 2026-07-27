/**
 * Lazy loader + types for Razorpay Checkout. The script is injected on demand so
 * it costs nothing until a buyer actually pays. No npm dependency.
 */

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccess) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loading: Promise<void> | null = null;

export const loadRazorpay = (): Promise<void> => {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('Failed to load the payment SDK. Check your connection and retry.'));
    };
    document.body.appendChild(script);
  });
  return loading;
};
