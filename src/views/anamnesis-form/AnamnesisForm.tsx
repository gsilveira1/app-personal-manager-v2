import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Upload, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Card, Button, Input, Label } from '../../components/atoms'
import * as api from '../../services/api/apiService'

export const AnamnesisForm = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null)

  const [metadata, setMetadata] = useState<api.AnamnesisFormMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [medicalHistory, setMedicalHistory] = useState('')
  const [injuriesAndPain, setInjuriesAndPain] = useState('')
  const [routineAndSchedule, setRoutineAndSchedule] = useState('')
  const [fitnessGoals, setFitnessGoals] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('INTERMEDIATE')
  const [weightKg, setWeightKg] = useState<string>('')
  const [parqAnswers, setParqAnswers] = useState<Record<string, boolean>>({
    q1: false,
    q2: false,
    q3: false,
    q4: false,
    q5: false,
    q6: false,
    q7: false,
  })

  // Photos
  const [frontPhotoUrl, setFrontPhotoUrl] = useState('')
  const [backPhotoUrl, setBackPhotoUrl] = useState('')
  const [sidePhotoUrl, setSidePhotoUrl] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Token de anamnese não informado.')
      setIsLoading(false)
      return
    }

    api
      .getAnamnesisForm(token)
      .then((data) => {
        setMetadata(data)
        if (data.theme?.primaryColor) {
          document.documentElement.style.setProperty('--primary', data.theme.primaryColor)
        }
      })
      .catch((err) => {
        setError(err.message || 'Link de anamnese inválido ou expirado.')
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const handlePhotoUpload = (field: 'front' | 'back' | 'side', file: File) => {
    // In production this gets presigned URL or creates object URL
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      if (field === 'front') setFrontPhotoUrl(url)
      if (field === 'back') setBackPhotoUrl(url)
      if (field === 'side') setSidePhotoUrl(url)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setIsSubmitting(true)
    try {
      await api.submitAnamnesis({
        token,
        medicalHistory,
        injuriesAndPain,
        routineAndSchedule,
        fitnessGoals,
        experienceLevel,
        parqAnswers,
        frontPhotoUrl: frontPhotoUrl || undefined,
        backPhotoUrl: backPhotoUrl || undefined,
        sidePhotoUrl: sidePhotoUrl || undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
      })
      setIsSubmitted(true)
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar anamnese.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Carregando questionário de saúde...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md p-6 text-center shadow-xl">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Atenção</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </Card>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md p-8 text-center shadow-xl space-y-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900">Anamnese Enviada com Sucesso!</h2>
          <p className="text-sm text-slate-600">
            Obrigado, <strong>{metadata?.studentName}</strong>! Suas informações foram enviadas para seu treinador <strong>{metadata?.personalName}</strong> para a elaboração do seu plano de treinos.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          {metadata?.theme?.logoUrl && <img src={metadata.theme.logoUrl} alt="Logo" className="mx-auto h-12 w-auto mb-2 object-contain" />}
          <h1 className="text-2xl font-bold text-slate-900">Ficha de Anamnese e Prontidão</h1>
          <p className="text-sm text-slate-600 mt-1">
            Olá <strong>{metadata?.studentName}</strong>, preencha o questionário abaixo para o treinador <strong>{metadata?.personalName}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Objectives & Experience */}
          <Card className="p-6 space-y-4 shadow-md bg-white">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">1. Objetivos e Experiência</h3>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Seus Principais Objetivos</Label>
              <Input placeholder="Ex: Hipertrofia, emagrecimento, melhora de postura" value={fitnessGoals} onChange={(e) => setFitnessGoals(e.target.value)} required className="mt-1 text-sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Nível de Experiência com Musculação</Label>
                <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm bg-white">
                  <option value="BEGINNER">Iniciante (Nunca treinou / Pouco tempo)</option>
                  <option value="INTERMEDIATE">Intermediário (1 a 3 anos de treino)</option>
                  <option value="ADVANCED">Avançado (Mais de 3 anos)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Peso Atual (kg)</Label>
                <Input type="number" step="0.1" placeholder="Ex: 68.5" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="mt-1 text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Disponibilidade de Dias e Horários</Label>
              <Input placeholder="Ex: 4x por semana, 1h por dia pela manhã" value={routineAndSchedule} onChange={(e) => setRoutineAndSchedule(e.target.value)} className="mt-1 text-sm" />
            </div>
          </Card>

          {/* Section 2: Health & PAR-Q */}
          <Card className="p-6 space-y-4 shadow-md bg-white">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center">
              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
              2. Saúde e Prontidão Física (PAR-Q)
            </h3>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Histórico de Doenças, Cirurgias ou Medicamentos</Label>
              <textarea
                placeholder="Ex: Hipertensão controlada, cirurgia de joelho em 2022..."
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm h-20"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Dores Articulares ou Limitações de Movimento</Label>
              <Input
                placeholder="Ex: Desconforto na lombar ao agachar, estalo no ombro direito"
                value={injuriesAndPain}
                onChange={(e) => setInjuriesAndPain(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>

            <div className="space-y-2 pt-2">
              <span className="block text-xs font-bold text-slate-700">Perguntas de Prontidão (PAR-Q):</span>
              {[
                { key: 'q1', text: 'Algum médico já disse que você possui algum problema cardíaco?' },
                { key: 'q2', text: 'Você sente dores no peito durante a prática de atividade física?' },
                {
                  key: 'q3',
                  text: 'Você costuma perder o equilíbrio por tonturas ou já perdeu a consciência?',
                },
                {
                  key: 'q4',
                  text: 'Você tem algum problema ósseo ou articular que piora com atividade física?',
                },
                { key: 'q5', text: 'Você toma medicamentos para pressão arterial ou problemas cardíacos?' },
              ].map((q) => (
                <div key={q.key} className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs">
                  <span className="text-slate-700 pr-2">{q.text}</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setParqAnswers({ ...parqAnswers, [q.key]: false })}
                      className={`px-2 py-1 rounded font-semibold ${!parqAnswers[q.key] ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setParqAnswers({ ...parqAnswers, [q.key]: true })}
                      className={`px-2 py-1 rounded font-semibold ${parqAnswers[q.key] ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                    >
                      Sim
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Photos */}
          <Card className="p-6 space-y-4 shadow-md bg-white">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">3. Fotos para Avaliação Postural e Corporal (Opcional)</h3>
            <p className="text-xs text-slate-500">Fotos com roupas de treino (bermuda/top) em local bem iluminado para acompanhamento de evolução.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { field: 'front' as const, label: 'Foto de Frente', url: frontPhotoUrl },
                { field: 'side' as const, label: 'Foto de Perfil', url: sidePhotoUrl },
                { field: 'back' as const, label: 'Foto de Costas', url: backPhotoUrl },
              ].map((p) => (
                <div key={p.field} className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-700 mb-1">{p.label}</span>
                  <label className="relative flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 overflow-hidden">
                    {p.url ? (
                      <img src={p.url} alt={p.label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="mx-auto h-6 w-6 text-slate-400 mb-1" />
                        <span className="text-[11px] text-slate-500">Toque para enviar</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoUpload(p.field, file)
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <Button type="submit" disabled={isSubmitting} className="w-full py-3 text-base bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg">
            {isSubmitting ? 'Enviando Respostas...' : 'Finalizar e Enviar Anamnese'}
          </Button>
        </form>
      </div>
    </div>
  )
}
