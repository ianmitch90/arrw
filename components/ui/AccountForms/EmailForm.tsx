'use client'

import { Button, Input } from '@heroui/react'
import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export function EmailForm({ email: currentEmail }: { email: string }) {
  const [email, setEmail] = useState(currentEmail)
  const [loading, setLoading] = useState(false)
  const supabase = useSupabaseClient()

  const updateEmail = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.updateUser({ email })
      
      if (error) throw error
      alert('Email updated!')
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating email!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button
        color="primary"
        onClick={updateEmail}
        isLoading={loading}
        isDisabled={email === currentEmail}
      >
        Update Email
      </Button>
    </div>
  )
}
