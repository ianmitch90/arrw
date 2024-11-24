'use client'

import { NextUIProvider } from '@nextui-org/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/providers/AuthProvider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { AgeVerificationProvider } from '@/contexts/AgeVerificationContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [supabaseClient] = useState(() => createClientComponentClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabaseClient}>
        <NextUIProvider>
          <AuthProvider>
            <AgeVerificationProvider>
              {children}
              <Toaster />
            </AgeVerificationProvider>
          </AuthProvider>
        </NextUIProvider>
      </SessionContextProvider>
    </QueryClientProvider>
  )
}
