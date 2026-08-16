import React from 'react'
import { TrendingDown, TrendingUp, Award, Target, Flame, HeartPulse } from 'lucide-react'
import { Card } from '../../atoms'
import type { Evaluation } from '../../../types'

interface EvaluationInsightsCardProps {
  evaluations: Evaluation[]
}

export const EvaluationInsightsCard: React.FC<EvaluationInsightsCardProps> = ({ evaluations }) => {
  if (!evaluations || evaluations.length === 0) return null

  const latest = evaluations[0]
  const previous = evaluations.length > 1 ? evaluations[1] : null

  // Delta calculations
  const fatDiff = (latest.bodyFatPercentage && previous?.bodyFatPercentage)
    ? Number((latest.bodyFatPercentage - previous.bodyFatPercentage).toFixed(1))
    : null

  const leanDiff = (latest.leanMass && previous?.leanMass)
    ? Number((latest.leanMass - previous.leanMass).toFixed(1))
    : null

  const weightDiff = (latest.weight && previous?.weight)
    ? Number((latest.weight - previous.weight).toFixed(1))
    : null

  // ACSM Body Fat Classification for Males/Females
  const getFatClassification = (fatPct?: number) => {
    if (!fatPct) return { label: 'Não avaliado', color: 'bg-slate-100 text-slate-700' }
    if (fatPct < 8) return { label: 'Atleta / Gordura Essencial', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    if (fatPct <= 15) return { label: 'Excelente (Fitness)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    if (fatPct <= 20) return { label: 'Bom / Saudável', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (fatPct <= 25) return { label: 'Média Aceitável', color: 'bg-amber-100 text-amber-800 border-amber-200' }
    return { label: 'Acima da Média', color: 'bg-rose-100 text-rose-800 border-rose-200' }
  }

  const classification = getFatClassification(latest.bodyFatPercentage)

  // Ideal weight recommendation based on 15% body fat target
  const targetFatPct = 15
  const idealWeight = latest.leanMass ? Number((latest.leanMass / (1 - (targetFatPct / 100))).toFixed(1)) : null

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl border-0 overflow-hidden relative">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-900/60 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <HeartPulse className="h-4 w-4" />
            Insights Clínicos de Composição Corporal
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Diagnóstico & Evolução Recente</h3>
        </div>

        <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${classification.color}`}>
          {classification.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* % Body Fat Insight */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs text-slate-400 font-medium">% Gordura Atual</div>
          <div className="text-2xl font-black text-indigo-300 mt-1">
            {latest.bodyFatPercentage ?? '-'}%
          </div>
          {fatDiff !== null && (
            <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${fatDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fatDiff <= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
              <span>{fatDiff > 0 ? `+${fatDiff}` : fatDiff}% em relação à anterior</span>
            </div>
          )}
        </div>

        {/* Lean Mass Insight */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs text-slate-400 font-medium">Massa Magra (kg)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {latest.leanMass ?? '-'} kg
          </div>
          {leanDiff !== null && (
            <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${leanDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {leanDiff >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{leanDiff > 0 ? `+${leanDiff}` : leanDiff} kg em relação à anterior</span>
            </div>
          )}
        </div>

        {/* Fat Mass Insight */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs text-slate-400 font-medium">Massa Gorda (kg)</div>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {latest.fatMass ?? '-'} kg
          </div>
          {weightDiff !== null && (
            <div className="flex items-center gap-1 text-xs font-medium text-slate-300 mt-2">
              <span>Peso total: {latest.weight} kg ({weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg)</span>
            </div>
          )}
        </div>
      </div>

      {idealWeight && (
        <div className="bg-indigo-900/40 border border-indigo-700/50 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-200">Meta Estimada de Peso Ideal</div>
              <div className="text-xs text-indigo-300/80">Mantendo a massa magra atual com {targetFatPct}% de gordura</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{idealWeight} kg</div>
          </div>
        </div>
      )}
    </Card>
  )
}
