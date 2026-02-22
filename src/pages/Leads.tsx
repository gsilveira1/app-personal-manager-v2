import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
    UserPlus,
    Phone,
    Mail,
    MessageSquare,
    ChevronRight,
    X,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    Dumbbell,
    Globe,
    MapPin,
} from 'lucide-react'

import { useStore } from '../store/store'
import { ClientStatus } from '../types'
import type { Client, Plan } from '../types'
import { Card, Button, Select, Label } from '../components/ui'

// -------------------------------------------------------------------
// Pipeline stages — frontend-only concept
// Stage is encoded in client.notes as JSON prefix: {"__stage":"Contacted",...}
// -------------------------------------------------------------------

type LeadStage = 'New' | 'Contacted' | 'Interested' | 'Won' | 'Lost'

const STAGES: { id: LeadStage; label: string; color: string; dot: string }[] = [
    { id: 'New', label: 'New Lead', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    { id: 'Contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    { id: 'Interested', label: 'Interested', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
]

function parseStage(notes: string | null | undefined): LeadStage {
    if (!notes) return 'New'
    try {
        const parsed = JSON.parse(notes)
        return (parsed.__stage as LeadStage) ?? 'New'
    } catch {
        return 'New'
    }
}

function parseUserNotes(notes: string | null | undefined): string {
    if (!notes) return ''
    try {
        const parsed = JSON.parse(notes)
        return parsed.__userNotes ?? ''
    } catch {
        return notes
    }
}

function encodeNotes(stage: LeadStage, userNotes: string): string {
    return JSON.stringify({ __stage: stage, __userNotes: userNotes })
}

function daysAgo(dateStr: string | undefined): string {
    if (!dateStr) return ''
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
    if (diff === 0) return 'Today'
    if (diff === 1) return '1 day ago'
    return `${diff} days ago`
}

function interestLabel(type: Client['type']): string {
    return type === 'Online' ? 'Online' : 'In-Person'
}

// -------------------------------------------------------------------
// WhatsApp link helper
// -------------------------------------------------------------------
function whatsappUrl(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    return `https://wa.me/${cleaned}`
}

// -------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------

interface LeadCardProps {
    client: Client
    stage: LeadStage
    onClick: () => void
}

const LeadCard = ({ client, stage, onClick }: LeadCardProps) => {
    const stageInfo = STAGES.find((s) => s.id === stage)!
    const created = (client as any).createdAt as string | undefined

    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
        >
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{client.name}</p>
                    {created && <p className="text-xs text-slate-400">{daysAgo(created)}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
            </div>

            {/* Interest + stage badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${stageInfo.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${stageInfo.dot}`} />
                    {stageInfo.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {client.type === 'Online' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    {interestLabel(client.type)}
                </span>
            </div>

            {/* Contact quick-links */}
            <div className="flex gap-2">
                <a
                    href={whatsappUrl(client.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors font-medium"
                >
                    <Phone className="h-3 w-3" /> WhatsApp
                </a>
                <a
                    href={`mailto:${client.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors font-medium"
                >
                    <Mail className="h-3 w-3" /> Email
                </a>
            </div>
        </button>
    )
}

// -------------------------------------------------------------------
// Lead detail drawer (right panel)
// -------------------------------------------------------------------

interface LeadDrawerProps {
    lead: Client
    plans: Plan[]
    onClose: () => void
    onStageChange: (id: string, stage: LeadStage, notes: string) => void
    onConvert: (id: string, planId?: string) => void
    onMarkLost: (id: string) => void
}

const LeadDrawer = ({ lead, plans, onClose, onStageChange, onConvert, onMarkLost }: LeadDrawerProps) => {
    const stage = parseStage(lead.notes)
    const userNotes = parseUserNotes(lead.notes)
    const [localStage, setLocalStage] = useState<LeadStage>(stage)
    const [localNotes, setLocalNotes] = useState(userNotes)
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [showConvertModal, setShowConvertModal] = useState(false)
    const [converting, setConverting] = useState(false)

    const handleStageChange = (newStage: LeadStage) => {
        setLocalStage(newStage)
        onStageChange(lead.id, newStage, localNotes)
    }

    const handleNotesBlur = () => {
        onStageChange(lead.id, localStage, localNotes)
    }

    const handleConvert = async () => {
        setConverting(true)
        await onConvert(lead.id, selectedPlanId || undefined)
        setConverting(false)
        setShowConvertModal(false)
    }

    const created = (lead as any).createdAt as string | undefined

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer panel */}
            <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                            {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900">{lead.name}</h2>
                            {created && <p className="text-xs text-slate-400">{daysAgo(created)}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Contact info */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</h3>
                        <a
                            href={whatsappUrl(lead.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group"
                        >
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">{lead.phone}</span>
                            <span className="ml-auto text-xs text-green-600 font-medium opacity-0 group-hover:opacity-100">Open WhatsApp →</span>
                        </a>
                        <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <Mail className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-700">{lead.email}</span>
                        </a>
                    </section>

                    {/* Interest */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interest</h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                {lead.type === 'Online' ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                                {interestLabel(lead.type)}
                            </span>
                            {lead.goal && (
                                <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                    <Dumbbell className="h-3.5 w-3.5" />
                                    {lead.goal}
                                </span>
                            )}
                        </div>
                    </section>

                    {/* Stage */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stage</h3>
                        <div className="flex gap-2">
                            {STAGES.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleStageChange(s.id)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all ${localStage === s.id
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Notes */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" /> Notes
                        </h3>
                        <textarea
                            value={localNotes}
                            onChange={(e) => setLocalNotes(e.target.value)}
                            onBlur={handleNotesBlur}
                            placeholder="Add notes about this lead..."
                            rows={4}
                            className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </section>
                </div>

                {/* Action footer */}
                <div className="p-5 border-t border-slate-200 space-y-3">
                    <Button
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setShowConvertModal(true)}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Convert to Client
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onMarkLost(lead.id)}
                    >
                        <XCircle className="h-4 w-4" />
                        Mark as Lost
                    </Button>
                </div>
            </div>

            {/* Convert modal (on top of drawer) */}
            {showConvertModal && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
                    <Card className="w-full max-w-sm p-6 m-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Convert Lead to Client</h3>
                        <p className="text-sm text-slate-500 mb-5">
                            Optionally assign a plan to <strong>{lead.name}</strong> right away.
                        </p>
                        <div className="space-y-2 mb-5">
                            <Label htmlFor="plan-select">Subscription Plan (optional)</Label>
                            <Select
                                id="plan-select"
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                            >
                                <option value="">— No plan yet —</option>
                                {plans.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowConvertModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                disabled={converting}
                                onClick={handleConvert}
                            >
                                {converting ? 'Converting...' : 'Confirm'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}

// -------------------------------------------------------------------
// Main Leads page
// -------------------------------------------------------------------

export const Leads = () => {
    const navigate = useNavigate()
    const { clients, plans, updateClient, convertLead } = useStore()
    const [selectedLead, setSelectedLead] = useState<Client | null>(null)

    // All leads = clients with status Lead
    const leads = useMemo(
        () => clients.filter((c) => c.status === ClientStatus.Lead),
        [clients],
    )

    // Stats
    const totalThisWeek = useMemo(() => {
        const weekAgo = Date.now() - 7 * 86_400_000
        return leads.filter((l) => new Date((l as any).createdAt ?? 0).getTime() > weekAgo).length
    }, [leads])

    const totalClients = clients.filter((c) => c.status === ClientStatus.Active).length
    const conversionRate = totalClients + leads.length > 0
        ? Math.round((totalClients / (totalClients + leads.length)) * 100)
        : 0

    const avgAgeDays = useMemo(() => {
        if (leads.length === 0) return 0
        const sum = leads.reduce((acc, l) => {
            const diff = Math.floor((Date.now() - new Date((l as any).createdAt ?? 0).getTime()) / 86_400_000)
            return acc + diff
        }, 0)
        return Math.round(sum / leads.length)
    }, [leads])

    // Grouped by stage
    const byStage = useMemo(() => {
        const groups: Record<LeadStage, Client[]> = { New: [], Contacted: [], Interested: [], Won: [], Lost: [] }
        for (const lead of leads) {
            const stage = parseStage(lead.notes)
            groups[stage].push(lead)
        }
        return groups
    }, [leads])

    const handleStageChange = async (id: string, stage: LeadStage, userNotes: string) => {
        await updateClient(id, { notes: encodeNotes(stage, userNotes) })
    }

    const handleConvert = async (id: string, planId?: string) => {
        await convertLead(id, planId)
        setSelectedLead(null)
        navigate(`/clients/${id}`)
    }

    const handleMarkLost = async (id: string) => {
        if (window.confirm('Mark this lead as Lost? They will be removed from the pipeline.')) {
            await updateClient(id, { status: ClientStatus.Inactive })
            setSelectedLead(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Lead Pipeline</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage incoming leads from your website.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                        <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{totalThisWeek}</p>
                        <p className="text-xs text-slate-500">New this week</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{conversionRate}%</p>
                        <p className="text-xs text-slate-500">Conversion rate</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100">
                        <UserPlus className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{avgAgeDays}d</p>
                        <p className="text-xs text-slate-500">Avg. lead age</p>
                    </div>
                </Card>
            </div>

            {/* Empty state */}
            {leads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <div className="bg-slate-100 p-5 rounded-full mb-4">
                        <UserPlus className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-lg font-semibold text-slate-600">No active leads</p>
                    <p className="text-sm mt-1">
                        Leads submitted via your website will appear here automatically.
                    </p>
                </div>
            )}

            {/* Kanban columns */}
            {leads.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {STAGES.map((stage) => (
                        <div key={stage.id} className="flex flex-col gap-3">
                            {/* Column header */}
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${stage.dot}`} />
                                <h3 className="font-semibold text-slate-700 text-sm">{stage.label}</h3>
                                <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                    {byStage[stage.id].length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="flex flex-col gap-3 min-h-[120px]">
                                {byStage[stage.id].map((lead) => (
                                    <LeadCard
                                        key={lead.id}
                                        client={lead}
                                        stage={stage.id}
                                        onClick={() => setSelectedLead(lead)}
                                    />
                                ))}
                                {byStage[stage.id].length === 0 && (
                                    <div className="flex items-center justify-center h-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-300 text-sm">
                                        No leads
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail drawer */}
            {selectedLead && (
                <LeadDrawer
                    lead={selectedLead}
                    plans={plans}
                    onClose={() => setSelectedLead(null)}
                    onStageChange={handleStageChange}
                    onConvert={handleConvert}
                    onMarkLost={handleMarkLost}
                />
            )}
        </div>
    )
}
