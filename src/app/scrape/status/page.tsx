'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ScrapeStatusPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/transcripts')
  }, [router])
  return null
}
