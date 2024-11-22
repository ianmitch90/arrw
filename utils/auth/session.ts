import { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';

// Constants for session management
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOKEN_REFRESH_MARGIN = 60 * 60 * 1000; // 1 hour before expiry
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 2000; // 2 seconds
const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'sb-access-token',
  REFRESH_TOKEN: 'sb-refresh-token',
  USER: 'sb-user',
  LAST_ACTIVITY: 'sb-last-activity'
};

interface SessionError extends Error {
  code?: string;
  status?: number;
}

export const SessionErrorTypes = {
  EXPIRED: 'SESSION_EXPIRED',
  INVALID: 'SESSION_INVALID',
  REFRESH_FAILED: 'REFRESH_FAILED',
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'SESSION_TIMEOUT',
} as const;

export class SessionManager {
  private static instance: SessionManager;
  private lastActivity: number;
  private refreshTimeout: NodeJS.Timeout | null;
  private retryCount: number;
  private isRefreshing: boolean;

  private constructor() {
    this.lastActivity = this.getStoredLastActivity() || Date.now();
    this.refreshTimeout = null;
    this.retryCount = 0;
    this.isRefreshing = false;
    this.setupActivityTracking();
    this.restoreSession();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private setupActivityTracking(): void {
    if (typeof window !== 'undefined') {
      ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
        window.addEventListener(event, () => this.updateLastActivity());
      });
    }
  }

  public updateLastActivity(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    }
  }

  private getStoredLastActivity(): number | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY);
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  }

  private async restoreSession(): Promise<void> {
    try {
      const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
      const userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          this.handleNewSession(session);
          return;
        }
      }

      // If no valid session, try to refresh
      await this.refreshSession();
    } catch (error) {
      console.warn('Failed to restore session:', error);
      this.clearSession();
    }
  }

  public async refreshSession(): Promise<Session | null> {
    if (this.isRefreshing) return null;
    this.isRefreshing = true;

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        this.clearSession();
        return null;
      }

      if (session) {
        this.handleNewSession(session);
        return session;
      }

      return null;
    } catch (error) {
      this.clearSession();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private storeSession(session: Session): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, session.access_token);
      localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(session.user));
    }
  }

  public handleNewSession(session: Session): void {
    this.storeSession(session);
    this.scheduleTokenRefresh(session);
    this.updateLastActivity();
  }

  public clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY);
    }
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  private scheduleTokenRefresh(session: Session): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    const expiresAt = (session.expires_at || 0) * 1000; // Convert to milliseconds
    const timeUntilRefresh = Math.max(0, expiresAt - Date.now() - TOKEN_REFRESH_MARGIN);

    this.refreshTimeout = setTimeout(() => {
      this.refreshSession();
    }, timeUntilRefresh);
  }

  public isSessionValid(): boolean {
    const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    const lastActivity = this.getStoredLastActivity();
    
    if (!accessToken || !lastActivity) return false;
    
    const timeSinceLastActivity = Date.now() - lastActivity;
    return timeSinceLastActivity < SESSION_TIMEOUT;
  }

  public async getUser(): Promise<any | null> {
    const userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const sessionManager = SessionManager.getInstance();
