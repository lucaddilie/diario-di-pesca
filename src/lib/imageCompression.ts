const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

/** Resizes an image client-side so its longest side is at most MAX_DIMENSION, re-encoding as JPEG. */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 2D context non disponibile')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Compressione immagine fallita'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}
