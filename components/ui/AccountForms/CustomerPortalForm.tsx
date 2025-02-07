'use client'

import { Button } from '@nextui-org/react'
import { useState } from 'react'

export function CustomerPortalForm() {
  const [loading, setLoading] = useState(false)

  const handlePortalRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-portal-link', {
        method: 'POST',
      })
      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        color="primary"
        onClick={handlePortalRequest}
        isLoading={loading}
      >
        Open Customer Portal
      </Button>
    </div>
  )
}
