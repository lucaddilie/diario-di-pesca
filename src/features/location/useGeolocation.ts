import { useEffect, useState } from 'react'

export interface GeolocationState {
  status: 'loading' | 'success' | 'error' | 'unsupported'
  latitude: number | null
  longitude: number | null
}

/** Requests the device position as soon as it mounts. Never blocks the caller on failure. */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    status: 'loading',
    latitude: null,
    longitude: null,
  })

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'unsupported', latitude: null, longitude: null })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'success',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        setState({ status: 'error', latitude: null, longitude: null })
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [])

  return state
}
