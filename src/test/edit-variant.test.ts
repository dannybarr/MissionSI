import { describe, expect, it } from 'vitest'
import { editActive } from '@/studio/studio/edit-variant'
import { defaultProject } from '@/studio/studio/presets'

describe('editActive', () => {
  it('forks a preset variant and keeps the original name on the preset', () => {
    const project = defaultProject()
    const original = project.variants[0]
    const next = editActive(
      project,
      (v) => ({ ...v, design: { ...v.design, body: { ...v.design.body, color: '#112233' } } }),
      () => 'v-forked',
    )
    const preset = next.variants.find((v) => v.id === original.id)
    expect(preset?.name).toBe(original.name)
    expect(preset?.design.body.color).toBe(original.design.body.color)
    expect(next.activeVariantId).toBe('v-forked')
    expect(next.variants.find((v) => v.id === 'v-forked')?.name).toBe(`${original.name} · edit`)
    expect(next.variants.find((v) => v.id === 'v-forked')?.design.body.color).toBe('#112233')
  })

  it('writes further edits onto the forked variant without renaming it again', () => {
    const project = defaultProject()
    const forked = editActive(
      project,
      (v) => ({ ...v, design: { ...v.design, body: { ...v.design.body, color: '#112233' } } }),
      () => 'v-forked',
    )
    const again = editActive(
      forked,
      (v) => ({ ...v, design: { ...v.design, body: { ...v.design.body, color: '#445566' } } }),
      () => 'v-should-not-be-used',
    )
    expect(again.variants).toHaveLength(forked.variants.length)
    expect(again.activeVariantId).toBe('v-forked')
    expect(again.variants.find((v) => v.id === 'v-forked')?.design.body.color).toBe('#445566')
    expect(again.variants.find((v) => v.id === 'v-forked')?.name).toBe(`${project.variants[0].name} · edit`)
  })
})
