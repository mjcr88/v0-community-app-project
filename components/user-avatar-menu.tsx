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
import { User, Settings, LogOut, Home, Shield } from "lucide-react"
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
  showResidentView?: boolean
  showAdminView?: boolean
  showBackToSuperAdmin?: boolean
  isSuperAdmin?: boolean
}

export function UserAvatarMenu({
  user,
  tenantSlug,
  showResidentView = false,
  showAdminView = false,
  showBackToSuperAdmin = false,
  isSuperAdmin = false,
}: UserAvatarMenuProps) {
  const router = useRouter()
  const supabase = createClient()

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase()

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    (user.email.length > 20 ? user.email.substring(0, 20) + "..." : user.email)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(`/t/${tenantSlug}/login`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-ring">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.profilePictureUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-sm">{initials || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left overflow-hidden">
            <p className="text-sm font-medium leading-none truncate w-full">{displayName}</p>
            <p className="text-xs text-muted-foreground">{isSuperAdmin ? "Super Admin" : "Resident"}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showResidentView && (
          <DropdownMenuItem asChild>
            <Link href={`/t/${tenantSlug}/dashboard`} className="cursor-pointer">
              <Home className="mr-2 h-4 w-4" />
              <span>Resident View</span>
            </Link>
          </DropdownMenuItem>
        )}
        {showAdminView && (
          <DropdownMenuItem asChild>
            <Link href={`/t/${tenantSlug}/admin/dashboard`} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          </DropdownMenuItem>
        )}
        {(showResidentView || showAdminView) && <DropdownMenuSeparator />}
        <DropdownMenuItem asChild>
          <Link href={`/t/${tenantSlug}/dashboard/settings/profile`} className="cursor-pointer">
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
        {showBackToSuperAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/backoffice/dashboard" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>Back to Super Admin</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
