'use client'

import { HeroUIProvider } from '@heroui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/providers/AuthProvider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { AgeVerificationProvider } from '@/contexts/AgeVerificationContext'
import { LocationProvider } from '@/contexts/LocationContext'
import { SecurityProvider } from '@/contexts/SecurityContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [supabaseClient] = useState(() => createClientComponentClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabaseClient}>
        <HeroUIProvider>
          <AuthProvider>
            <AgeVerificationProvider>
              <SecurityProvider>
                <LocationProvider>
                  {children}
                  <Toaster />
                </LocationProvider>
              </SecurityProvider>
            </AgeVerificationProvider>
          </AuthProvider>
        </HeroUIProvider>
      </SessionContextProvider>
    </QueryClientProvider>
  )
}
