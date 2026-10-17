import { useState } from 'react'
import GlassFolder, { type FolderFile } from '@/components/ui/glass-folder-cards'

const ANSWERS: Record<string, { q: string; a: string }> = {
  agents: {
    q: 'Which agents support MCP today?',
    a: 'Claude Desktop is the strongest path: a local MCP connector. Other apps that speak local MCP can connect, and the quality depends on the app. ChatGPT and Grok depend on the connector support that provider has shipped for your plan and platform. There is no universal integration.',
  },
  import: {
    q: 'Can I import memory from another assistant?',
    a: 'Not in one click. Bringing existing memory in starts with that provider’s own data export, then a local import. We will not pretend otherwise.',
  },
  session: {
    q: 'What does an agent still see during a session?',
    a: 'Only the memory you grant, packed into that session. What a remote agent receives, it receives — its provider may retain it. Unplugging stops future access. It does not pull back anything already shared. Prefer temporary chats where an agent offers them.',
  },
  log: {
    q: 'Where is the audit log?',
    a: 'Every grant, refusal and share is written to a local audit log you can read. It stays on your machine, with the memory.',
  },
  cloud: {
    q: 'Is anything stored in the cloud?',
    a: 'No. The encrypted source of truth sits on your device. There is no Mission server holding a copy.',
  },
  hardware: {
    q: 'When does the card ship?',
    a: 'It doesn’t, yet. The custom card, with its built-in USB-C connector, is a concept. Nothing has been manufactured, and there is no ship date. Software comes first, and it is still in development.',
  },
  orders: {
    q: 'Can I order one?',
    a: 'No. We are not taking orders or deposits. The founding target for the custom hardware is £249. That is a target, not a checkout.',
  },
}

const AGENT_FILES: FolderFile[] = [
  { name: 'Which agents work today?', meta: 'Q&A' },
  { name: 'Importing old memory', meta: 'Q&A' },
]
const PRIVACY_FILES: FolderFile[] = [
  { name: 'What a session sees', meta: 'Q&A' },
  { name: 'The audit log', meta: 'Q&A' },
  { name: 'Nothing in the cloud', meta: 'Q&A' },
]
const MORE_FILES: FolderFile[] = [
  { name: 'Hardware', meta: 'Soon' },
  { name: 'Orders', meta: 'Not yet' },
]

const KEYS = ['agents', 'import', 'session', 'log', 'cloud', 'hardware', 'orders'] as const

export function Faq() {
  const [open, setOpen] = useState<string>('cloud')
  const answer = ANSWERS[open]

  const pick = (folder: 'agent' | 'privacy' | 'more', index: number) => {
    const map = {
      agent: ['agents', 'import'],
      privacy: ['session', 'log', 'cloud'],
      more: ['hardware', 'orders'],
    } as const
    setOpen(map[folder][index] ?? map[folder][0])
  }

  return (
    <section className="faq" id="faq">
      <div className="faq-head">
        <p className="eyebrow">Questions</p>
        <h2>Open a folder.</h2>
        <p>Short answers, the same ones we would give in person. Hover a folder, click to open it, then choose a file.</p>
      </div>
      <div className="faq-row">
        <GlassFolder
          label="Agent-agnostic memory"
          art="glacier"
          seed={4}
          action="none"
          files={AGENT_FILES}
          onFileSelect={(_, i) => pick('agent', i)}
          appearDelay={0}
        />
        <GlassFolder
          label="Privacy & security"
          art="aurora"
          seed={9}
          action="none"
          files={PRIVACY_FILES}
          onFileSelect={(_, i) => pick('privacy', i)}
          appearDelay={120}
        />
        <GlassFolder
          label="More soon"
          meta="Placeholder"
          art="none"
          action="none"
          files={MORE_FILES}
          onFileSelect={(_, i) => pick('more', i)}
          appearDelay={240}
        />
      </div>
      {answer && (
        <article className="faq-answer" aria-live="polite">
          <h3>{answer.q}</h3>
          <p>{answer.a}</p>
        </article>
      )}
      <ul className="sr-only">
        {KEYS.map((k) => (
          <li key={k}>
            {ANSWERS[k].q} {ANSWERS[k].a}
          </li>
        ))}
      </ul>
    </section>
  )
}
