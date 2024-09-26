'use client';

import React from 'react';
import { Button, Input } from '@nextui-org/react';
import { updatePassword } from '@/utils/auth-helpers/server'; // Import your update password function
import { handleRequest } from '@/utils/auth-helpers/client'; // Import your request handler

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword === confirmPassword) {
      const formData = new FormData();
      formData.append('newPassword', newPassword);
      await handleRequest(e, updatePassword, formData); // Handle password update
    } else {
      alert('Passwords do not match');
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <h1 className="mb-4 text-xl font-medium">Update Password</h1>
        <form onSubmit={handleSubmit}>
          <Input
            label="New Password"
            type="password"
            variant="bordered"
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            variant="bordered"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button color="primary" type="submit">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
