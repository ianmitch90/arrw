'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardBody } from '@nextui-org/react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold">Welcome back!</h2>
            <p className="text-default-500">{user?.email}</p>
          </CardBody>
        </Card>
        {/* Add more dashboard cards here */}
      </div>
    </div>
  );
}
