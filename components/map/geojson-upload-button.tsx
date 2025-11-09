"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { GeoJSONUploadDialog } from "./geojson-upload-dialog"

interface GeoJSONUploadButtonProps {
  tenantId: string
  tenantSlug: string
}

export function GeoJSONUploadButton({ tenantId, tenantSlug }: GeoJSONUploadButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Upload GeoJSON
      </Button>
      <GeoJSONUploadDialog open={open} onOpenChange={setOpen} tenantId={tenantId} tenantSlug={tenantSlug} />
    </>
  )
}
