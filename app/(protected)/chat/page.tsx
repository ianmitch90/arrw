'use client';

import { Card, CardBody } from '@nextui-org/react';
import { useChat } from '@/components/contexts/ChatContext';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Global Chat</h1>
      <Card>
        <CardBody>
          <p>Global chat coming soon...</p>
        </CardBody>
      </Card>
    </div>
  );
}
