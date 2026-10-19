import { useState, type FormEvent } from 'react'
import { submitWaitlist } from '@/landing/api/waitlist.functions'
import { Magnetic } from '@/landing/components/Magnetic'

type Status = 'idle' | 'sending' | 'saved' | 'not_configured' | 'error'

export function Close() {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const email = String(data.get('email') || '').trim()
    const name = String(data.get('name') || '').trim()
    const use = String(data.get('use') || '').trim()
    if (!email) return
    setStatus('sending')
    setMessage('')
    try {
      const res = await submitWaitlist({
        data: { email, name: name || undefined, use: use || undefined, source: 'landing' },
      })
      if (res.ok) {
        setStatus('saved')
        setMessage('Saved. This is not an order. We’ll write when there is something real to say.')
        form.reset()
        return
      }
      if (res.error === 'not_configured') {
        setStatus('not_configured')
        setMessage('Not saved. Waitlist storage is not connected yet — see the TODO on the server route. Nothing was stored, and this is not a signup.')
        return
      }
      setStatus('error')
      setMessage('That didn’t go through. Nothing was stored. Try again in a moment.')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'That didn’t go through. Nothing was stored.')
    }
  }

  return (
    <section className="close" id="reserve">
      <div className="close-copy">
        <p className="eyebrow" data-reveal>
          <i /> Founding list
        </p>
        <h2 data-split>Carry your own memory.</h2>
        <p data-reveal>
          Founding target £249 for the custom card. We are not taking orders, deposits or reservations, and there is no ship date. Leave an email if you want to hear when that changes.
        </p>
        <Magnetic>
          <a className="btn btn-ink" href="/studio">
            Design and reserve yours <span aria-hidden="true">→</span>
          </a>
        </Magnetic>
      </div>
      <form className="waitlist" onSubmit={onSubmit} noValidate={false} data-reveal>
        <h3>Waitlist</h3>
        <label>
          <span className="lbl">
            Name <span>(optional)</span>
          </span>
          <input name="name" type="text" autoComplete="name" maxLength={80} />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" maxLength={160} />
        </label>
        <label>
          What would you use it for?
          <textarea name="use" rows={3} maxLength={500} />
        </label>
        <button className="btn btn-ink" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Join the waitlist'}
        </button>
        <p className={`form-status ${status}`} role="status">
          {message}
        </p>
        <p className="form-fine">No account is created. We don’t sell the address. If storage isn’t configured, the form says so instead of pretending it worked.</p>
      </form>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Mission</strong>
        <p>amission.si. A personal AI memory you own. No accounts, no tracking on this page.</p>
      </div>
      <div>
        <strong>Imagery</strong>
        <p>
          Earth photograph: NASA, The Blue Marble. Everyday-carry tray: supplied reference photograph. MacBook Pro and iPhone: Apple product photography, used illustratively without affiliation. Mission card: concept rendering, not manufactured hardware. Full list in IMAGE_CREDITS.md.
        </p>
      </div>
      <div>
        <strong>On this page</strong>
        <p>
          <a href="#how">How it works</a> · <a href="#agents">Agents</a> · <a href="#faq">Questions</a> · <a href="/studio">Studio</a>
        </p>
      </div>
      <p className="footer-mark">Mission</p>
    </footer>
  )
}
