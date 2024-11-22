import { Database } from './supabase';
import { Place, Story } from './core';

declare module './supabase' {
  interface Database {
    public: {
      Functions: {
        get_nearby_places: {
          Args: {
            lat: number;
            lng: number;
            radius_miles: number;
            place_types: string[];
          };
          Returns: Place[];
        };
        get_nearby_stories: {
          Args: {
            lat: number;
            lng: number;
            radius_miles: number;
          };
          Returns: Story[];
        };
      };
    } & Database['public'];
  }
}
