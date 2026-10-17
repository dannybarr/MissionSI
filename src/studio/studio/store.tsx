import { resolveTab } from './capabilities';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { TeaserPlacement } from '@/landing/lib/placement';
import { editActive } from './edit-variant';
import { earthMark, featureMark, initialsMark, wordmarkMark } from './features';
import { DEFAULT_VIEW, defaultDesign, defaultProject, initialVariants, materialFromPreset, MAX_MARKS, newMarkId, trimFor, uid } from './presets';
import { loadProject, loadView, saveProject, saveView, storageStatus, type LoadResult } from './storage';
import type { BrandMark, CompId, Design, Project, Variant, ViewSettings } from './types';

/* ---------------- history reducer ---------------- */

interface HistState {
  present: Project;
  past: Project[];
  future: Project[];
  lastKey: string | null;
  lastAt: number;
  /** Pointer gesture in progress (viewport drag / corner resize): snapshot taken at pointer-down. */
  gesture: Project | null;
}

type Action =
  | { type: 'commit'; key: string; at: number; next: (p: Project) => Project; history: boolean }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'gesture'; op: 'begin' | 'end' | 'cancel' };

const LIMIT = 120;
const COALESCE_MS = 700;

export function reducer(state: HistState, action: Action): HistState {
  switch (action.type) {
    case 'commit': {
      const next = action.next(state.present);
      if (next === state.present) return state;
      // inside a gesture every intermediate step only updates the present; 'end' records ONE undo step
      if (!action.history || state.gesture) return { ...state, present: next };
      const coalesce = action.key === state.lastKey && action.at - state.lastAt < COALESCE_MS;
      return {
        present: next,
        past: coalesce ? state.past : [...state.past, state.present].slice(-LIMIT),
        future: [],
        lastKey: action.key,
        lastAt: action.at,
        gesture: null,
      };
    }
    case 'gesture': {
      if (action.op === 'begin') return state.gesture ? state : { ...state, gesture: state.present };
      if (!state.gesture) return state;
      const base = state.gesture;
      if (action.op === 'cancel') return { ...state, present: base, gesture: null, lastKey: null, lastAt: 0 };
      if (state.present === base) return { ...state, gesture: null };
      return { present: state.present, past: [...state.past, base].slice(-LIMIT), future: [], lastKey: null, lastAt: 0, gesture: null };
    }
    case 'undo': {
      if (!state.past.length || state.gesture) return state;
      const prev = state.past[state.past.length - 1];
      return { present: prev, past: state.past.slice(0, -1), future: [state.present, ...state.future], lastKey: null, lastAt: 0, gesture: null };
    }
    case 'redo': {
      if (!state.future.length || state.gesture) return state;
      const [next, ...rest] = state.future;
      return { present: next, past: [...state.past, state.present], future: rest, lastKey: null, lastAt: 0, gesture: null };
    }
  }
}

/* ---------------- context ---------------- */

export type SaveState =
  | { status: 'saved'; at: number }
  | { status: 'dirty' }
  | { status: 'error'; reason: string }
  | { status: 'unavailable' };

export type InspectorTab = 'geometry' | 'material' | 'branding' | 'lighting';

export interface CompareState {
  on: boolean;
  a: string;
  b: string;
}

interface StudioCtx {
  project: Project;
  variant: Variant;
  design: Design;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  /** Group every change between begin and end into one undo step; cancel restores the snapshot. */
  gesture: (op: 'begin' | 'end' | 'cancel') => void;
  updateDesign: (key: string, fn: (d: Design) => Design) => void;
  updateProject: (key: string, fn: (p: Project) => Project) => void;
  setActiveVariant: (id: string) => void;
  duplicateVariant: (id: string) => void;
  saveAsVariant: (name: string, note: string) => void;
  renameVariant: (id: string, name: string) => void;
  deleteVariant: (id: string) => void;
  restoreDefaults: (scope: 'variant' | 'project') => void;
  replaceProject: (p: Project) => void;
  save: () => SaveState;
  saveState: SaveState;
  bootNotice: LoadResult;
  selected: CompId | null;
  select: (id: CompId | null) => void;
  /** Active branding mark (only meaningful while the Branding group is selected or the tab is open). */
  selectedMark: string | null;
  selectMark: (id: string | null) => void;
  addMarks: (marks: Omit<BrandMark, 'id'>[]) => string[];
  updateMark: (id: string, key: string, patch: Partial<BrandMark>) => void;
  removeMark: (id: string) => void;
  duplicateMark: (id: string) => void;
  moveMark: (id: string, dir: -1 | 1) => void;
  tab: InspectorTab;
  setTab: (t: InspectorTab) => void;
  view: ViewSettings;
  setView: (patch: Partial<ViewSettings>) => void;
  presentation: boolean;
  setPresentation: (v: boolean) => void;
  compare: CompareState;
  setCompare: (c: Partial<CompareState>) => void;
  galleryOpen: boolean;
  setGalleryOpen: (v: boolean) => void;
  /** Add a new variant from the landing teaser. Seeded presets stay untouched. */
  applyTeaser: (placement: TeaserPlacement) => void;
}

const Ctx = createContext<StudioCtx | null>(null);

export function useStudio(): StudioCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStudio outside StudioProvider');
  return c;
}

function mapActive(p: Project, fn: (v: Variant) => Variant): Project {
  return { ...p, variants: p.variants.map((v) => (v.id === p.activeVariantId ? fn(v) : v)) };
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [boot] = useState<LoadResult>(() => loadProject());
  const [state, dispatch] = useReducer(reducer, undefined, (): HistState => ({
    present: boot.kind === 'loaded' ? boot.project : defaultProject(),
    past: [],
    future: [],
    lastKey: null,
    lastAt: 0,
    gesture: null,
  }));
  const project = state.present;
  const variant = project.variants.find((v) => v.id === project.activeVariantId) ?? project.variants[0];

  const [saveState, setSaveState] = useState<SaveState>(() =>
    storageStatus() === 'unavailable'
      ? { status: 'unavailable' }
      : boot.kind === 'loaded' && boot.project.savedAt
        ? { status: 'saved', at: boot.project.savedAt }
        : { status: 'dirty' },
  );

  const commit = useCallback((key: string, next: (p: Project) => Project, history = true) => {
    dispatch({ type: 'commit', key, at: Date.now(), next, history });
  }, []);

  const updateDesign = useCallback(
    (key: string, fn: (d: Design) => Design) =>
      commit(key, (p) =>
        editActive(
          p,
          (v) => {
            const design = fn(v.design);
            return design === v.design ? v : { ...v, design, updatedAt: Date.now() };
          },
          () => 'v-' + uid(),
        ),
      ),
    [commit],
  );
  const updateProject = useCallback((key: string, fn: (p: Project) => Project) => commit(key, fn), [commit]);

  const setActiveVariant = useCallback(
    (id: string) => commit('variant:switch', (p) => (p.activeVariantId === id ? p : { ...p, activeVariantId: id })),
    [commit],
  );

  const duplicateVariant = useCallback(
    (id: string) =>
      commit('variant:dup:' + uid(), (p) => {
        const src = p.variants.find((v) => v.id === id);
        if (!src) return p;
        const copy: Variant = {
          ...structuredClone(src),
          id: 'v-' + uid(),
          name: `${src.name} copy`,
          updatedAt: Date.now(),
        };
        const idx = p.variants.findIndex((v) => v.id === id);
        const variants = [...p.variants];
        variants.splice(idx + 1, 0, copy);
        return { ...p, variants, activeVariantId: copy.id };
      }),
    [commit],
  );

  const saveAsVariant = useCallback(
    (name: string, note: string) =>
      commit('variant:new:' + uid(), (p) => {
        const src = p.variants.find((v) => v.id === p.activeVariantId) ?? p.variants[0];
        const v: Variant = { id: 'v-' + uid(), name, note, design: structuredClone(src.design), updatedAt: Date.now() };
        return { ...p, variants: [...p.variants, v], activeVariantId: v.id };
      }),
    [commit],
  );

  const renameVariant = useCallback(
    (id: string, name: string) =>
      commit('variant:rename:' + id, (p) => ({ ...p, variants: p.variants.map((v) => (v.id === id ? { ...v, name } : v)) })),
    [commit],
  );

  const deleteVariant = useCallback(
    (id: string) =>
      commit('variant:del:' + id, (p) => {
        if (p.variants.length <= 1) return p;
        const variants = p.variants.filter((v) => v.id !== id);
        return { ...p, variants, activeVariantId: p.activeVariantId === id ? variants[0].id : p.activeVariantId };
      }),
    [commit],
  );

  const restoreDefaults = useCallback(
    (scope: 'variant' | 'project') =>
      commit('restore:' + uid(), (p) => {
        if (scope === 'project') {
          const fresh = defaultProject();
          return { ...fresh, name: p.name };
        }
        const seed = initialVariants().find((v) => v.id === p.activeVariantId);
        return mapActive(p, (v) => ({ ...v, design: seed ? seed.design : defaultDesign(), updatedAt: Date.now() }));
      }),
    [commit],
  );

  const replaceProject = useCallback((next: Project) => commit('replace:' + uid(), () => next), [commit]);

  const projectRef = useRef(project);
  projectRef.current = project;

  const save = useCallback((): SaveState => {
    const res = saveProject(projectRef.current);
    const s: SaveState = res.ok ? { status: 'saved', at: res.at } : storageStatus() === 'unavailable' ? { status: 'unavailable' } : { status: 'error', reason: res.reason };
    setSaveState(s);
    return s;
  }, []);

  // Autosave (debounced, ref-based timer)
  const first = useRef(true);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (storageStatus() === 'available' && boot.kind !== 'loaded') save(); // persist fresh/default project right away
      return;
    }
    if (storageStatus() === 'unavailable') return;
    setSaveState({ status: 'dirty' });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(), 900);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [project, save, boot.kind]);

  // Flush on unload
  useEffect(() => {
    const flush = () => {
      if (storageStatus() === 'available') saveProject(projectRef.current);
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  /* ---------- UI state ---------- */
  const [selected, setSelected] = useState<CompId | null>(null);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [tab, setTab] = useState<InspectorTab>('geometry');
  const [view, setViewState] = useState<ViewSettings>(() => ({ ...DEFAULT_VIEW, ...(loadView() ?? {}) }));
  const [presentation, setPresentation] = useState(false);
  const [compare, setCompareState] = useState<CompareState>(() => ({
    on: false,
    a: project.variants[0]?.id ?? '',
    b: project.variants[1]?.id ?? project.variants[0]?.id ?? '',
  }));
  const [galleryOpen, setGalleryOpen] = useState(true);

  const setView = useCallback((patch: Partial<ViewSettings>) => {
    setViewState((v) => {
      const n = { ...v, ...patch };
      saveView(n);
      return n;
    });
  }, []);
  const setCompare = useCallback((c: Partial<CompareState>) => setCompareState((s) => ({ ...s, ...c })), []);

  const select = useCallback((id: CompId | null) => {
    setSelected(id);
    if (id !== 'logo') setSelectedMark(null);
    if (id === 'logo') setTab('branding');
    else setTab((t) => resolveTab(id, t) ?? t);
  }, []);

  const selectMark = useCallback((id: string | null) => {
    setSelectedMark(id);
    if (id) {
      setSelected('logo');
      setTab('branding');
    }
  }, []);

  const updateMarks = useCallback(
    (key: string, fn: (m: BrandMark[]) => BrandMark[]) =>
      commit(key, (p) =>
        editActive(
          p,
          (v) => {
            const marks = fn(v.design.marks);
            return marks === v.design.marks ? v : { ...v, design: { ...v.design, marks }, updatedAt: Date.now() };
          },
          () => 'v-' + uid(),
        ),
      ),
    [commit],
  );

  const applyTeaser = useCallback(
    (placement: TeaserPlacement) =>
      commit('teaser:' + uid(), (p) => {
        const src = p.variants.find((v) => v.id === 'v-graphite') ?? p.variants[0];
        const design = structuredClone(src.design);
        design.body = materialFromPreset('matteGraphite');
        design.trim = trimFor('blackTitanium');
        const marks: BrandMark[] = [];
        if (placement.wordmark) marks.push({ ...wordmarkMark(placement.wordmark.x, placement.wordmark.y), id: 'm-wordmark' });
        if (placement.earth) marks.push({ ...earthMark(placement.earth.x, placement.earth.y), id: 'm-earth' });
        if (placement.initials) marks.push({ ...initialsMark(placement.initials.x, placement.initials.y), id: 'm-initials' });
        for (const f of placement.features ?? []) marks.push({ ...featureMark(f.id, f.x, f.y), id: newMarkId() });
        design.marks = marks.slice(0, MAX_MARKS);
        const v: Variant = {
          id: 'v-' + uid(),
          name: 'Landing design',
          note: 'Placed on the homepage. The original presets are unchanged.',
          design,
          updatedAt: Date.now(),
        };
        return { ...p, variants: [...p.variants, v], activeVariantId: v.id };
      }),
    [commit],
  );

  const addMarks = useCallback(
    (incoming: Omit<BrandMark, 'id'>[]) => {
      const ids = incoming.map(() => newMarkId());
      updateMarks('mark:add:' + ids[0], (ms) => [...ms, ...incoming.map((m, i) => ({ ...m, id: ids[i] }))].slice(0, MAX_MARKS));
      if (ids.length) selectMark(ids[ids.length - 1]);
      return ids;
    },
    [updateMarks, selectMark],
  );

  const updateMark = useCallback(
    (id: string, key: string, patch: Partial<BrandMark>) =>
      updateMarks(`mark:${key}:${id}`, (ms) => (ms.some((m) => m.id === id) ? ms.map((m) => (m.id === id ? { ...m, ...patch, id } : m)) : ms)),
    [updateMarks],
  );

  const removeMark = useCallback(
    (id: string) => {
      updateMarks('mark:del:' + id, (ms) => (ms.some((m) => m.id === id) ? ms.filter((m) => m.id !== id) : ms));
      setSelectedMark((s) => (s === id ? null : s));
    },
    [updateMarks],
  );

  const duplicateMark = useCallback(
    (id: string) => {
      const nid = newMarkId();
      updateMarks('mark:dup:' + nid, (ms) => {
        const i = ms.findIndex((m) => m.id === id);
        if (i < 0 || ms.length >= MAX_MARKS) return ms;
        const src = ms[i];
        const copy: BrandMark = { ...src, id: nid, name: `${src.name} copy`.slice(0, 60), locked: false, x: +(src.x + 2).toFixed(1), y: +(src.y - 2).toFixed(1) };
        const out = [...ms];
        out.splice(i + 1, 0, copy);
        return out;
      });
      selectMark(nid);
    },
    [updateMarks, selectMark],
  );

  const moveMark = useCallback(
    (id: string, dir: -1 | 1) =>
      updateMarks('mark:order:' + id, (ms) => {
        const i = ms.findIndex((m) => m.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= ms.length) return ms;
        const out = [...ms];
        [out[i], out[j]] = [out[j], out[i]];
        return out;
      }),
    [updateMarks],
  );

  // Drop a stale mark selection after undo / variant switch / import
  useEffect(() => {
    if (selectedMark && !variant.design.marks.some((m) => m.id === selectedMark)) setSelectedMark(null);
  }, [variant.design.marks, selectedMark]);

  // Keep compare targets valid
  useEffect(() => {
    const ids = project.variants.map((v) => v.id);
    setCompareState((c) => ({
      ...c,
      a: ids.includes(c.a) ? c.a : ids[0],
      b: ids.includes(c.b) ? c.b : ids[Math.min(1, ids.length - 1)],
    }));
  }, [project.variants]);

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const gesture = useCallback((op: 'begin' | 'end' | 'cancel') => dispatch({ type: 'gesture', op }), []);

  const value = useMemo<StudioCtx>(
    () => ({
      project,
      variant,
      design: variant.design,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      undo,
      redo,
      gesture,
      updateDesign,
      updateProject,
      setActiveVariant,
      duplicateVariant,
      saveAsVariant,
      renameVariant,
      deleteVariant,
      restoreDefaults,
      replaceProject,
      save,
      saveState,
      bootNotice: boot,
      selected,
      select,
      selectedMark,
      selectMark,
      addMarks,
      updateMark,
      removeMark,
      duplicateMark,
      moveMark,
      tab,
      setTab,
      view,
      setView,
      presentation,
      setPresentation,
      compare,
      setCompare,
      galleryOpen,
      setGalleryOpen,
      applyTeaser,
    }),
    [project, variant, state.past.length, state.future.length, undo, redo, gesture, updateDesign, updateProject, setActiveVariant, duplicateVariant, saveAsVariant, renameVariant, deleteVariant, restoreDefaults, replaceProject, save, saveState, boot, selected, select, selectedMark, selectMark, addMarks, updateMark, removeMark, duplicateMark, moveMark, tab, view, setView, presentation, compare, setCompare, galleryOpen, applyTeaser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
