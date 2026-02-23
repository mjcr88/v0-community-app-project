import { UpdatePasswordForm } from "./update-password-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function UpdatePasswordPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    // If no user session is found, they cannot update the password.
    if (!user || error) {
        console.error(`[v0] UpdatePasswordPage: No active session found for tenant ${slug}. Redirecting to login.`)
        redirect(`/t/${slug}/login?error=The+recovery+session+is+invalid+or+expired.`)
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
            <UpdatePasswordForm tenantSlug={slug} />
        </div>
    )
}
