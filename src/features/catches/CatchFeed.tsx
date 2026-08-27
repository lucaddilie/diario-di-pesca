import type { CSSProperties } from 'react'
import { CatchCard } from './CatchCard'
import type { FeedItem } from './useFeed'

export function CatchFeed({
  items,
  loading,
  currentUserId,
  onRefresh,
  onDelete,
}: {
  items: FeedItem[]
  loading: boolean
  currentUserId: string
  onRefresh: () => void
  onDelete: (item: FeedItem) => void
}) {
  return (
    <section style={{ marginTop: '2rem', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Catture recenti</h2>
        <button onClick={onRefresh} disabled={loading} style={refreshButtonStyle}>
          {loading ? 'Aggiorno…' : 'Aggiorna'}
        </button>
      </div>

      {!loading && items.length === 0 && (
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Nessuna cattura ancora. Registra la prima!</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {items.map((item) => (
          <CatchCard
            key={item.clientId}
            item={item}
            isOwn={item.userId === currentUserId}
            onDelete={() => onDelete(item)}
          />
        ))}
      </div>
    </section>
  )
}

const refreshButtonStyle: CSSProperties = {
  padding: '0.35rem 0.8rem',
  fontSize: '0.8rem',
  color: 'var(--color-primary)',
  background: 'transparent',
  border: '1px solid var(--color-primary)',
  borderRadius: '6px',
  cursor: 'pointer',
}
