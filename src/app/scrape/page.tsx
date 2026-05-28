'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ScrapePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/transcripts?action=import')
  }, [router])
  return null
}
