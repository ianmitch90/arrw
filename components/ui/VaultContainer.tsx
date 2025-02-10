'use client';

import React from 'react';
import { Card, CardBody, CardHeader, ScrollShadow } from '@heroui/react';
import { X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface VaultContainerProps {
  title?: string;
  showBackButton?: boolean;
  children: React.ReactNode;
}

export function VaultContainer({ title, showBackButton, children }: VaultContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClose = () => {
    if (!searchParams) {
      router.push('/map');
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('chat');
    params.delete('id');
    const newQuery = params.toString();
    router.push(`/map${newQuery ? `?${newQuery}` : ''}`);
  };

  return (
    <Card className="
      flex h-full w-full flex-col bg-background/80 backdrop-blur-md
      border-none shadow-none rounded-none
      md:border md:shadow-lg md:rounded-lg
      md:h-[calc(100vh-2rem)] md:w-[420px]
      dark:bg-background/90
    ">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams?.toString() ?? '');
                params.delete('id');
                router.push(`/map?${params.toString()}`);
              }}
              className="p-1 hover:bg-accent rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-accent rounded-full"
        >
          <X size={20} />
        </button>
      </CardHeader>

      <CardBody className="flex-1 p-0">
        <ScrollShadow className="h-full">
          {children}
        </ScrollShadow>
      </CardBody>
    </Card>
  );
}
