import { createClient } from "@/lib/supabase/server"
import { RequestAccessForm } from "./request-access-form"
import Link from "next/link"
import Image from "next/image"

export default async function RequestAccessPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    // Resolve tenant (select without access_requests_enabled to stay compatible pre-migration)
    const { data: tenant, error } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle()

    if (error || !tenant) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-earth-cloud p-4">
                <div className="w-full max-w-md space-y-4 rounded-lg border border-clay-red/20 bg-white p-8 shadow-lg text-center">
                    <h1 className="text-2xl font-bold text-clay-red">Community Not Found</h1>
                    <p className="text-mist-gray">The community &quot;{slug}&quot; does not exist or is not available.</p>
                </div>
            </div>
        )
    }

    // Check feature flag (fail-closed: only allow on success or missing column)
    let accessRequestsEnabled = false
    const { data: tenantFlags, error: flagError } = await supabase
        .from("tenants")
        .select("access_requests_enabled")
        .eq("id", tenant.id)
        .maybeSingle()

    if (flagError) {
        // Missing column (pre-migration) → fail-open, otherwise fail-closed
        const isMissingColumn = flagError.message?.includes('access_requests_enabled') || flagError.code === 'PGRST204'
        accessRequestsEnabled = isMissingColumn
    } else if (tenantFlags && typeof tenantFlags.access_requests_enabled === "boolean") {
        accessRequestsEnabled = tenantFlags.access_requests_enabled
    } else {
        // Column exists but tenant has no row or null value → default true
        accessRequestsEnabled = true
    }

    if (!accessRequestsEnabled) {
        return (
            <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-earth-cloud/30 p-8">
                <div className="w-full max-w-md space-y-4 rounded-lg border border-earth-pebble bg-white p-8 shadow-lg text-center">
                    <h1 className="text-2xl font-bold text-earth-soil">Not Available</h1>
                    <p className="text-mist-gray">
                        Access requests are not currently available for {tenant.name}.
                        Please contact the community administrator directly.
                    </p>
                    <Link
                        href={`/t/${slug}/login`}
                        className="inline-block mt-4 text-forest-canopy hover:text-forest-deep hover:underline font-medium transition-colors"
                    >
                        ← Back to login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-[100dvh] flex-col lg:grid lg:grid-cols-2">
            {/* Left Panel: Request Form */}
            <div className="flex flex-1 flex-col items-center justify-center p-8 bg-earth-cloud/30 w-full">
                <RequestAccessForm tenant={{ id: tenant.id, name: tenant.name, slug: tenant.slug }} />
            </div>

            {/* Right Side - Hero/Brand (same as login) */}
            <div className="hidden lg:block relative h-full overflow-hidden bg-forest-deep">
                <Image
                    src="/login.png"
                    alt="Community Hero"
                    fill
                    className="object-cover object-center saturate-150 brightness-90"
                    priority
                />
                <div className="absolute inset-0 bg-forest-canopy/20 mix-blend-overlay" />
            </div>
        </div>
    )
}
