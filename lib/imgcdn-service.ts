// lib/imgcdn-service.ts
// Utility untuk upload gambar ke imgcdn.dev CDN (gratis, permanent)
// API Docs: https://imgcdn.dev/page/api (Chevereto v1 API)

const IMGCDN_API_KEY = process.env.IMGCDN_API_KEY || '5386e05a3562c7a8f984e73401540836'
const IMGCDN_API_URL = 'https://imgcdn.dev/api/1/upload'

export interface ImgCDNUploadResult {
  url: string         // Direct image URL
  viewerUrl: string   // Viewer page URL
  deleteUrl?: string  // URL to delete the image (if provided)
  width?: number
  height?: number
  size?: number
}

/**
 * Upload gambar ke imgcdn.dev menggunakan API v1
 * Menerima File object (dari FormData/multipart)
 */
export async function uploadImageToCDN(file: File): Promise<ImgCDNUploadResult> {
  const formData = new FormData()
  formData.append('key', IMGCDN_API_KEY)
  formData.append('source', file)
  formData.append('format', 'json')

  const response = await fetch(IMGCDN_API_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`imgcdn.dev upload failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  if (data.status_code !== 200) {
    throw new Error(`imgcdn.dev API error: ${data.error?.message || JSON.stringify(data)}`)
  }

  const image = data.image

  return {
    url: image.url,
    viewerUrl: image.url_viewer,
    deleteUrl: image.delete_url,
    width: image.width,
    height: image.height,
    size: image.size,
  }
}

/**
 * Upload gambar dari base64 string ke imgcdn.dev
 */
export async function uploadBase64ToCDN(base64: string, filename = 'image.jpg'): Promise<ImgCDNUploadResult> {
  // Strip data URL prefix jika ada (data:image/jpeg;base64,...)
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64

  const formData = new FormData()
  formData.append('key', IMGCDN_API_KEY)
  formData.append('source', base64Data)
  formData.append('format', 'json')

  const response = await fetch(IMGCDN_API_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`imgcdn.dev upload failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  if (data.status_code !== 200) {
    throw new Error(`imgcdn.dev API error: ${data.error?.message || JSON.stringify(data)}`)
  }

  const image = data.image

  return {
    url: image.url,
    viewerUrl: image.url_viewer,
    deleteUrl: image.delete_url,
    width: image.width,
    height: image.height,
    size: image.size,
  }
}

/**
 * Upload gambar dari URL ke imgcdn.dev (re-host)
 */
export async function uploadUrlToCDN(imageUrl: string): Promise<ImgCDNUploadResult> {
  const formData = new FormData()
  formData.append('key', IMGCDN_API_KEY)
  formData.append('source', imageUrl)
  formData.append('format', 'json')

  const response = await fetch(IMGCDN_API_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`imgcdn.dev upload failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  if (data.status_code !== 200) {
    throw new Error(`imgcdn.dev API error: ${data.error?.message || JSON.stringify(data)}`)
  }

  const image = data.image

  return {
    url: image.url,
    viewerUrl: image.url_viewer,
    deleteUrl: image.delete_url,
    width: image.width,
    height: image.height,
    size: image.size,
  }
}

/**
 * Cek apakah URL adalah CDN URL (bukan lokal)
 */
export function isCDNUrl(url: string): boolean {
  return url.includes('imgcdn.dev') || url.startsWith('https://')
}