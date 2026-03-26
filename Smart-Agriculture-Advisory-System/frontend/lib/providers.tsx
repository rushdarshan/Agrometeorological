"use client"

import { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ReactQueryProvider } from "@/lib/react-query-provider"
import { Toaster } from "sonner"

export interface ProvidersProps {
  children: ReactNode
}

/**
 * Root providers wrapper
 * Combines theme, React Query, and notification providers
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ReactQueryProvider>
        {children}
        <Toaster position="top-right" />
      </ReactQueryProvider>
    </ThemeProvider>
  )
}
