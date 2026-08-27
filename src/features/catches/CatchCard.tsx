import type { CSSProperties } from 'react'
import type { FeedItem } from './useFeed'

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function CatchCard({ item }: { item: FeedItem }) {
  return (
    <article style={cardStyle}>
      <img src={item.photoUrl} alt={item.species} style={imageStyle} />
      <div style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
          <strong>{item.species}</strong>
          <SyncBadge status={item.syncStatus} />
        </div>
        <p style={metaStyle}>
          {item.authorName} · {dateFormatter.format(new Date(item.caughtAt))}
        </p>
        {item.latitude !== null && item.longitude !== null && (
          <p style={metaStyle}>
            📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </p>
        )}
      </div>
    </article>
  )
}

function SyncBadge({ status }: { status: 'pending' | 'synced' }) {
  const isPending = status === 'pending'
  return (
    <span
      style={{
        flexShrink: 0,
        fontSize: '0.7rem',
        fontWeight: 600,
        padding: '0.15rem 0.5rem',
        borderRadius: '999px',
        color: 'white',
        background: isPending ? 'var(--color-pending)' : 'var(--color-synced)',
      }}
    >
      {isPending ? 'in coda' : 'sincronizzato'}
    </span>
  )
}

const cardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '10px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  textAlign: 'left',
}

const imageStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '4 / 3',
  objectFit: 'cover',
  display: 'block',
}

const metaStyle: CSSProperties = {
  margin: '0.25rem 0 0',
  fontSize: '0.8rem',
  color: '#666',
}
