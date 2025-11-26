"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

// Constants for dock behavior
const DEFAULT_ICON_SIZE = 48;
const DEFAULT_MAGNIFICATION = 72;
const DEFAULT_DISTANCE = 140;

// Dock Context
interface DockContextValue {
  mouseX: MotionValue<number>;
  iconSize: number;
  magnification: number;
  distance: number;
}

const DockContext = React.createContext<DockContextValue | undefined>(undefined);

function useDock() {
  const context = React.useContext(DockContext);
  if (!context) {
    throw new Error("useDock must be used within a Dock component");
  }
  return context;
}

// Dock variants
const dockVariants = cva(
  "flex items-end gap-2 rounded-2xl border bg-background/80 backdrop-blur-md px-4 py-3 shadow-lg",
  {
    variants: {
      direction: {
        bottom: "",
        top: "",
        left: "flex-col items-center",
        right: "flex-col items-center",
      },
    },
    defaultVariants: {
      direction: "bottom",
    },
  }
);

// Dock Props
export interface DockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dockVariants> {
  iconSize?: number;
  magnification?: number;
  distance?: number;
  children?: React.ReactNode;
}

// Main Dock Component
const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_ICON_SIZE,
      magnification = DEFAULT_MAGNIFICATION,
      distance = DEFAULT_DISTANCE,
      direction = "bottom",
      ...props
    },
    ref
  ) => {
    const mouseX = useMotionValue(Infinity);

    return (
      <DockContext.Provider
        value={{ mouseX, iconSize, magnification, distance }}
      >
        <motion.div
          ref={ref}
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className={cn(dockVariants({ direction }), className)}
          {...props}
        >
          {children}
        </motion.div>
      </DockContext.Provider>
    );
  }
);
Dock.displayName = "Dock";

// Dock Icon Props
export interface DockIconProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  isActive?: boolean;
}

// Dock Icon Component with magnification effect
const DockIcon = React.forwardRef<HTMLDivElement, DockIconProps>(
  ({ className, children, isActive, ...props }, ref) => {
    const { mouseX, iconSize, magnification, distance } = useDock();
    const iconRef = React.useRef<HTMLDivElement>(null);

    const distanceFromMouse = useTransform(mouseX, (val) => {
      const bounds = iconRef.current?.getBoundingClientRect() ?? {
        x: 0,
        width: 0,
      };
      return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(
      distanceFromMouse,
      [-distance, 0, distance],
      [iconSize, magnification, iconSize]
    );

    const width = useSpring(widthSync, {
      mass: 0.1,
      stiffness: 150,
      damping: 12,
    });

    return (
      <motion.div
        ref={iconRef}
        style={{ width, height: width }}
        className={cn(
          "flex aspect-square cursor-pointer items-center justify-center rounded-xl transition-colors",
          isActive
            ? "bg-primary/15 text-primary"
            : "hover:bg-muted text-muted-foreground hover:text-foreground",
          className
        )}
        {...props}
      >
        <div ref={ref} className="flex items-center justify-center w-full h-full">
          {children}
        </div>
      </motion.div>
    );
  }
);
DockIcon.displayName = "DockIcon";

// Dock Separator
const DockSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-10 w-[1px] bg-border mx-1", className)}
    {...props}
  />
));
DockSeparator.displayName = "DockSeparator";

// Dock Label (appears on hover)
export interface DockLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const DockLabel = React.forwardRef<HTMLDivElement, DockLabelProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DockLabel.displayName = "DockLabel";

export { Dock, DockIcon, DockSeparator, DockLabel, useDock };
