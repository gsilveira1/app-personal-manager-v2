import type { Client } from '../types'

// -------------------------------------------------------------------
// Pipeline stages — frontend-only concept
// Stage is encoded in client.notes as JSON prefix: {"__stage":"Contacted",...}
// -------------------------------------------------------------------

export type LeadStage = 'New' | 'Contacted' | 'Interested' | 'Won' | 'Lost'

export const STAGES: { id: LeadStage; labelKey: string; color: string; dot: string }[] = [
  { id: 'New', labelKey: 'newLead', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  { id: 'Contacted', labelKey: 'contacted', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { id: 'Interested', labelKey: 'interested', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
]

export function parseStage(notes: string | null | undefined): LeadStage {
  if (!notes) return 'New'
  try {
    const parsed = JSON.parse(notes)
    return (parsed.__stage as LeadStage) ?? 'New'
  } catch {
    return 'New'
  }
}

export function parseUserNotes(notes: string | null | undefined): string {
  if (!notes) return ''
  try {
    const parsed = JSON.parse(notes)
    return parsed.__userNotes ?? ''
  } catch {
    return notes
  }
}

export function encodeNotes(stage: LeadStage, userNotes: string): string {
  return JSON.stringify({ __stage: stage, __userNotes: userNotes })
}

export function daysAgo(dateStr: string | undefined, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diff === 0) return t('today')
  if (diff === 1) return t('oneDayAgo')
  return t('daysAgo', { count: diff })
}

export function interestLabel(type: Client['type'], t: (key: string) => string): string {
  return type === 'Online' ? t('online') : t('inPerson')
}

// -------------------------------------------------------------------
// WhatsApp link helper
// -------------------------------------------------------------------
export function whatsappUrl(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `https://wa.me/${cleaned}`
}
