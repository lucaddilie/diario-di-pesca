import { useCallback, useEffect, useRef, useState } from 'react'
import { db } from '../../lib/db'
import { supabase } from '../../lib/supabase'

export interface FeedItem {
  /** Server row id, null for catches not yet synced. */
  id: string | null
  clientId: string
  userId: string
  species: string
  caughtAt: string
  authorName: string
  photoUrl: string
  photoPath: string | null
  syncStatus: 'pending' | 'synced'
  latitude: number | null
  longitude: number | null
}

interface RemoteCatchRow {
  id: string
  user_id: string
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
    .select('id, user_id, client_id, species, caught_at, photo_path, latitude, longitude, profiles(display_name)')
    .order('caught_at', { ascending: false })
    .returns<RemoteCatchRow[]>()

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    userId: row.user_id,
    species: row.species,
    caughtAt: row.caught_at,
    authorName: row.profiles?.display_name ?? 'Utente',
    photoUrl: supabase.storage.from('catch-photos').getPublicUrl(row.photo_path).data.publicUrl,
    photoPath: row.photo_path,
    syncStatus: 'synced',
    latitude: row.latitude,
    longitude: row.longitude,
  }))
}

async function loadLocalPendingItems(currentUserDisplayName: string): Promise<FeedItem[]> {
  const items = await db.catches.where('syncStatus').equals('pending').toArray()

  return items.map((item) => ({
    id: null,
    clientId: item.clientId,
    userId: item.userId,
    species: item.species,
    caughtAt: item.caughtAt,
    authorName: currentUserDisplayName,
    photoUrl: URL.createObjectURL(item.photoBlob),
    photoPath: null,
    syncStatus: 'pending',
    latitude: item.latitude,
    longitude: item.longitude,
  }))
}

/** Deletes a catch: from Supabase (row + photo) if synced, or just the local queue if still pending. */
export async function deleteCatch(item: FeedItem): Promise<void> {
  if (item.syncStatus === 'pending') {
    await db.catches.delete(item.clientId)
    return
  }

  if (item.photoPath) {
    await supabase.storage.from('catch-photos').remove([item.photoPath])
  }
  if (item.id) {
    await supabase.from('catches').delete().eq('id', item.id)
  }
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
