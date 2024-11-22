import { Database } from './supabase';

export interface DatabaseFunctions {
  get_nearby_places: (args: {
    lat: number;
    lng: number;
    radius_miles: number;
    place_types: string[];
  }) => Promise<any>;

  get_nearby_stories: (args: {
    lat: number;
    lng: number;
    radius_miles: number;
  }) => Promise<any>;
}

// Extend the Database type to include function definitions
declare module './supabase' {
  interface Database {
    public: {
      Functions: DatabaseFunctions;
    } & Database['public'];
  }
}
