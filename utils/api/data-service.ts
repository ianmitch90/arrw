import { supabase } from '@/utils/supabase/client';
import { Message } from '@/types/chat.types';

export interface Place {
  id: string;
  name: string;
  address: string;
  hours: string;
  distance: string;
  attendees: number;
  imageUrl: string;
  location: [number, number];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  location: string;
  distance: string;
  status: string;
  position?: [number, number];
}

export class DataService {
  static async getNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 5
  ): Promise<Place[]> {
    const { data, error } = await supabase.rpc('get_nearby_places', {
      lat: latitude,
      lng: longitude,
      radius_miles: radius
    });

    if (error) throw error;
    return data || [];
  }

  static async getNearbyUsers(
    latitude: number,
    longitude: number,
    radius: number = 5
  ): Promise<User[]> {
    const { data, error } = await supabase.rpc('get_nearby_users', {
      lat: latitude,
      lng: longitude,
      radius_miles: radius
    });

    if (error) throw error;
    return data || [];
  }

  static async getMessages(roomId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
