'use client'

import { AppShell } from '@/components/layout/app-shell'
import { BatchSubmitForm } from '@/components/scrape/batch-submit-form'
import { PERMISSIONS } from '@/lib/constants'

export default function ScrapePage() {
  return (
    <AppShell title="謄本爬取" requiredPermission={PERMISSIONS.SCRAPE_SUBMIT}>
      <BatchSubmitForm />
    </AppShell>
  )
}
