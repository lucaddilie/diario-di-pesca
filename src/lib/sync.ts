import { db } from './db'
import { supabase } from './supabase'
import type { LocalCatch } from '../types'

export interface SyncResult {
  attempted: number
  succeeded: number
  failed: number
}

async function syncOne(item: LocalCatch): Promise<boolean> {
  const photoPath = `${item.userId}/${item.clientId}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('catch-photos')
    .upload(photoPath, item.photoBlob, { contentType: 'image/jpeg' })

  // "already exists" means a previous sync attempt uploaded the photo but didn't
  // finish (e.g. the app closed before the local record was cleared) — safe to continue
  const alreadyUploaded = uploadError && 'statusCode' in uploadError && uploadError.statusCode === '409'
  if (uploadError && !alreadyUploaded) return false

  // upsert on client_id: if a previous sync uploaded the photo but the app
  // closed before the local record was cleared, this retries safely without duplicates
  const { error: insertError } = await supabase.from('catches').upsert(
    {
      user_id: item.userId,
      client_id: item.clientId,
      species: item.species,
      caught_at: item.caughtAt,
      latitude: item.latitude,
      longitude: item.longitude,
      photo_path: photoPath,
    },
    { onConflict: 'client_id' },
  )

  if (insertError) return false

  await db.catches.delete(item.clientId)
  return true
}

let syncInFlight = false

/** Uploads every locally-queued catch to Supabase. No-ops if offline or already running. */
export async function syncPendingCatches(): Promise<SyncResult> {
  if (syncInFlight || !navigator.onLine) {
    return { attempted: 0, succeeded: 0, failed: 0 }
  }

  syncInFlight = true
  try {
    const pending = await db.catches.where('syncStatus').equals('pending').toArray()
    let succeeded = 0
    let failed = 0

    for (const item of pending) {
      if (await syncOne(item)) {
        succeeded += 1
      } else {
        failed += 1
      }
    }

    return { attempted: pending.length, succeeded, failed }
  } finally {
    syncInFlight = false
  }
}
