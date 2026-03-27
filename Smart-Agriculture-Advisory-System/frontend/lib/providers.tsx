"use client"

import { ReactNode, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ReactQueryProvider } from "@/lib/react-query-provider"
import { Toaster } from "sonner"
import { validateEnvironment } from "@/lib/env-validator"

export interface ProvidersProps {
  children: ReactNode
}

/**
 * Root providers wrapper
 * Combines theme, React Query, and notification providers
 * Validates environment variables on client initialization
 */
export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Validate environment on client initialization
    const { isValid, errors, warnings } = validateEnvironment()
    
    // Log any issues (warnings are non-blocking, errors are logged for awareness)
    if (!isValid || warnings.length > 0) {
      console.info("Environment validation result:", { isValid, errors, warnings })
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ReactQueryProvider>
        {children}
        <Toaster position="top-right" />
      </ReactQueryProvider>
    </ThemeProvider>
  )
}
