import { useCallback, useState, type CSSProperties, type ReactNode } from 'react'
import { LoginForm } from './features/auth/LoginForm'
import { useProfile } from './features/auth/useProfile'
import { useSession } from './features/auth/useSession'
import { CatchFeed } from './features/catches/CatchFeed'
import { NewCatchForm } from './features/catches/NewCatchForm'
import { useFeed } from './features/catches/useFeed'
import { useSync } from './features/catches/useSync'
import { db } from './lib/db'
import { supabase } from './lib/supabase'

function App() {
  const { session, loading } = useSession()

  if (loading) {
    return <Centered>Caricamento…</Centered>
  }

  if (!session) {
    return (
      <Centered>
        <LoginForm />
      </Centered>
    )
  }

  return (
    <Centered>
      <AuthenticatedHome userId={session.user.id} />
    </Centered>
  )
}

function AuthenticatedHome({ userId }: { userId: string }) {
  const displayName = useProfile(userId)
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  const { items: feedItems, loading: feedLoading, refresh: refreshFeed } = useFeed(displayName)

  const refreshPendingCount = useCallback(() => {
    db.catches
      .where('syncStatus')
      .equals('pending')
      .count()
      .then(setPendingCount)
  }, [])

  const handleDataChanged = useCallback(() => {
    refreshPendingCount()
    refreshFeed()
  }, [refreshPendingCount, refreshFeed])

  const { syncing, lastSyncFailed, runSync } = useSync(handleDataChanged)

  function handleSaved() {
    handleDataChanged()
    runSync()
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span>Ciao{displayName ? `, ${displayName}` : ''}!</span>
        <button onClick={() => supabase.auth.signOut()} style={logoutButtonStyle}>
          Esci
        </button>
      </div>

      <NewCatchForm userId={userId} onSaved={handleSaved} />

      {pendingCount !== null && (
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
            {pendingCount === 0
              ? 'Tutte le catture sono sincronizzate.'
              : `${pendingCount} cattur${pendingCount === 1 ? 'a' : 'e'} in coda${
                  syncing ? ', sincronizzazione in corso…' : '.'
                }`}
          </p>

          {lastSyncFailed && (
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--color-pending)' }}>
              Sincronizzazione non riuscita per alcune catture. Verranno ritentate.
            </p>
          )}

          {pendingCount > 0 && (
            <button onClick={() => runSync()} disabled={syncing} style={secondaryButtonStyle}>
              {syncing ? 'Sincronizzazione…' : 'Sincronizza ora'}
            </button>
          )}
        </div>
      )}

      <CatchFeed items={feedItems} loading={feedLoading} onRefresh={refreshFeed} />
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <main style={mainStyle}>{children}</main>
}

const mainStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '100dvh',
  padding: '3rem 1.5rem',
  color: 'var(--color-primary)',
  overflowY: 'auto',
}

const secondaryButtonStyle: CSSProperties = {
  marginTop: '0.6rem',
  padding: '0.5rem 1rem',
  fontSize: '0.85rem',
  color: 'var(--color-primary)',
  background: 'transparent',
  border: '1px solid var(--color-primary)',
  borderRadius: '6px',
  cursor: 'pointer',
}

const logoutButtonStyle: CSSProperties = {
  padding: '0.6rem 1.2rem',
  fontSize: '0.95rem',
  color: 'var(--color-primary)',
  background: 'transparent',
  border: '1px solid var(--color-primary)',
  borderRadius: '6px',
  cursor: 'pointer',
}

export default App
