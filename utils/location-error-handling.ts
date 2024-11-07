import { AppError, errorCodes } from './error-handling';

export class LocationError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'LocationError';
  }
}

export const locationErrorCodes = {
  PERMISSION_DENIED: 'LOCATION_PERMISSION_DENIED',
  POSITION_UNAVAILABLE: 'LOCATION_POSITION_UNAVAILABLE',
  TIMEOUT: 'LOCATION_TIMEOUT',
  CITY_NOT_FOUND: 'LOCATION_CITY_NOT_FOUND',
  UPDATE_FAILED: 'LOCATION_UPDATE_FAILED',
  TRAVEL_MODE_ERROR: 'LOCATION_TRAVEL_MODE_ERROR'
} as const;

export const handleLocationError = (
  error: GeolocationPositionError | Error
): LocationError => {
  if (error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new LocationError(
          'Location permission denied',
          locationErrorCodes.PERMISSION_DENIED
        );
      case error.POSITION_UNAVAILABLE:
        return new LocationError(
          'Position unavailable',
          locationErrorCodes.POSITION_UNAVAILABLE
        );
      case error.TIMEOUT:
        return new LocationError(
          'Location request timed out',
          locationErrorCodes.TIMEOUT
        );
      default:
        return new LocationError(
          'Unknown location error',
          'LOCATION_UNKNOWN_ERROR'
        );
    }
  }

  return new LocationError(error.message, 'LOCATION_ERROR');
};
