'use client';

import { Card, CardBody } from '@nextui-org/react';

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Explore</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Explore content will go here */}
        <Card>
          <CardBody>
            <p>Explore content coming soon...</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
