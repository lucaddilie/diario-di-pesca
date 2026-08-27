import { useState, type CSSProperties, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    setSubmitting(false)

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Email o password errati.'
          : 'Impossibile accedere. Controlla la connessione e riprova.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h1 style={{ textAlign: 'center', margin: 0 }}>🎣 Diario di Pesca</h1>
      <label style={labelStyle}>
        Email
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={inputStyle}
        />
      </label>
      {error && (
        <p role="alert" style={{ color: '#b00020', margin: 0, fontSize: '0.9rem' }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? 'Accesso in corso…' : 'Accedi'}
      </button>
    </form>
  )
}

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.9rem',
  width: '100%',
  maxWidth: '320px',
}

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  fontSize: '0.9rem',
  color: '#333',
}

const inputStyle: CSSProperties = {
  padding: '0.65rem',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: '6px',
}

const buttonStyle: CSSProperties = {
  padding: '0.8rem',
  fontSize: '1rem',
  fontWeight: 600,
  color: 'white',
  background: 'var(--color-primary)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}
