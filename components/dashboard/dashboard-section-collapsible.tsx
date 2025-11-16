"use client"

import { useState, type ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from 'lucide-react'

interface DashboardSectionCollapsibleProps {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function DashboardSectionCollapsible({
  title,
  description,
  icon,
  children,
  defaultOpen = true,
  className,
}: DashboardSectionCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {icon}
                <CardTitle>{title}</CardTitle>
              </div>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? "transform rotate-180" : ""}`}
            />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
