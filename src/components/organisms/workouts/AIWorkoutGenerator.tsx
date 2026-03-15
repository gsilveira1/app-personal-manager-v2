import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../../store/store'
import { type WorkoutPlan } from '../../../types'
import { Card, Button, Input, Label, Select } from '../../atoms'
import { generateWorkoutPlan } from '../../../services/geminiService'

interface AIWorkoutGeneratorProps {
  onSave: (w: Omit<WorkoutPlan, 'id' | 'createdAt'>) => void
}

export const AIWorkoutGenerator: React.FC<AIWorkoutGeneratorProps> = ({ onSave }) => {
  const { t } = useTranslation('workouts')
  const { aiPromptInstructions } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const params = {
      clientName: formData.get('clientName') as string,
      goal: formData.get('goal') as string,
      experienceLevel: formData.get('level') as string,
      daysPerWeek: Number(formData.get('days')),
      limitations: formData.get('limitations') as string,
      customInstructions: aiPromptInstructions || undefined,
    }

    try {
      const result = await generateWorkoutPlan(params)

      const newWorkout: Omit<WorkoutPlan, 'id' | 'createdAt'> = {
        title: result.title || `Workout for ${params.clientName}`,
        description: result.description || `Generated plan focused on ${params.goal}`,
        exercises: result.exercises || [],
        tags: result.tags || ['AI Generated'],
        status: 'Active',
      }

      onSave(newWorkout)
    } catch (err) {
      setError(t('generationError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{t('aiWorkoutGenerator')}</h2>
          <p className="text-slate-500 mt-2">{t('aiSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="clientName">{t('clientName')}</Label>
              <Input id="clientName" name="clientName" placeholder={t('clientNamePlaceholder')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">{t('experienceLevel')}</Label>
              <Select id="level" name="level">
                <option value="Beginner">{t('beginner')}</option>
                <option value="Intermediate">{t('intermediate')}</option>
                <option value="Advanced">{t('advanced')}</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">{t('primaryGoal')}</Label>
            <Input id="goal" name="goal" placeholder={t('goalPlaceholder')} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="days">{t('frequencyDaysPerWeek')}</Label>
              <Input id="days" name="days" type="number" min="1" max="7" defaultValue="3" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limitations">{t('limitationsInjuries')}</Label>
              <Input id="limitations" name="limitations" placeholder={t('limitationsPlaceholder')} />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-center">
              <span className="mr-2">&#9888;&#65039;</span> {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('generatingPlan')}
              </>
            ) : (
              t('generateWorkout')
            )}
          </Button>
        </form>
      </Card>
    </div>
  )
}
