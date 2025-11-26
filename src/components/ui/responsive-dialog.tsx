"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// Size mappings for desktop dialog
const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  full: "sm:max-w-[calc(100%-2rem)]",
}

export interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  size?: keyof typeof sizeClasses
  className?: string
  showCloseButton?: boolean
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "lg",
  className,
  showCloseButton = true,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            "max-h-[90vh] overflow-y-auto rounded-t-xl pb-safe-bottom",
            className
          )}
        >
          <SheetHeader className="text-left">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="mt-4">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto",
          sizeClasses[size],
          className
        )}
        showCloseButton={showCloseButton}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

// Sub-components for consistent form layouts
export function ResponsiveDialogBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>
}

export function ResponsiveDialogFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <SheetFooter className={cn("mt-6 flex-col-reverse gap-2 sm:flex-row", className)}>
        {children}
      </SheetFooter>
    )
  }

  return (
    <DialogFooter className={cn("mt-6", className)}>
      {children}
    </DialogFooter>
  )
}

// Responsive form grid for dialogs
export function ResponsiveDialogFormGrid({
  children,
  className,
  cols = 2,
}: {
  children: React.ReactNode
  className?: string
  cols?: 2 | 3 | 4
}) {
  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
  }

  return (
    <div className={cn("grid gap-4", colClasses[cols], className)}>
      {children}
    </div>
  )
}
