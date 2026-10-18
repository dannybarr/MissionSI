import type { Project, Variant } from './types'

/** Built-in gallery directions. Editing one forks a named copy and leaves the preset alone. */
export const PRESET_VARIANT_IDS = new Set(['v-silver', 'v-graphite', 'v-champagne'])

/**
 * Apply `fn` to the active variant.
 * If that variant is a seeded preset, the preset is kept and the edit lands on a new variant
 * whose name records that it is an edit. `fn` must return the same reference when nothing changed.
 */
export function editActive(project: Project, fn: (v: Variant) => Variant, nextId: () => string): Project {
  const active = project.variants.find((v) => v.id === project.activeVariantId) ?? project.variants[0]
  if (!active) return project
  const preset = PRESET_VARIANT_IDS.has(active.id)
  const base = preset ? structuredClone(active) : active
  const next = fn(base)
  if (next === base) return project
  if (!preset) {
    return { ...project, variants: project.variants.map((v) => (v.id === active.id ? next : v)) }
  }
  const id = nextId()
  const forked: Variant = {
    ...next,
    id,
    name: `${active.name} · edit`.slice(0, 60),
    note: 'Edited from the preset. The original preset is unchanged.',
    updatedAt: Date.now(),
  }
  return { ...project, variants: [...project.variants, forked], activeVariantId: id }
}
