"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { createAuthUserAction } from "./create-auth-user-action"
import { createBrowserClient } from "@/lib/supabase/client"

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

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      console.log("[v0] Starting signup for:", { email: resident.email, residentId: resident.id })

      const authResult = await createAuthUserAction(resident.email, password)

      console.log("[v0] Auth result:", authResult)

      if (authResult.error) {
        console.error("[v0] Auth signup error:", authResult.error)
        throw new Error(authResult.error)
      }

      if (!authResult.user) {
        throw new Error("No user returned from signup")
      }

      console.log("[v0] Auth user created successfully:", authResult.user.id)

      const supabase = createBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: resident.email,
        password: password,
      })

      if (signInError) {
        console.error("[v0] Auto-login error:", signInError)
        throw new Error("Account created but auto-login failed. Please login manually.")
      }

      console.log("[v0] User auto-logged in successfully")

      const redirectPath = tenant.features?.onboarding
        ? `/t/${tenant.slug}/onboarding/welcome`
        : `/t/${tenant.slug}/dashboard`

      console.log("[v0] Redirecting to:", redirectPath)
      router.push(redirectPath)
      router.refresh()
    } catch (err: any) {
      console.error("[v0] Signup error details:", err.message)
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
