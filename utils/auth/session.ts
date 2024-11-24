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

  public async saveSession(session: Session): Promise<void> {
    this.storeSession(session);
    this.scheduleTokenRefresh(session);
    this.updateLastActivity();
  }

  private async restoreSession(): Promise<void> {
    try {
      const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);

      if (accessToken && refreshToken) {
        try {
          // First try to set the session
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          // Then verify it's valid
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (session) {
            await this.handleNewSession(session);
          } else {
            // If no session, clear everything
            this.clearSession();
          }
        } catch (error) {
          console.warn('Failed to restore existing session:', error);
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Session restoration error:', error);
      this.clearSession();
    }
  }

  public async refreshSession(): Promise<Session | null> {
    if (this.isRefreshing) return null;
    this.isRefreshing = true;
    this.retryCount = 0;

    const attemptRefresh = async (): Promise<Session | null> => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          if (this.retryCount < MAX_RETRY_ATTEMPTS) {
            this.retryCount++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return attemptRefresh();
          }
          this.clearSession();
          return null;
        }

        if (session) {
          await this.handleNewSession(session);
          return session;
        }

        return null;
      } catch (error) {
        if (this.retryCount < MAX_RETRY_ATTEMPTS) {
          this.retryCount++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return attemptRefresh();
        }
        this.clearSession();
        throw error;
      }
    };

    try {
      return await attemptRefresh();
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

  public async handleNewSession(session: Session): Promise<void> {
    try {
      await this.saveSession(session);
      
      // Set the session in Supabase client
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
    } catch (error) {
      console.error('Error handling new session:', error);
      this.clearSession();
      throw error;
    }
  }

  public clearSession(): void {
    if (typeof window !== 'undefined') {
      Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
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
