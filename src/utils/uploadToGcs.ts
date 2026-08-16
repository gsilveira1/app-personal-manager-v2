export async function uploadFileToGcs(signedUrl: string, file: File): Promise<string | void> {
  if (signedUrl.startsWith('mock-dev-upload://')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    if (!response.ok) {
      throw new Error(`Upload falhou com status ${response.status}`)
    }
  } catch (err: any) {
    // If CORS or network fails in dev environment, fallback to base64 data URL
    if (err?.name === 'TypeError' || err?.message?.includes('Failed to fetch')) {
      console.warn('GCS PUT fetch failed (likely CORS on localhost). Falling back to base64 avatar data URL.')
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
    throw err
  }
}
