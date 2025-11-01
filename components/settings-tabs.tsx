"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface SettingsTabsProps {
  tenantSlug: string
}

export function SettingsTabs({ tenantSlug }: SettingsTabsProps) {
  const pathname = usePathname()

  const currentTab = pathname.includes("/privacy") ? "privacy" : pathname.includes("/family") ? "family" : "profile"

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="grid w-full max-w-2xl grid-cols-3">
        <TabsTrigger value="profile" asChild>
          <Link href={`/t/${tenantSlug}/dashboard/settings/profile`}>Profile</Link>
        </TabsTrigger>
        <TabsTrigger value="family" asChild>
          <Link href={`/t/${tenantSlug}/dashboard/settings/family`}>Family</Link>
        </TabsTrigger>
        <TabsTrigger value="privacy" asChild>
          <Link href={`/t/${tenantSlug}/dashboard/settings/privacy`}>Privacy</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
