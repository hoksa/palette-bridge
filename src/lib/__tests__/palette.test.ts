import { describe, it, expect } from 'vitest'
import { resolveShadeRef, resolveAllRoles } from '../palette'
import { SAMPLE_PALETTE_CONFIG } from '../../data/sample-palette'
import type { ShadeRef, RoleAssignments } from '../../types'

describe('resolveShadeRef', () => {
  it('resolves a palette shade to a hex value', () => {
    const ref: ShadeRef = { palette: 'primary', shade: '600' }
    expect(resolveShadeRef(SAMPLE_PALETTE_CONFIG, ref)).toBe('#2563eb')
  })

  it('resolves white', () => {
    const ref: ShadeRef = { palette: 'primary', shade: 'white' }
    expect(resolveShadeRef(SAMPLE_PALETTE_CONFIG, ref)).toBe('#ffffff')
  })

  it('resolves black', () => {
    const ref: ShadeRef = { palette: 'neutral', shade: 'black' }
    expect(resolveShadeRef(SAMPLE_PALETTE_CONFIG, ref)).toBe('#000000')
  })

  it('returns null for invalid reference', () => {
    const ref: ShadeRef = { palette: 'nonexistent', shade: '500' }
    expect(resolveShadeRef(SAMPLE_PALETTE_CONFIG, ref)).toBeNull()
  })
})

describe('resolveAllRoles', () => {
  it('resolves a full RoleAssignments to hex values', () => {
    const assignments: Partial<RoleAssignments> = {
      primary: { palette: 'primary', shade: '600' },
      onPrimary: { palette: 'primary', shade: 'white' },
    }
    const resolved = resolveAllRoles(SAMPLE_PALETTE_CONFIG, assignments as RoleAssignments)
    expect(resolved.primary).toBe('#2563eb')
    expect(resolved.onPrimary).toBe('#ffffff')
  })
})
