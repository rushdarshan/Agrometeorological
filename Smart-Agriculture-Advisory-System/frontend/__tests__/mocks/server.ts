// __tests__/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Set up MSW server with all mock handlers.
 * This server intercepts all API calls during tests.
 */
export const server = setupServer(...handlers)
