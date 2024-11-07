import { CookieOptions } from '@supabase/ssr';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

export interface ApiContext {
  cookies: {
    get(name: string): string | undefined;
    set(name: string, value: string, options: CookieOptions): void;
    remove(name: string, options: CookieOptions): void;
  };
}

export interface StripeWebhookPayload {
  type: string;
  data: {
    object: any;
  };
}

export interface CheckoutSessionPayload {
  priceId: string;
  userId: string;
}

export interface PortalSessionPayload {
  userId: string;
}
