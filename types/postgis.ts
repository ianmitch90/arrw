import { Database } from '@/types_db';

/**
 * PostGIS point type representing geographic coordinates
 * This is the canonical definition to be used throughout the application
 */
export interface PostGISPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  crs?: {
    type: 'name';
    properties: {
      name: 'urn:ogc:def:crs:EPSG::4326';
    };
  };
}

/**
 * Helper function to convert latitude/longitude to PostGISPoint
 */
export function toPostGISPoint(lat: number, lng: number): PostGISPoint {
  return {
    type: 'Point',
    coordinates: [lng, lat],
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::4326'
      }
    }
  };
}

/**
 * Helper function to extract latitude/longitude from PostGISPoint
 */
export function fromPostGISPoint(point: PostGISPoint): { latitude: number; longitude: number } {
  const [longitude, latitude] = point.coordinates;
  return { latitude, longitude };
}