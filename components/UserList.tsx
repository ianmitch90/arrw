'use client';

import { useState, useEffect } from 'react';
import { Profile } from '../types/index';
import { supabase } from '../lib/supabaseClient';
import { Card, CardBody } from '@nextui-org/react'; // Update import here
import UserCard from './UserCard';

export default function UserList() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(20);

      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        setProfiles(data);
      }
    }

    fetchProfiles();
  }, []);

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {profiles.map((profile) => (
        <div key={profile.id} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
          <UserCard profile={profile} />
        </div>
      ))}
    </div>
  );
}
