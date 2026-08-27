import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

/** Fetches the display name for a user. Returns null while loading or if offline. */
export function useProfile(userId: string) {
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setDisplayName(data?.display_name ?? null)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return displayName
}
