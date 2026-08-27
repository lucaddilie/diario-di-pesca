export interface Profile {
  id: string
  displayName: string
}

export type SyncStatus = 'pending' | 'synced'

/** A catch as stored locally in IndexedDB, before (or after) syncing to Supabase. */
export interface LocalCatch {
  /** Generated on-device, used as the stable identity across the whole sync flow. */
  clientId: string
  userId: string
  species: string
  caughtAt: string
  latitude: number | null
  longitude: number | null
  photoBlob: Blob
  syncStatus: SyncStatus
  createdAt: string
}

/** A catch as stored in the `catches` table on Supabase. */
export interface RemoteCatch {
  id: string
  userId: string
  clientId: string
  species: string
  caughtAt: string
  latitude: number | null
  longitude: number | null
  photoPath: string
  createdAt: string
}
