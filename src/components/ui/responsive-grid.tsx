"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Column count options
type ColCount = 1 | 2 | 3 | 4 | 5 | 6

// Column class mappings
const colsMap: Record<ColCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
}

// Gap size mappings
const gapMap = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
}

// Preset configurations for common patterns
export const gridPresets = {
  // KPI/Metrics cards: 1 -> 2 -> 4
  kpi: {
    default: 1 as ColCount,
    sm: 2 as ColCount,
    md: 2 as ColCount,
    lg: 4 as ColCount,
    xl: 4 as ColCount,
  },
  // Stats cards: 1 -> 2 -> 3 -> 5
  stats: {
    default: 1 as ColCount,
    sm: 2 as ColCount,
    md: 3 as ColCount,
    lg: 5 as ColCount,
  },
  // Card listings: 1 -> 2 -> 3
  cards: {
    default: 1 as ColCount,
    md: 2 as ColCount,
    lg: 3 as ColCount,
  },
  // Gallery/thumbnails: 2 -> 3 -> 4 -> 5
  gallery: {
    default: 2 as ColCount,
    sm: 3 as ColCount,
    md: 4 as ColCount,
    lg: 5 as ColCount,
  },
  // Filters: 1 -> 2 -> 3 -> 4
  filters: {
    default: 1 as ColCount,
    sm: 2 as ColCount,
    md: 3 as ColCount,
    lg: 4 as ColCount,
  },
  // Form fields: 1 -> 2
  form: {
    default: 1 as ColCount,
    sm: 2 as ColCount,
  },
  // Two columns: 1 -> 2
  two: {
    default: 1 as ColCount,
    md: 2 as ColCount,
  },
  // Three columns: 1 -> 2 -> 3
  three: {
    default: 1 as ColCount,
    sm: 2 as ColCount,
    md: 3 as ColCount,
  },
}

export interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default?: ColCount
    xs?: ColCount
    sm?: ColCount
    md?: ColCount
    lg?: ColCount
    xl?: ColCount
    '2xl'?: ColCount
  }
  gap?: keyof typeof gapMap
  className?: string
  preset?: keyof typeof gridPresets
}

export function ResponsiveGrid({
  children,
  cols,
  gap = "md",
  className,
  preset,
}: ResponsiveGridProps) {
  // Use preset if provided, otherwise use cols
  const colConfig = preset ? gridPresets[preset] : cols

  const gridClasses = cn(
    "grid",
    gapMap[gap],
    colConfig?.default && colsMap[colConfig.default],
    colConfig?.xs && `xs:${colsMap[colConfig.xs]}`,
    colConfig?.sm && `sm:${colsMap[colConfig.sm]}`,
    colConfig?.md && `md:${colsMap[colConfig.md]}`,
    colConfig?.lg && `lg:${colsMap[colConfig.lg]}`,
    colConfig?.xl && `xl:${colsMap[colConfig.xl]}`,
    colConfig?.['2xl'] && `2xl:${colsMap[colConfig['2xl']]}`,
    className
  )

  return <div className={gridClasses}>{children}</div>
}

// Convenience components for common patterns

export function KPIGrid({
  children,
  className,
  gap = "md",
}: {
  children: React.ReactNode
  className?: string
  gap?: keyof typeof gapMap
}) {
  return (
    <ResponsiveGrid preset="kpi" gap={gap} className={className}>
      {children}
    </ResponsiveGrid>
  )
}

export function StatsGrid({
  children,
  className,
  gap = "md",
}: {
  children: React.ReactNode
  className?: string
  gap?: keyof typeof gapMap
}) {
  return (
    <ResponsiveGrid preset="stats" gap={gap} className={className}>
      {children}
    </ResponsiveGrid>
  )
}

export function CardGrid({
  children,
  className,
  gap = "md",
}: {
  children: React.ReactNode
  className?: string
  gap?: keyof typeof gapMap
}) {
  return (
    <ResponsiveGrid preset="cards" gap={gap} className={className}>
      {children}
    </ResponsiveGrid>
  )
}

export function FormGrid({
  children,
  className,
  gap = "md",
}: {
  children: React.ReactNode
  className?: string
  gap?: keyof typeof gapMap
}) {
  return (
    <ResponsiveGrid preset="form" gap={gap} className={className}>
      {children}
    </ResponsiveGrid>
  )
}

export function FilterGrid({
  children,
  className,
  gap = "md",
}: {
  children: React.ReactNode
  className?: string
  gap?: keyof typeof gapMap
}) {
  return (
    <ResponsiveGrid preset="filters" gap={gap} className={className}>
      {children}
    </ResponsiveGrid>
  )
}

export function GalleryGrid({
  children,
  className,
  gap = "sm",
}: {
  children: React.ReactNode
  className?: string
  gap?: keyof typeof gapMap
}) {
  return (
    <ResponsiveGrid preset="gallery" gap={gap} className={className}>
      {children}
    </ResponsiveGrid>
  )
}
