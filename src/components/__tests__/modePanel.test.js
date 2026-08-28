import { describe, it, expect } from 'vitest'
import { MODES } from '../ModePanel.jsx'

describe('ModePanel config', () => {
  it('every entry has num, label, desc, and action', () => {
    MODES.forEach(m => {
      expect(typeof m.num).toBe('number')
      expect(typeof m.label).toBe('string')
      expect(typeof m.desc).toBe('string')
      expect(typeof m.action).toBe('string')
    })
  })

  it('num values are unique and sequential starting at 1', () => {
    const nums = MODES.map(m => m.num)
    nums.forEach((n, i) => expect(n).toBe(i + 1))
  })

  it('action values are unique', () => {
    const actions = MODES.map(m => m.action)
    const unique = new Set(actions)
    expect(unique.size).toBe(actions.length)
  })

  it('includes RESET ALL entry with resetAll action', () => {
    const entry = MODES.find(m => m.action === 'resetAll')
    expect(entry).toBeDefined()
    expect(entry.label).toBe('RESET ALL')
    expect(entry.danger).toBe(true)
  })

  it('RESET ALL is the last entry', () => {
    expect(MODES[MODES.length - 1].action).toBe('resetAll')
  })

  it('danger flag is set only on RESET ALL', () => {
    const dangerous = MODES.filter(m => m.danger)
    expect(dangerous).toHaveLength(1)
    expect(dangerous[0].action).toBe('resetAll')
  })

  it('no entry label contains an em dash', () => {
    MODES.forEach(m => {
      expect(m.label).not.toContain('—')
      expect(m.desc).not.toContain('—')
    })
  })
})
