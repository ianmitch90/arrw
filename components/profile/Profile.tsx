'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useUser } from '@/components/contexts/UserContext';
import { Profile as ProfileType } from '@/types/profile';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Button
} from '@heroui/react';

const Profile = () => {
  const { user } = useUser();
  const [profile, setProfile] = useState<ProfileType>({
    id: '',
    username: '', // Profile-specific field
    bio: '', // Profile-specific field
    avatar_url: '', // Profile-specific field
    is_verified: false // Profile-specific field
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profile') // Changed from 'users' to 'profiles'
      .select('*')
      .eq('id', user?.id)
      .single();

    if (data) {
      const completeProfile: ProfileType = {
        id: data.id,
        username: data.username || '', // Default value if undefined
        bio: data.bio || '', // Default value if undefined
        avatar_url: data.avatar_url || '', // Default value if undefined
        is_verified: data.is_verified || false // Default value if undefined
      };
      setProfile(completeProfile);
    }
  };

  const updateProfile = async () => {
    const { error } = await supabase
      .from('profile') // Changed from 'users' to 'profiles'
      .update(profile)
      .eq('id', user?.id);

    if (error) {
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h1>Profile</h1>
      </CardHeader>
      <CardBody>
        <Input
          fullWidth
          label="Username"
          value={profile.username}
          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
        />
        <Textarea
          fullWidth
          label="Bio"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
        />
        <Input
          fullWidth
          label="Avatar URL"
          value={profile.avatar_url}
          onChange={(e) =>
            setProfile({ ...profile, avatar_url: e.target.value })
          }
        />
      </CardBody>
      <CardFooter>
        <Button onClick={updateProfile}>Save</Button>
      </CardFooter>
    </Card>
  );
};

export default Profile;
