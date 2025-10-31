"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"

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
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()

      // Sign in
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      console.log("[v0] Auth user:", authData.user.id)

      const { data: superAdminData } = await supabase
        .from("users")
        .select("role, tenant_id")
        .eq("id", authData.user.id)
        .maybeSingle()

      // Super admins can access any tenant
      if (superAdminData?.role === "super_admin") {
        console.log("[v0] Super admin access granted")
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

      console.log("[v0] Resident data:", residentData)

      if (residentError || !residentData) {
        await supabase.auth.signOut()
        throw new Error("You do not have access to this community")
      }

      console.log("[v0] Access granted, redirecting...")

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
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{tenant.name}</CardTitle>
        <CardDescription>Sign in to access your community</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner className="mr-2" />}
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
