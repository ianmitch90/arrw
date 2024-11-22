'use client';

import SignUpForm from '@/components/ui/AuthForms/UserRegistration/SignUpForm';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { Logo } from '@/components/icons/Logo';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary">
          <Logo className="text-white" size={48} />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Create Account</h1>
        <p className="text-default-500">Join ARRW today</p>
      </div>

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
