import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Rensa DOM efter varje test
afterEach(() => {
  cleanup()
})
