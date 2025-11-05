"use client"

import { GoogleMapEditor } from "./google-map-editor"

interface GoogleMapEditorClientWrapperProps {
  tenantSlug: string
  tenantId: string
  communityBoundary: any
  lots: any[]
  neighborhoods: any[]
  isPreview: boolean
}

export function GoogleMapEditorClientWrapper({
  tenantSlug,
  tenantId,
  communityBoundary,
  lots,
  neighborhoods,
  isPreview,
}: GoogleMapEditorClientWrapperProps) {
  console.log("[v0] Wrapper rendering with isPreview:", isPreview)

  return (
    <GoogleMapEditor
      tenantSlug={tenantSlug}
      tenantId={tenantId}
      lots={lots}
      neighborhoods={neighborhoods}
      mode="edit"
    />
  )
}
