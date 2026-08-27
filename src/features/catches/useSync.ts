import { useCallback, useEffect, useState } from 'react'
import { syncPendingCatches } from '../../lib/sync'

/** Runs sync on mount and whenever the browser regains connectivity. */
export function useSync(onSettled: () => void) {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncFailed, setLastSyncFailed] = useState(false)

  const runSync = useCallback(async () => {
    setSyncing(true)
    try {
      const result = await syncPendingCatches()
      setLastSyncFailed(result.failed > 0)
    } finally {
      setSyncing(false)
      onSettled()
    }
  }, [onSettled])

  useEffect(() => {
    runSync()
    window.addEventListener('online', runSync)
    return () => window.removeEventListener('online', runSync)
  }, [runSync])

  return { syncing, lastSyncFailed, runSync }
}
