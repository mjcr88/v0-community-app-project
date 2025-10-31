"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface SettingsTabsProps {
  tenantSlug: string
}

export function SettingsTabs({ tenantSlug }: SettingsTabsProps) {
  const pathname = usePathname()
  const currentTab = pathname.includes("/privacy") ? "privacy" : "profile"

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="profile" asChild>
          <Link href={`/t/${tenantSlug}/dashboard/settings/profile`}>Profile</Link>
        </TabsTrigger>
        <TabsTrigger value="privacy" asChild>
          <Link href={`/t/${tenantSlug}/dashboard/settings/privacy`}>Privacy</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
