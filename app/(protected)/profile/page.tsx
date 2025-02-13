'use client';

import { Card, CardBody, Avatar, Button } from '@heroui/react';
import { useUser } from '@/components/contexts/UserContext';
import { Icon } from '@iconify/react';

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar
          size="lg"
          src={user?.avatar_url || undefined}
          showFallback
          name={user?.username?.[0] || 'U'}
          className="w-20 h-20"
        />
        <div>
          <h1 className="text-2xl font-bold">{user?.username || 'User'}</h1>
          <p className="text-default-500">@{user?.username || 'username'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="font-semibold">0</p>
            <p className="text-sm text-default-500">Posts</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="font-semibold">0</p>
            <p className="text-sm text-default-500">Followers</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="font-semibold">0</p>
            <p className="text-sm text-default-500">Following</p>
          </CardBody>
        </Card>
      </div>

      <Button
        startContent={<Icon icon="solar:pen-bold" />}
        variant="flat"
        color="primary"
        className="w-full"
      >
        Edit Profile
      </Button>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-default-500">
            {user?.bio || 'No bio yet'}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
