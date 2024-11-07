export interface AgeVerificationState {
  isVerified: boolean;
  verifiedAt: Date | null;
  method: 'modal' | 'document' | null;
  isAnonymous: boolean;
}

export interface AgeVerificationContextType {
  state: AgeVerificationState;
  verify: (method: 'modal' | 'document') => Promise<void>;
  reset: () => void;
  isLoading: boolean;
  error: Error | null;
}
