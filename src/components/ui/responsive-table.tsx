"use client"

import * as React from "react"
import { LayoutGrid, List, MoreVertical } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Column definition
export interface TableColumn<T> {
  accessor: keyof T | string
  header: string
  cell?: (row: T) => React.ReactNode
  className?: string
  // Mobile-specific settings
  mobileHidden?: boolean
  mobilePriority?: number // Lower = higher priority, shown first on mobile
  mobileLabel?: string // Alternative shorter label for mobile
}

export interface ResponsiveTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
  mobileCardTemplate?: (row: T, columns: TableColumn<T>[]) => React.ReactNode
  emptyState?: React.ReactNode
  isLoading?: boolean
  // View control
  defaultView?: 'auto' | 'table' | 'cards'
  showViewToggle?: boolean
  className?: string
}

type ViewMode = 'table' | 'cards'

export function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  actions,
  mobileCardTemplate,
  emptyState,
  isLoading,
  defaultView = 'auto',
  showViewToggle = true,
  className,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    if (defaultView === 'auto') return isMobile ? 'cards' : 'table'
    return defaultView
  })

  // Update view mode when screen size changes (only for auto mode)
  React.useEffect(() => {
    if (defaultView === 'auto') {
      setViewMode(isMobile ? 'cards' : 'table')
    }
  }, [isMobile, defaultView])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Empty state
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  // Get columns sorted by mobile priority
  const mobileColumns = [...columns]
    .filter((col) => !col.mobileHidden)
    .sort((a, b) => (a.mobilePriority ?? 99) - (b.mobilePriority ?? 99))
    .slice(0, 4)

  const displayColumns = viewMode === 'cards' ? mobileColumns : columns.filter(col => !col.mobileHidden || viewMode === 'table')

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Toggle */}
      {showViewToggle && (
        <div className="flex justify-end">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Tabela</span>
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {displayColumns.map((col, idx) => (
                  <TableHead key={idx} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
                {actions && <TableHead className="text-right w-[80px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={keyExtractor(row)}
                  className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
                  onClick={() => onRowClick?.(row)}
                >
                  {displayColumns.map((col, idx) => (
                    <TableCell key={idx} className={col.className}>
                      {col.cell
                        ? col.cell(row)
                        : String(row[col.accessor as keyof T] ?? "")}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions(row)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 gap-3">
          {data.map((row) => (
            <Card
              key={keyExtractor(row)}
              className={cn(
                "overflow-hidden transition-shadow",
                onRowClick && "cursor-pointer hover:shadow-md"
              )}
              onClick={() => onRowClick?.(row)}
            >
              <CardContent className="p-4">
                {mobileCardTemplate ? (
                  mobileCardTemplate(row, columns)
                ) : (
                  <DefaultMobileCard
                    row={row}
                    columns={mobileColumns}
                    actions={actions}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Default mobile card layout
function DefaultMobileCard<T extends Record<string, unknown>>({
  row,
  columns,
  actions,
}: {
  row: T
  columns: TableColumn<T>[]
  actions?: (row: T) => React.ReactNode
}) {
  // First column as header, rest as details
  const [headerCol, ...detailCols] = columns

  return (
    <div className="space-y-3">
      {/* Header row with primary info and actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {headerCol && (
            <div className="font-medium truncate">
              {headerCol.cell
                ? headerCol.cell(row)
                : String(row[headerCol.accessor as keyof T] ?? "")}
            </div>
          )}
        </div>
        {actions && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions(row)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Detail rows */}
      {detailCols.length > 0 && (
        <div className="space-y-2 text-sm">
          {detailCols.map((col, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {col.mobileLabel || col.header}
              </span>
              <span className="font-medium text-right">
                {col.cell
                  ? col.cell(row)
                  : String(row[col.accessor as keyof T] ?? "")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Export additional utilities
export { type ViewMode }
