import { Component, type ReactNode } from 'react';
import { MonitorX } from 'lucide-react';

export type WebGLSupport = { ok: true; version: 2 | 1 } | { ok: false; reason: string };

let cached: WebGLSupport | null = null;

/** Probe once for a usable WebGL context (prefers WebGL2). */
export function detectWebGL(): WebGLSupport {
  if (cached) return cached;
  try {
    const c = document.createElement('canvas');
    const gl2 = c.getContext('webgl2');
    if (gl2) {
      gl2.getExtension('WEBGL_lose_context')?.loseContext();
      return (cached = { ok: true, version: 2 });
    }
    const gl1 = c.getContext('webgl');
    if (gl1) {
      gl1.getExtension('WEBGL_lose_context')?.loseContext();
      return (cached = { ok: true, version: 1 });
    }
    return (cached = { ok: false, reason: 'This browser could not create a WebGL context.' });
  } catch (e) {
    return (cached = { ok: false, reason: e instanceof Error ? e.message : 'WebGL initialisation failed.' });
  }
}

export function markWebGLFailed(reason: string) {
  cached = { ok: false, reason };
}

export function ViewportUnavailable({ reason, onRetry }: { reason: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex h-full w-full items-start justify-center overflow-y-auto px-5 pb-6 pt-20 md:items-center md:p-8" data-testid="status-webgl-unavailable">
      <div className="max-w-[380px] rounded-[8px] border border-black/10 bg-[#101113]/95 p-5 text-[#e9e6df] shadow-[0_20px_40px_-24px_rgba(16,17,19,0.6)]">
        <MonitorX className="h-5 w-5 text-[#ff6a2b]" />
        <h2 className="mt-3 text-[14px] font-medium tracking-[-0.01em]">3D viewport needs hardware-accelerated WebGL</h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#a9a6a0]">
          Mission Studio renders the card as live WebGL2 geometry. Enable hardware acceleration in your browser settings, update graphics drivers, or open
          the studio in a current Chrome, Edge, Firefox or Safari.
        </p>
        <p className="mono mt-3 break-words text-[10.5px] text-[#6c6a66]" data-testid="text-webgl-reason">
          {reason}
        </p>
        <p className="mt-3 text-[11px] text-[#85827d]">Layers, inspector, variants, JSON import/export and saving still work. Render and GLB export need the viewport.</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 h-7 rounded-[5px] border border-white/[0.12] px-3 text-[11.5px] text-[#e9e6df] hover:bg-white/5"
            data-testid="button-retry-webgl"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

interface BoundaryState {
  error: string | null;
}

/** Scoped boundary: a renderer failure replaces only the viewport, never the studio chrome. */
export class ViewportBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };
  static getDerivedStateFromError(e: unknown): BoundaryState {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  componentDidCatch(e: unknown) {
    console.warn('[Mission Studio] viewport failed', e);
  }
  render() {
    if (this.state.error) {
      return (
        <ViewportUnavailable
          reason={this.state.error}
          onRetry={() => {
            cached = null;
            this.setState({ error: null });
          }}
        />
      );
    }
    return this.props.children;
  }
}
