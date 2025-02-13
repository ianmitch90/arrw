import { useState, useEffect } from 'react';
import { Story, Coordinates } from '@/types/core';
import { ScrollShadow, Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import { StoryCircle } from './StoryCircle';
import { StoryViewer } from './StoryViewer';
import { StoryCreator } from './StoryCreator';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';

interface StoriesBarProps {
  location?: Coordinates;
  radius?: number;
}

export function StoriesBar({ location, radius = 10 }: StoriesBarProps) {
  const supabase = useSupabaseClient<Database>();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story>();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch stories when location changes
  useEffect(() => {
    if (!location) return;

    const fetchStories = async () => {
      const { data, error } = await supabase
        .rpc('get_nearby_stories', {
          lat: location.latitude,
          lng: location.longitude,
          radius_miles: radius
        });

      if (error) {
        console.error('Error fetching stories:', error);
        return;
      }

      setStories(data || []);
    };

    fetchStories();

    // Subscribe to new stories in the area
    const channel = supabase
      .channel('nearby_stories')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories',
          filter: `location @ ST_MakeEnvelope(${location.longitude - 0.1}, ${location.latitude - 0.1}, ${location.longitude + 0.1}, ${location.latitude + 0.1})`
        },
        (payload) => {
          setStories(current => [payload.new as Story, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location, radius, supabase]);

  return (
    <>
      <ScrollShadow
        orientation="horizontal"
        className="flex items-center gap-2 p-4 overflow-x-auto"
      >
        {/* Create Story Button */}
        <Button
          className="min-w-[72px] h-[72px] rounded-full p-0 bg-primary/10"
          onPress={() => location && setIsCreating(true)}
          isDisabled={!location}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs">Add Story</span>
          </div>
        </Button>

        {/* Story Circles */}
        {stories.map((story) => (
          <StoryCircle
            key={story.id}
            story={story}
            onPress={() => setSelectedStory(story)}
          />
        ))}
      </ScrollShadow>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          onClose={() => setSelectedStory(undefined)}
        />
      )}

      {/* Story Creator Modal */}
      {isCreating && location && (
        <StoryCreator
          isOpen={true}
          onClose={() => setIsCreating(false)}
          location={location}
        />
      )}
    </>
  );
}
