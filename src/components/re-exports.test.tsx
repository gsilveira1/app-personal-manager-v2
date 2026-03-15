import { describe, it, expect } from 'vitest'

describe('backward compatibility re-exports', () => {
  it('AuthLayout re-exports AuthPageLayout', async () => {
    const mod = await import('./AuthLayout')
    expect(mod.AuthLayout).toBeDefined()
  })

  it('Layout re-exports DashboardLayout', async () => {
    const mod = await import('./Layout')
    expect(mod.Layout).toBeDefined()
  })

  it('ui.tsx re-exports atoms', async () => {
    const mod = await import('./ui')
    expect(mod.Button).toBeDefined()
    expect(mod.Input).toBeDefined()
    expect(mod.Card).toBeDefined()
    expect(mod.Badge).toBeDefined()
    expect(mod.Label).toBeDefined()
    expect(mod.Select).toBeDefined()
  })
})
