"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"

interface SignupFormProps {
  tenant: {
    id: string
    name: string
    slug: string
    features: any
  }
  resident: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
  token: string
}

export function SignupForm({ tenant, resident, token }: SignupFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const supabase = createBrowserClient()

      console.log("[v0] Starting signup for:", { email: resident.email, residentId: resident.id })

      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: resident.email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/t/${tenant.slug}/onboarding`,
        },
      })

      console.log("[v0] Auth signup result:", {
        userId: authData.user?.id,
        userEmail: authData.user?.email,
        error: signUpError?.message,
        errorCode: signUpError?.code,
        errorStatus: signUpError?.status,
      })

      if (signUpError) {
        console.error("[v0] Auth signup error details:", signUpError)
        throw new Error(signUpError.message || "Failed to create auth account")
      }

      if (!authData.user) {
        throw new Error("No user returned from signup")
      }

      console.log("[v0] Calling link-resident API:", { residentId: resident.id, authUserId: authData.user.id })

      const response = await fetch("/api/link-resident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: resident.id,
          authUserId: authData.user.id,
        }),
      })

      console.log("[v0] Link-resident response:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Link-resident error:", errorData)
        throw new Error(errorData.error || "Failed to link account")
      }

      const linkResult = await response.json()
      console.log("[v0] Link-resident success:", linkResult)

      const redirectPath = tenant.features?.onboarding
        ? `/t/${tenant.slug}/onboarding/welcome`
        : `/t/${tenant.slug}/dashboard`

      console.log("[v0] Redirecting to:", redirectPath)
      router.push(redirectPath)
    } catch (err: any) {
      console.error("[v0] Signup error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
        fullError: err,
      })
      setError(err.message || "An error occurred during signup")
    } finally {
      setLoading(false)
    }
  }

  const displayName = [resident.first_name, resident.last_name].filter(Boolean).join(" ") || resident.email

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome to {tenant.name}</CardTitle>
        <CardDescription>Create your password to complete registration</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={displayName} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={resident.email} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner className="mr-2" />}
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
