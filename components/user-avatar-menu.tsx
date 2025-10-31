"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface UserAvatarMenuProps {
  user: {
    firstName: string | null
    lastName: string | null
    email: string
    profilePictureUrl: string | null
  }
  tenantSlug: string
}

export function UserAvatarMenu({ user, tenantSlug }: UserAvatarMenuProps) {
  const router = useRouter()
  const supabase = createClient()

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase()

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(`/t/${tenantSlug}/login`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={user.profilePictureUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xs">{initials || "?"}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/t/${tenantSlug}/dashboard/profile`} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/t/${tenantSlug}/dashboard/settings`} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
