import apiClient from '../../utils/apiClient'

export interface PresignedUrlResponse {
  uploadUrl: string
  publicUrl: string
  key: string
}

/**
 * Requests a presigned upload URL for Cloudflare R2 direct upload.
 */
export const getStoragePresignedUrl = async (fileName: string, mimeType: string, folder: string = 'logos'): Promise<PresignedUrlResponse> => {
  return await apiClient<PresignedUrlResponse>('/storage/presigned-url', {
    method: 'POST',
    body: JSON.stringify({ fileName, mimeType, folder }),
  })
}

/**
 * Uploads a file directly to the Presigned URL via HTTP PUT (zero backend traffic).
 */
export const uploadFileToR2PresignedUrl = async (uploadUrl: string, file: File): Promise<void> => {
  // If the uploadUrl is a mock URL (development/testing), we simulate successful PUT
  if (uploadUrl.includes('mock-upload')) {
    return
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload file to storage: ${response.statusText}`)
  }
}
