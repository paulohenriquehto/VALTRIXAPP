import * as React from "react"

// Breakpoints matching Tailwind config
const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

type Breakpoint = keyof typeof BREAKPOINTS

const MOBILE_BREAKPOINT = BREAKPOINTS.md // 768px

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= BREAKPOINTS.md && width < BREAKPOINTS.lg)
    }

    checkTablet()
    window.addEventListener("resize", checkTablet)
    return () => window.removeEventListener("resize", checkTablet)
  }, [])

  return isTablet
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>('md')

  React.useEffect(() => {
    const getBreakpoint = (): Breakpoint => {
      const width = window.innerWidth
      if (width < BREAKPOINTS.sm) return 'xs'
      if (width < BREAKPOINTS.md) return 'sm'
      if (width < BREAKPOINTS.lg) return 'md'
      if (width < BREAKPOINTS.xl) return 'xl'
      if (width < BREAKPOINTS['2xl']) return 'xl'
      return '2xl'
    }

    const onChange = () => {
      setBreakpoint(getBreakpoint())
    }

    onChange()
    window.addEventListener("resize", onChange)
    return () => window.removeEventListener("resize", onChange)
  }, [])

  return breakpoint
}

export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(hover: none)').matches
      )
    }

    checkTouch()
  }, [])

  return isTouch
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)

    mql.addEventListener("change", onChange)
    setMatches(mql.matches)

    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}

// Utility hook for responsive values
export function useResponsiveValue<T>(values: {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
  default: T
}): T {
  const breakpoint = useBreakpoint()

  // Find the closest defined value for current breakpoint
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = breakpointOrder.indexOf(breakpoint)

  // Look for value at current breakpoint or lower
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i]
    if (values[bp] !== undefined) {
      return values[bp]!
    }
  }

  return values.default
}
