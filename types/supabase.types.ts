import { CookieOptions } from '@supabase/ssr';

export interface SupabaseCookieOptions {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
}

export interface SupabaseConfig {
  cookies: SupabaseCookieOptions;
}
