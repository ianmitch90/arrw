'use client';

import { Card, CardBody } from '@nextui-org/react';

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <div className="space-y-4">
        {/* Message list will go here */}
        <Card>
          <CardBody>
            <p>Messages coming soon...</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
