'use client'

import dynamic from 'next/dynamic'
import { AdminMapClientProps } from './admin-map-client'

const AdminMapClient = dynamic(
    () => import('./admin-map-client'),
    {
        ssr: false,
        loading: () => <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center text-muted-foreground">Loading Map...</div>
    }
)

export function AdminMapWrapper(props: AdminMapClientProps) {
    return <AdminMapClient {...props} />
}
