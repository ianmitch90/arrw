'use client';

import LoginForm from '@/components/ui/AuthForms/LoginForm';
import { Card, CardBody, CardHeader } from '@nextui-org/react';


export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-xl font-bold">Sign In</h1>
          <p className="text-default-500">Use your email to sign in</p>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <LoginForm />
        </CardBody>
      </Card>
    </div>
  );
}
