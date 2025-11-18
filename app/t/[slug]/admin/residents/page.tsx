import { createServerClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import Link from "next/link"
import { ResidentsTable } from "./residents-table"
import { Users } from 'lucide-react'

export default async function ResidentsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  const { data: familyUnits } = await supabase
    .from("family_units")
    .select("id, primary_contact_id")
    .eq("tenant_id", tenant.id)

  const { data: residents } = await supabase
    .from("users")
    .select(`
      *,
      lots:lot_id (
        id,
        lot_number,
        neighborhoods:neighborhood_id (
          id,
          name
        )
      ),
      family_units:family_unit_id (
        id,
        name
      )
    `)
    .eq("tenant_id", tenant.id)
    .eq("role", "resident")
    .order("created_at", { ascending: false })

  const { data: pets } = await supabase
    .from("pets")
    .select(`
      *,
      lots:lot_id (
        id,
        lot_number,
        neighborhoods:neighborhood_id (
          id,
          name,
          tenant_id
        )
      ),
      family_units:family_unit_id (
        id,
        name
      )
    `)
    .eq("lots.neighborhoods.tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  const filteredPets = pets?.filter((p: any) => p.lots?.neighborhoods?.tenant_id === tenant.id) || []

  const { data: complaints } = await supabase
    .from("resident_requests")
    .select("id, tagged_resident_ids, tagged_pet_ids, status")
    .eq("tenant_id", tenant.id)
    .eq("request_type", "complaint")

  // Calculate complaint counts for each resident
  const residentComplaints = new Map<string, { active: number; total: number }>()
  residents?.forEach((resident) => {
    const activeCount = complaints?.filter(
      (c) => 
        c.tagged_resident_ids?.includes(resident.id) && 
        ['pending', 'in_progress'].includes(c.status)
    ).length || 0
    
    const totalCount = complaints?.filter(
      (c) => c.tagged_resident_ids?.includes(resident.id)
    ).length || 0
    
    residentComplaints.set(resident.id, { active: activeCount, total: totalCount })
  })

  // Calculate complaint counts for each pet
  const petComplaints = new Map<string, { active: number; total: number }>()
  filteredPets?.forEach((pet) => {
    const activeCount = complaints?.filter(
      (c) => 
        c.tagged_pet_ids?.includes(pet.id) && 
        ['pending', 'in_progress'].includes(c.status)
    ).length || 0
    
    const totalCount = complaints?.filter(
      (c) => c.tagged_pet_ids?.includes(pet.id)
    ).length || 0
    
    petComplaints.set(pet.id, { active: activeCount, total: totalCount })
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Residents</h2>
          <p className="text-muted-foreground">Manage residents in your community</p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/admin/residents/create`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Resident
          </Link>
        </Button>
      </div>

      {!residents || residents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No residents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by creating your first resident</p>
        </div>
      ) : (
        <ResidentsTable 
          residents={residents} 
          pets={filteredPets} 
          slug={slug} 
          familyUnits={familyUnits || []}
          residentComplaints={residentComplaints}
          petComplaints={petComplaints}
        />
      )}
    </div>
  )
}
