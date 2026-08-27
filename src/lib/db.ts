import Dexie, { type Table } from 'dexie'
import type { LocalCatch } from '../types'

class DiarioPescaDB extends Dexie {
  catches!: Table<LocalCatch, string>

  constructor() {
    super('diario-pesca')
    this.version(1).stores({
      // clientId is the primary key: generated on-device, stable forever,
      // used to reconcile local records with the ones synced to Supabase
      catches: 'clientId, syncStatus, caughtAt',
    })
  }
}

export const db = new DiarioPescaDB()
