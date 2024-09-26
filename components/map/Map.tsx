'use client';

import React, { useEffect, useState } from 'react';
import MapGL, { Marker, Popup, ViewStateChangeEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMap } from '@/components/contexts/MapContext';
import { useUser } from '@/components/contexts/UserContext';
import { supabase } from '@/utils/supabase/client';
import { User, Place, Event } from '@/components/types';

const Map = () => {
  const { viewport, setViewport } = useMap() || {
    viewport: null,
    setViewport: () => {}
  }; // Ensure default values
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedItem, setSelectedItem] = useState<User | Place | Event | null>(
    null
  );

  useEffect(() => {
    // Fetch nearby users, places, and events
    const fetchNearbyData = async () => {
      const { data: nearbyUsers } = await supabase
        .from('profiles') // Ensure fetching from profiles
        .select('*')
        .not('id', 'eq', user?.id)
        .limit(20);
      setUsers((nearbyUsers as User[]) || []);

      const { data: nearbyPlaces } = await supabase
        .from('places')
        .select('*')
        .limit(10);
      setPlaces((nearbyPlaces as Place[]) || []);

      const { data: nearbyEvents } = await supabase
        .from('events')
        .select('*')
        .limit(10);
      setEvents((nearbyEvents as Event[]) || []);
    };

    fetchNearbyData();

    // Set up real-time subscriptions
    const usersSubscription = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          setUsers((currentUsers) => {
            const index = currentUsers.findIndex(
              (u) => u.id === (payload.new as User).id
            );
            if (index !== -1) {
              return [
                ...currentUsers.slice(0, index),
                payload.new as User,
                ...currentUsers.slice(index + 1)
              ];
            } else {
              return [...currentUsers, payload.new as User];
            }
          });
        }
      )
      .subscribe();

    const eventsSubscription = supabase
      .channel('public:events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          setEvents((currentEvents) => {
            const index = currentEvents.findIndex(
              (e) => e.id === (payload.new as Event).id
            );
            if (index !== -1) {
              return [
                ...currentEvents.slice(0, index),
                payload.new as Event,
                ...currentEvents.slice(index + 1)
              ];
            } else {
              return [...currentEvents, payload.new as Event];
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersSubscription);
      supabase.removeChannel(eventsSubscription);
    };
  }, [user]);

  return (
    <MapGL
      {...viewport}
      width="100%"
      height="100%"
      onViewportChange={(nextViewport: ViewStateChangeEvent) =>
        setViewport(nextViewport)
      }
      mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
    >
      {users.map((user) => (
        <Marker
          key={user.id}
          latitude={
            (user as User & { location: { coordinates: number[] } }).location
              .coordinates[1]
          }
          longitude={
            (user as User & { location: { coordinates: number[] } }).location
              .coordinates[0]
          }
        >
          <div
            className="w-8 h-8 bg-blue-500 rounded-full cursor-pointer"
            onClick={() => setSelectedItem(user)}
          >
            <img
              src={user.avatar_url} // Ensure using profile avatar
              alt={user.username} // Ensure using profile username
              className="w-full h-full rounded-full"
            />
          </div>
        </Marker>
      ))}

      {places.map((place) => (
        <Marker
          key={place.id}
          latitude={place.location.coordinates[1]}
          longitude={place.location.coordinates[0]}
        >
          <div
            className="w-8 h-8 bg-green-500 rounded-full cursor-pointer"
            onClick={() => setSelectedItem(place)}
          >
            <span className="text-white text-xs">{place.icon}</span>
          </div>
        </Marker>
      ))}

      {events.map((event) => (
        <Marker
          key={event.id}
          latitude={event.location.coordinates[1]}
          longitude={event.location.coordinates[0]}
        >
          <div
            className="w-8 h-8 bg-red-500 rounded-full cursor-pointer"
            onClick={() => setSelectedItem(event)}
          >
            <span className="text-white text-xs">{event.icon}</span>
          </div>
        </Marker>
      ))}

      {selectedItem && 'location' in selectedItem && (
        <Popup
          latitude={selectedItem.location.coordinates[1]}
          longitude={selectedItem.location.coordinates[0]}
          onClose={() => setSelectedItem(null)}
        >
          <div>
            {selectedItem && 'username' in selectedItem ? (
              <>
                <h3>{selectedItem.username}</h3>
                <p>{selectedItem.description}</p>
              </>
            ) : selectedItem && 'title' in selectedItem ? (
              <>
                <h3>{selectedItem.title}</h3>
                <p>{selectedItem.description}</p>
              </>
            ) : selectedItem && 'name' in selectedItem ? (
              <>
                <h3>{selectedItem.name}</h3>
              </>
            ) : null}
          </div>
        </Popup>
      )}
    </MapGL>
  );
};

export default Map;
