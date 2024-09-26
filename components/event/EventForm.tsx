'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useUser } from '@/components/contexts/UserContext';
import { Event } from '@/components/types';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Button
} from '@nextui-org/react';

const EventForm = () => {
  const { user } = useUser();
  const [event, setEvent] = useState<Omit<Event, 'id'>>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    creator_id: '',
    max_participants: 0,
    event_type: '',
    icon: ''
  });

  const createEvent = async () => {
    const { error } = await supabase
      .from('events')
      .insert([{ ...event, creator_id: user?.id }]);

    if (error) {
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h1>Create Event</h1>
      </CardHeader>
      <CardBody>
        <Input
          fullWidth
          label="Title"
          value={event.title}
          onChange={(e) => setEvent({ ...event, title: e.target.value })}
        />
        <Textarea
          fullWidth
          label="Description"
          value={event.description}
          onChange={(e) => setEvent({ ...event, description: e.target.value })}
        />
        <Input
          fullWidth
          type="datetime-local"
          label="Start Time"
          value={event.start_time}
          onChange={(e) => setEvent({ ...event, start_time: e.target.value })}
        />
        <Input
          fullWidth
          type="datetime-local"
          label="End Time"
          value={event.end_time}
          onChange={(e) => setEvent({ ...event, end_time: e.target.value })}
        />
        <Input
          fullWidth
          label="Location (lat,lng)"
          value={event.location.coordinates.join(',')}
          onChange={(e) =>
            setEvent({
              ...event,
              location: {
                type: 'Point',
                coordinates: e.target.value.split(',').map(Number) as [
                  number,
                  number
                ]
              }
            })
          }
        />
        <Input
          fullWidth
          type="number"
          label="Max Participants"
          value={event.max_participants.toString()}
          onChange={(e) =>
            setEvent({ ...event, max_participants: parseInt(e.target.value) })
          }
        />
        <Input
          fullWidth
          label="Event Type"
          value={event.event_type}
          onChange={(e) => setEvent({ ...event, event_type: e.target.value })}
        />
        <Input
          fullWidth
          label="Icon"
          value={event.icon}
          onChange={(e) => setEvent({ ...event, icon: e.target.value })}
        />
      </CardBody>
      <CardFooter>
        <Button onClick={createEvent}>Create Event</Button>
      </CardFooter>
    </Card>
  );
};

export default EventForm;
