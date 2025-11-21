"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/library/button"
import { Input } from "@/components/library/input"
import { Label } from "@/components/library/label"
import { Alert, AlertDescription } from "@/components/library/alert"
import { MagicCard } from "@/components/library/magic-card"
import { cn } from "@/lib/utils"

interface TenantLoginFormProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
}

export function TenantLoginForm({ tenant }: TenantLoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      const { data: userData } = await supabase
        .from("users")
        .select("role, tenant_id")
        .eq("id", authData.user.id)
        .maybeSingle()

      // Super admins can access any tenant
      if (userData?.role === "super_admin") {
        router.push(`/t/${tenant.slug}/admin/dashboard`)
        return
      }

      if (userData?.role === "tenant_admin" && userData?.tenant_id === tenant.id) {
        router.push(`/t/${tenant.slug}/admin/dashboard`)
        return
      }

      const { data: residentData, error: residentError } = await supabase
        .from("users")
        .select("id, is_tenant_admin, tenant_id, onboarding_completed")
        .eq("id", authData.user.id)
        .eq("role", "resident")
        .eq("tenant_id", tenant.id)
        .maybeSingle()

      if (residentError || !residentData) {
        await supabase.auth.signOut()
        throw new Error("You do not have access to this community")
      }

      if (!residentData.onboarding_completed) {
        router.push(`/t/${tenant.slug}/onboarding/welcome`)
      } else if (residentData.is_tenant_admin) {
        router.push(`/t/${tenant.slug}/admin/dashboard`)
      } else {
        router.push(`/t/${tenant.slug}/dashboard`)
      }
    } catch (err: any) {
      console.error("[v0] Login error:", err.message)
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <MagicCard
      className="w-full max-w-md shadow-xl border-earth-pebble rounded-2xl"
      gradientColor="hsl(var(--forest-growth))"
      gradientFrom="hsl(var(--forest-canopy))"
      gradientTo="hsl(var(--sunrise))"
      gradientOpacity={0.25}
      gradientSize={400}
    >
      <div className="p-8 bg-earth-snow/90 backdrop-blur-sm rounded-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-forest-canopy mb-2">Welcome back, neighbor! ☀️</h2>
          <p className="text-mist-gray">Good to see you at {tenant.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-clay-mist border-clay-red text-clay-red">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-earth-soil font-medium">Your email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-mist-gray" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 border-earth-pebble focus-visible:ring-forest-canopy bg-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-earth-soil font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 border-earth-pebble focus-visible:ring-forest-canopy bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-mist-gray hover:text-forest-canopy transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-forest-canopy hover:bg-forest-deep text-white h-11 text-base font-semibold shadow-md transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-mist-gray">
            New here?{" "}
            <a href="#" className="text-forest-canopy hover:underline font-medium">
              Ask your admin for an invite
            </a>
          </p>
        </div>
      </div>
    </MagicCard>
  )
}
