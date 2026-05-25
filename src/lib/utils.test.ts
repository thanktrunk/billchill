import { describe, expect, it } from 'vitest'
import { cn, toViRegex } from './utils'

describe('cn', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts, keeping the last class', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('excludes falsy conditional classes', () => {
    expect(cn('foo', false && 'bar', null, undefined, 'baz')).toBe('foo baz')
  })

  it('returns empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })
})

describe('toViRegex', () => {
  it('passes non-vowel ASCII characters through unchanged', () => {
    expect(toViRegex('bc')).toBe('bc')
  })

  it('expands a to its Vietnamese character class', () => {
    expect(toViRegex('a')).toBe('[aăâàáảãạắặằẳẵấầẩẫậäåæ]')
  })

  it('expands e to its Vietnamese character class', () => {
    expect(toViRegex('e')).toBe('[eêèéẻẽẹếềểễệë]')
  })

  it('expands i to its Vietnamese character class', () => {
    expect(toViRegex('i')).toBe('[iìíỉĩịï]')
  })

  it('expands o to its Vietnamese character class', () => {
    expect(toViRegex('o')).toBe('[oôơòóỏõọốồổỗộớờởỡợö]')
  })

  it('expands u to its Vietnamese character class', () => {
    expect(toViRegex('u')).toBe('[uưùúủũụứừửữựü]')
  })

  it('expands d to its Vietnamese character class', () => {
    expect(toViRegex('d')).toBe('[dđ]')
  })

  it('normalizes ư and Ư to u before expansion', () => {
    expect(toViRegex('ư')).toBe('[uưùúủũụứừửữựü]')
    expect(toViRegex('Ư')).toBe('[uưùúủũụứừửữựü]')
  })

  it('normalizes ơ to o before expansion', () => {
    expect(toViRegex('ơ')).toBe('[oôơòóỏõọốồổỗộớờởỡợö]')
  })

  it('normalizes đ to d before expansion', () => {
    expect(toViRegex('đ')).toBe('[dđ]')
  })

  it('escapes regex special characters', () => {
    expect(toViRegex('.')).toBe('\\.')
    expect(toViRegex('*')).toBe('\\*')
    expect(toViRegex('(')).toBe('\\(')
  })

  it('handles mixed ASCII vowels, consonants, and Vietnamese in one query', () => {
    expect(toViRegex('phu')).toBe('ph[uưùúủũụứừửữựü]')
  })

  it('normalizes uppercase ASCII to lowercase before expanding', () => {
    expect(toViRegex('A')).toBe('[aăâàáảãạắặằẳẵấầẩẫậäåæ]')
  })
})
