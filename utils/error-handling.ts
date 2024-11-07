export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorCodes = {
  AGE_VERIFICATION: {
    USER_NOT_FOUND: 'AGE_VERIFICATION_USER_NOT_FOUND',
    VERIFICATION_FAILED: 'AGE_VERIFICATION_FAILED',
    INVALID_METHOD: 'AGE_VERIFICATION_INVALID_METHOD'
  },
  AUTH: {
    SESSION_NOT_FOUND: 'AUTH_SESSION_NOT_FOUND',
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED'
  }
} as const;

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500);
  }

  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500);
};

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};
