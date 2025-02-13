'use client';

import SignUpForm from '@/components/ui/AuthForms/UserRegistration/SignUpForm';
import { Card, CardBody, CardHeader } from '@heroui/react';


export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-xl font-bold">Sign Up</h1>
          <p className="text-default-500">Create your account to get started</p>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <SignUpForm />
        </CardBody>
      </Card>
    </div>
  );
}
