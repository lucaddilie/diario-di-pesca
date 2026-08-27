import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import { db } from '../../lib/db'
import { compressImage } from '../../lib/imageCompression'
import { useGeolocation } from '../location/useGeolocation'

function nowForDatetimeLocal() {
  const now = new Date()
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 16)
}

export function NewCatchForm({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [species, setSpecies] = useState('')
  const [caughtAt, setCaughtAt] = useState(nowForDatetimeLocal)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [latitudeInput, setLatitudeInput] = useState('')
  const [longitudeInput, setLongitudeInput] = useState('')
  const locationTouchedRef = useRef(false)
  const location = useGeolocation()

  useEffect(() => {
    if (location.status === 'success' && !locationTouchedRef.current) {
      setLatitudeInput(location.latitude!.toFixed(5))
      setLongitudeInput(location.longitude!.toFixed(5))
    }
  }, [location.status, location.latitude, location.longitude])

  function handleLatitudeChange(value: string) {
    locationTouchedRef.current = true
    setLatitudeInput(value)
  }

  function handleLongitudeChange(value: string) {
    locationTouchedRef.current = true
    setLongitudeInput(value)
  }

  function resetLocationFieldsToDetected() {
    locationTouchedRef.current = false
    if (location.status === 'success') {
      setLatitudeInput(location.latitude!.toFixed(5))
      setLongitudeInput(location.longitude!.toFixed(5))
    } else {
      setLatitudeInput('')
      setLongitudeInput('')
    }
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setPhotoFile(file)
    setPhotoPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return file ? URL.createObjectURL(file) : null
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSavedMessage(null)

    if (!photoFile) {
      setError('Aggiungi una foto della cattura.')
      return
    }
    if (!species.trim()) {
      setError('Indica la specie.')
      return
    }

    const latitude = latitudeInput.trim() === '' ? null : Number(latitudeInput)
    const longitude = longitudeInput.trim() === '' ? null : Number(longitudeInput)

    if (latitude !== null && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) {
      setError('Latitudine non valida (deve essere tra -90 e 90).')
      return
    }
    if (longitude !== null && (Number.isNaN(longitude) || longitude < -180 || longitude > 180)) {
      setError('Longitudine non valida (deve essere tra -180 e 180).')
      return
    }

    setSaving(true)
    try {
      const photoBlob = await compressImage(photoFile)

      await db.catches.add({
        clientId: crypto.randomUUID(),
        userId,
        species: species.trim(),
        caughtAt: new Date(caughtAt).toISOString(),
        latitude,
        longitude,
        photoBlob,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
      })

      setSavedMessage('Cattura salvata. Verrà sincronizzata quando torna la connessione.')
      setSpecies('')
      setPhotoFile(null)
      setPhotoPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return null
      })
      setCaughtAt(nowForDatetimeLocal())
      resetLocationFieldsToDetected()
      onSaved()
    } catch {
      setError('Impossibile salvare la cattura sul dispositivo. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={{ margin: 0 }}>Nuova cattura</h2>

      <label style={labelStyle}>
        Foto
        <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
      </label>
      {photoPreviewUrl && (
        <img
          src={photoPreviewUrl}
          alt="Anteprima della cattura"
          style={{ maxWidth: '100%', borderRadius: '8px' }}
        />
      )}

      <label style={labelStyle}>
        Specie
        <input
          type="text"
          value={species}
          onChange={(event) => setSpecies(event.target.value)}
          placeholder="es. Luccio"
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Data e ora
        <input
          type="datetime-local"
          value={caughtAt}
          onChange={(event) => setCaughtAt(event.target.value)}
          style={inputStyle}
        />
      </label>

      <div style={labelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>Posizione (opzionale, modificabile)</span>
          {location.status === 'success' && (
            <button type="button" onClick={resetLocationFieldsToDetected} style={linkButtonStyle}>
              usa posizione rilevata
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            placeholder="Latitudine"
            value={latitudeInput}
            onChange={(event) => handleLatitudeChange(event.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            type="number"
            inputMode="decimal"
            step="any"
            placeholder="Longitudine"
            value={longitudeInput}
            onChange={(event) => handleLongitudeChange(event.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
      </div>

      <p style={statusTextStyle}>
        {location.status === 'loading' && 'Rilevamento posizione GPS…'}
        {location.status === 'error' && 'GPS non disponibile: inserisci le coordinate a mano se vuoi.'}
        {location.status === 'unsupported' && 'GPS non supportato su questo dispositivo.'}
      </p>

      {error && (
        <p role="alert" style={{ color: '#b00020', margin: 0 }}>
          {error}
        </p>
      )}
      {savedMessage && (
        <p style={{ color: 'var(--color-synced)', margin: 0 }}>{savedMessage}</p>
      )}

      <button type="submit" disabled={saving} style={buttonStyle}>
        {saving ? 'Salvataggio…' : 'Salva cattura'}
      </button>
    </form>
  )
}

const linkButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'var(--color-primary)',
  fontSize: '0.8rem',
  textDecoration: 'underline',
  cursor: 'pointer',
}

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.9rem',
  width: '100%',
}

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  fontSize: '0.9rem',
  color: '#333',
  textAlign: 'left',
}

const inputStyle: CSSProperties = {
  padding: '0.65rem',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: '6px',
}

const statusTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#555',
  textAlign: 'left',
}

const buttonStyle: CSSProperties = {
  padding: '0.8rem',
  fontSize: '1rem',
  fontWeight: 600,
  color: 'white',
  background: 'var(--color-primary)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}
