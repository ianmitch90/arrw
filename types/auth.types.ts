export interface AgeVerificationState {
  isVerified: boolean;
  verifiedAt: Date | null;
  method: 'modal' | 'document' | null;
  isAnonymous: boolean;
  hasAcknowledged?: boolean;
}

export interface AgeVerificationContextType {
  state: AgeVerificationState;
  verifyAge: (params: {
    birthDate: Date;
    method: 'modal' | 'document';
    isAnonymous: boolean;
    hasAcknowledged: boolean;
  }) => Promise<void>;
  reset: () => void;
  isLoading: boolean;
  error: Error | null;
  isSignupFlow: boolean;
  setIsSignupFlow: (value: boolean) => void;
}
