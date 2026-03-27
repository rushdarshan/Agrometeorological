// __tests__/setup.ts
import React from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Create a fresh QueryClient for each test to avoid state pollution.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Custom render function that wraps components with necessary providers.
 * 
 * Usage:
 *   const { getByText } = renderWithProviders(<MyComponent />)
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    defaultValue,
    ...renderOptions
  }: RenderOptions & { defaultValue?: any } = {}
) {
  const testQueryClient = createTestQueryClient()

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: testQueryClient },
      children
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

export * from '@testing-library/react'
export { renderWithProviders as render }
