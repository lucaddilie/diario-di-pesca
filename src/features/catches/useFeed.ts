import { useCallback, useEffect, useRef, useState } from 'react'
import { db } from '../../lib/db'
import { supabase } from '../../lib/supabase'

export interface FeedItem {
  clientId: string
  species: string
  caughtAt: string
  authorName: string
  photoUrl: string
  syncStatus: 'pending' | 'synced'
  latitude: number | null
  longitude: number | null
}

interface RemoteCatchRow {
  client_id: string
  species: string
  caught_at: string
  photo_path: string
  latitude: number | null
  longitude: number | null
  profiles: { display_name: string } | null
}

async function loadRemoteItems(): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from('catches')
    .select('client_id, species, caught_at, photo_path, latitude, longitude, profiles(display_name)')
    .order('caught_at', { ascending: false })
    .returns<RemoteCatchRow[]>()

  if (error || !data) return []

  return data.map((row) => ({
    clientId: row.client_id,
    species: row.species,
    caughtAt: row.caught_at,
    authorName: row.profiles?.display_name ?? 'Utente',
    photoUrl: supabase.storage.from('catch-photos').getPublicUrl(row.photo_path).data.publicUrl,
    syncStatus: 'synced',
    latitude: row.latitude,
    longitude: row.longitude,
  }))
}

async function loadLocalPendingItems(currentUserDisplayName: string): Promise<FeedItem[]> {
  const items = await db.catches.where('syncStatus').equals('pending').toArray()

  return items.map((item) => ({
    clientId: item.clientId,
    species: item.species,
    caughtAt: item.caughtAt,
    authorName: currentUserDisplayName,
    photoUrl: URL.createObjectURL(item.photoBlob),
    syncStatus: 'pending',
    latitude: item.latitude,
    longitude: item.longitude,
  }))
}

/** Merges catches already on Supabase with catches still queued on this device. */
export function useFeed(currentUserDisplayName: string | null) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const objectUrlsRef = useRef<string[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)

    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url)
    objectUrlsRef.current = []

    const [remoteItems, localItems] = await Promise.all([
      loadRemoteItems(),
      loadLocalPendingItems(currentUserDisplayName ?? 'Tu'),
    ])

    for (const item of localItems) objectUrlsRef.current.push(item.photoUrl)

    const byClientId = new Map<string, FeedItem>()
    for (const item of remoteItems) byClientId.set(item.clientId, item)
    for (const item of localItems) if (!byClientId.has(item.clientId)) byClientId.set(item.clientId, item)

    setItems(
      [...byClientId.values()].sort(
        (a, b) => new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime(),
      ),
    )
    setLoading(false)
  }, [currentUserDisplayName])

  useEffect(() => {
    refresh()
    return () => {
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url)
    }
  }, [refresh])

  return { items, loading, refresh }
}
