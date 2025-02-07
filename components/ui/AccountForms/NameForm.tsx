'use client'

import { Button, Input } from '@nextui-org/react'
import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export function NameForm({ name: currentName }: { name: string }) {
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const supabase = useSupabaseClient()

  const updateName = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
      
      if (error) throw error
      alert('Name updated!')
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating name!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="text"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        color="primary"
        onClick={updateName}
        isLoading={loading}
        isDisabled={name === currentName}
      >
        Update Name
      </Button>
    </div>
  )
}
