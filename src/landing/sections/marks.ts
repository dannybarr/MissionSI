import claudeUrl from 'simple-icons/icons/claude.svg?raw'
import geminiUrl from 'simple-icons/icons/googlegemini.svg?raw'
import metaUrl from 'simple-icons/icons/meta.svg?raw'
import mistralUrl from 'simple-icons/icons/mistralai.svg?raw'
import perplexityUrl from 'simple-icons/icons/perplexity.svg?raw'
import deepseekUrl from 'simple-icons/icons/deepseek.svg?raw'
import cursorUrl from 'simple-icons/icons/cursor.svg?raw'
import ollamaUrl from 'simple-icons/icons/ollama.svg?raw'
import hfUrl from 'simple-icons/icons/huggingface.svg?raw'
import appleUrl from 'simple-icons/icons/apple.svg?raw'

/** Official Simple Icons marks (CC0), plus a few brands that package does not ship. */
export interface AgentMark {
  id: string
  name: string
  /** Ribbon cloth colour. */
  cloth: string
  /** Logo ink on that cloth. */
  ink: string
  svg: string
  source: string
}

function raw(svg: string) {
  return svg.replace(/<title>[\s\S]*?<\/title>/, '')
}

const OPENAI = raw(`<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zm-9.02 12.61a4.48 4.48 0 0 1-2.88-1.03l.14-.08 4.78-2.76a.78.78 0 0 0 .39-.67v-6.74l2.02 1.17a.1.1 0 0 1 .05.05v5.58a4.5 4.5 0 0 1-4.5 4.48z"/></svg>`)

const XAI = raw(`<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.2 3.2h3.1L12 10.2 17.7 3.2H21L13.6 12 21 20.8h-3.2L12 13.8 6.4 20.8H3.2L10.4 12 3.2 3.2z"/></svg>`)

const MANUS = raw(`<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 6.2h2.1l2.4 7.2 2.5-7.2H13l-3.6 10.2H7.2L4 6.2zm9.2 0H20v1.8h-4.6v2h4.1v1.7h-4.1v2.8h4.8V16h-7V6.2z"/></svg>`)

const COPILOT = raw(`<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#7b5cff" d="M8 14.5c0-2.6 2-4.2 4.6-4.2 1.5 0 2.6.5 3.4 1.3-1 .7-1.6 1.7-1.6 2.9 0 2.2 1.8 3.8 4.1 3.8 1.2 0 2.2-.4 3-.9-.6 2.2-2.6 4.1-5.6 4.1C11.2 21.5 8 18.6 8 14.5z"/><path fill="#2f6bff" d="M14.2 4.2c2.4 0 4.3 1.6 4.8 3.6-1 .4-1.8 1-2.3 1.8-.5-1.6-1.8-2.6-3.5-2.6-2.2 0-3.7 1.6-3.7 3.7 0 .5.1 1 .2 1.4C8.4 11.4 7.4 10.6 7 9.6c.6-3.1 3.4-5.4 7.2-5.4z"/><path fill="#1f9d6a" d="M6.2 9.8c.8.6 1.8 1 2.9 1.1-.2.6-.3 1.2-.3 1.9 0 2.4 1.6 4.3 3.8 5-1 .9-2.3 1.5-3.8 1.5-3.2 0-5.6-2.4-5.6-5.7 0-2.2 1.2-4 3-4.8z"/></svg>`)

export const AGENT_MARKS: AgentMark[] = [
  { id: 'claude', name: 'Claude', cloth: '#c4684a', ink: '#fff8f4', svg: raw(claudeUrl), source: 'Simple Icons (Claude)' },
  { id: 'chatgpt', name: 'ChatGPT', cloth: '#171717', ink: '#f4f4f2', svg: OPENAI, source: 'OpenAI blossom mark' },
  { id: 'grok', name: 'Grok', cloth: '#111111', ink: '#f7f7f5', svg: XAI, source: 'xAI wordmark constructed as an X' },
  { id: 'gemini', name: 'Gemini', cloth: '#8e75b2', ink: '#ffffff', svg: raw(geminiUrl), source: 'Simple Icons (Google Gemini)' },
  { id: 'meta', name: 'Meta AI', cloth: '#0668e1', ink: '#ffffff', svg: raw(metaUrl), source: 'Simple Icons (Meta)' },
  { id: 'mistral', name: 'Mistral', cloth: '#fa520f', ink: '#fff7f2', svg: raw(mistralUrl), source: 'Simple Icons (Mistral AI)' },
  { id: 'perplexity', name: 'Perplexity', cloth: '#1b8f9e', ink: '#f3fffe', svg: raw(perplexityUrl), source: 'Simple Icons (Perplexity)' },
  { id: 'manus', name: 'Manus', cloth: '#2a2a2c', ink: '#f4f4f2', svg: MANUS, source: 'Wordmark — no Simple Icons entry' },
  { id: 'deepseek', name: 'DeepSeek', cloth: '#4d6bfe', ink: '#ffffff', svg: raw(deepseekUrl), source: 'Simple Icons (DeepSeek)' },
  { id: 'copilot', name: 'Copilot', cloth: '#f4f1ea', ink: '#1a1a1a', svg: COPILOT, source: 'Microsoft Copilot ribbon, simplified' },
  { id: 'cursor', name: 'Cursor', cloth: '#1c1c1c', ink: '#f5f5f3', svg: raw(cursorUrl), source: 'Simple Icons (Cursor)' },
  { id: 'ollama', name: 'Ollama', cloth: '#f2f2f0', ink: '#141414', svg: raw(ollamaUrl), source: 'Simple Icons (Ollama)' },
  { id: 'hf', name: 'Hugging Face', cloth: '#ffd21e', ink: '#1a1a1a', svg: raw(hfUrl), source: 'Simple Icons (Hugging Face)' },
  { id: 'apple', name: 'Apple Intelligence', cloth: '#e8e8ea', ink: '#111111', svg: raw(appleUrl), source: 'Simple Icons (Apple)' },
]

/** Extra ribbons so the cluster reads as dense as the reference, reusing marks. */
export const FLAG_LAYOUT: { mark: number; top: string; width: string; delay: number; rot: number }[] = [
  { mark: 0, top: '6%', width: '58%', delay: 0, rot: -2.2 },
  { mark: 1, top: '11%', width: '72%', delay: 0.05, rot: 1.4 },
  { mark: 2, top: '17%', width: '64%', delay: 0.1, rot: -1.1 },
  { mark: 3, top: '22%', width: '80%', delay: 0.04, rot: 2.1 },
  { mark: 4, top: '28%', width: '62%', delay: 0.12, rot: -2.6 },
  { mark: 5, top: '33%', width: '76%', delay: 0.08, rot: 0.6 },
  { mark: 6, top: '39%', width: '68%', delay: 0.16, rot: -1.6 },
  { mark: 7, top: '44%', width: '84%', delay: 0.06, rot: 1.8 },
  { mark: 8, top: '50%', width: '60%', delay: 0.14, rot: -0.4 },
  { mark: 9, top: '55%', width: '74%', delay: 0.09, rot: 2.4 },
  { mark: 10, top: '61%', width: '66%', delay: 0.18, rot: -2 },
  { mark: 11, top: '66%', width: '82%', delay: 0.03, rot: 0.8 },
  { mark: 12, top: '72%', width: '63%', delay: 0.11, rot: -1.4 },
  { mark: 13, top: '78%', width: '78%', delay: 0.15, rot: 1.2 },
  { mark: 1, top: '84%', width: '70%', delay: 0.07, rot: -2.4 },
  { mark: 5, top: '14%', width: '52%', delay: 0.2, rot: 3 },
]
