import { Database } from '../types_db';

declare module '../types_db' {
  interface DatabaseWithRPC extends Database {
    public: {
      Functions: {
        get_nearby_places: {
          Args: {
            lat: number;
            lng: number;
            radius_miles: number;
            place_types: string[];
          };
          Returns: Database['public']['Tables']['places']['Row'][];
        };
        get_nearby_stories: {
          Args: {
            lat: number;
            lng: number;
            radius_miles: number;
          };
          Returns: Database['public']['Tables']['stories']['Row'][];
        };
        get_nearby_users: {
          Args: {
            user_id: string;
            hours?: number;
            limit_count?: number;
          };
          Returns: Database['public']['Tables']['profiles']['Row'][];
        } & {
          Args: {
            user_location: string; // Format: POINT(lng lat)
            radius_meters: number;
            max_results?: number;
          };
          Returns: Database['public']['Tables']['profiles']['Row'][];
        };
        get_profile_with_location: {
          Args: {
            profile_id: string;
          };
          Returns: {
            id: string;
            display_name: string;
            bio: string;
            avatar_url: string;
            location: {
              type: string;
              coordinates: [number, number];
              last_update: string;
            } | null;
            last_seen: string;
          };
        };
      };
    } & Database['public'];
  }
}
