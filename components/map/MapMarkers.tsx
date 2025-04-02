import { Profiles, Places, Stories } from '@/types/map';
import { LiveUsersLayer } from './LiveUsersLayer';
import { PlaceMarker } from './PlaceMarker';
import { StoryMarker } from './StoryMarker';

interface MapMarkersProps {
  isMapLoaded: boolean;
  users: {
    nearbyUsers: Profiles[];
    currentUser: Profiles | null;
  };
  places: {
    items: Places[];
    show: boolean;
    onSelect: (place: Places) => void;
  };
  stories: {
    items: Stories[];
    show: boolean;
    onSelect: (story: Stories) => void;
  };
}

export function MapMarkers({
  isMapLoaded,
  users,
  places,
  stories
}: MapMarkersProps) {
  if (!isMapLoaded) return null;

  return (
    <>
      <LiveUsersLayer
        users={users.nearbyUsers}
        currentUser={users.currentUser}
      />

      {places.show &&
        places.items.map((place) => (
          <PlaceMarker
            key={place.id}
            place={place}
            onClick={() => places.onSelect(place)}
          />
        ))}

      {stories.show &&
        stories.items.map((story) => (
          <StoryMarker
            key={story.id}
            story={story}
            onClick={() => stories.onSelect(story)}
          />
        ))}
    </>
  );
}
