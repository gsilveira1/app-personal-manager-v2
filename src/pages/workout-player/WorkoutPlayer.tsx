import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Play, Check, Clock, MessageSquare, AlertTriangle, Trophy, Sparkles } from 'lucide-react'
import { Card, Button, Input } from '../../components/atoms'
import * as api from '../../services/api/apiService'

export const WorkoutPlayer = () => {
  const [searchParams] = useSearchParams()
  const token =
    searchParams.get('token') ||
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null)

  const [data, setData] = useState<api.PortalWorkoutSheetResponse | null>(null)
  const [activeWorkoutIdx, setActiveWorkoutIdx] = useState(0)
  const [exerciseLoads, setExerciseLoads] = useState<Record<string, number>>({})
  const [isStarted, setIsStarted] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [finishedDurationSeconds, setFinishedDurationSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Rest Timer State
  const [restRemaining, setRestRemaining] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token de treino não informado.')
      setIsLoading(false)
      return
    }

    api
      .getPortalWorkoutSheet(token)
      .then((res) => {
        setData(res)
        // Pre-populate loads map
        const initialLoads: Record<string, number> = {}
        res.workouts.forEach((w) => {
          w.blocks.forEach((b) => {
            b.exercises.forEach((e) => {
              if (e.lastLoadKg !== null && e.lastLoadKg !== undefined) {
                initialLoads[e.workoutExerciseId] = e.lastLoadKg
              }
            })
          })
        })
        setExerciseLoads(initialLoads)
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar ficha de treino.')
      })
      .finally(() => setIsLoading(false))
  }, [token])

  // Rest timer countdown
  useEffect(() => {
    if (restRemaining !== null && restRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setRestRemaining((prev) => (prev !== null ? prev - 1 : null))
      }, 1000)
    } else if (restRemaining === 0) {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
      setRestRemaining(null)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [restRemaining])

  const handleStartWorkout = () => {
    setIsStarted(true)
    setStartTime(Date.now())
  }

  const handleStartRest = (seconds: number) => {
    setRestRemaining(seconds)
  }

  const handleFinishWorkout = async () => {
    const elapsedSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 3600
    setFinishedDurationSeconds(elapsedSeconds)
    setIsFinished(true)

    const activeWorkout = data?.workouts[activeWorkoutIdx]
    const loadsPayload = Object.entries(exerciseLoads).map(([workoutExerciseId, loadKg]) => ({
      workoutExerciseId,
      loadKg,
    }))

    // Optimistic Save: Always persist locally first
    const sessionData = {
      workoutId: activeWorkout?.id || 'w-1',
      durationSeconds: elapsedSeconds,
      completedAt: new Date().toISOString(),
      loads: loadsPayload,
    }

    try {
      if (token) {
        await api.recordPortalSession(token, sessionData)
      }
    } catch (_err) {
      // Save in offline queue in localStorage
      const queue = JSON.parse(localStorage.getItem('offline_workout_queue') || '[]')
      queue.push(sessionData)
      localStorage.setItem('offline_workout_queue', JSON.stringify(queue))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <p className="text-sm font-medium">Carregando seu treino...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 p-4">
        <Card className="max-w-md p-6 text-center bg-slate-800 text-white border-slate-700 shadow-xl">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-400 mb-3" />
          <h2 className="text-lg font-bold">Aviso de Treino</h2>
          <p className="mt-2 text-sm text-slate-300">{error}</p>
        </Card>
      </div>
    )
  }

  const currentWorkout = data?.workouts[activeWorkoutIdx]

  if (isFinished) {
    const durationMinutes = Math.round(finishedDurationSeconds / 60)
    const trainerPhone = data?.trainerPhone?.replace(/\D/g, '') || ''
    const feedbackText = encodeURIComponent(`Fala treinador! Finalizei o ${currentWorkout?.name || 'treino'} em ${durationMinutes} minutos. Treino muito bom!`)
    const whatsappUrl = `https://wa.me/${trainerPhone}?text=${feedbackText}`

    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-slate-800 border-slate-700 shadow-2xl space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
            <Trophy className="h-10 w-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              Treino Concluído! <Sparkles className="h-5 w-5 text-amber-400" />
            </h2>
            <p className="text-sm text-slate-400 mt-1">Parabéns pela dedicação e consistência de hoje!</p>
          </div>

          <div className="rounded-xl bg-slate-700/50 p-4 border border-slate-600/50 flex justify-around text-center">
            <div>
              <span className="block text-xs font-semibold text-slate-400">Tempo de Treino</span>
              <span className="text-xl font-bold text-emerald-400">{durationMinutes} min</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400">Treino Realizado</span>
              <span className="text-xl font-bold text-white">{currentWorkout?.letter}</span>
            </div>
          </div>

          {trainerPhone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98"
            >
              <MessageSquare className="h-5 w-5" />
              Enviar Feedback ao Treinador
            </a>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-sm font-bold text-white truncate">{data?.sheetName}</h1>
            <span className="text-xs text-slate-400">Personal: {data?.trainerName || 'Seu Treinador'}</span>
          </div>

          {/* Rest Timer Float Badge */}
          {restRemaining !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold animate-pulse">
              <Clock className="h-3.5 w-3.5" />
              <span>{restRemaining}s</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Workout Letter Tabs */}
        {!isStarted && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data?.workouts.map((w, idx) => (
              <button
                key={w.id}
                onClick={() => setActiveWorkoutIdx(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeWorkoutIdx === idx ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span>Treino {w.letter}</span>
                <span className="text-[11px] opacity-80">({w.name})</span>
              </button>
            ))}
          </div>
        )}

        {/* Start Workout Banner */}
        {!isStarted ? (
          <Card className="p-6 text-center bg-slate-800 border-slate-700 space-y-4">
            <h2 className="text-lg font-bold text-white">
              Treino {currentWorkout?.letter} - {currentWorkout?.name}
            </h2>
            <p className="text-xs text-slate-400">{currentWorkout?.blocks.length || 0} blocos de exercícios para você realizar hoje.</p>
            <Button onClick={handleStartWorkout} className="w-full py-4 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center gap-2">
              <Play className="h-5 w-5 fill-current" /> Iniciar Treino de Hoje
            </Button>
          </Card>
        ) : (
          /* Workout Execution View */
          <div className="space-y-4">
            {currentWorkout?.blocks.map((block, bIdx) => (
              <Card key={block.id} className="p-4 bg-slate-800 border-slate-700 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${block.type === 'BISET' ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-slate-700 text-slate-300'}`}>
                    {block.type === 'BISET' ? 'BI-SET (Sem descanso entre os dois)' : `Bloco #${bIdx + 1}`}
                  </span>
                  <button type="button" onClick={() => handleStartRest(block.restTimeSeconds)} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Descansar ({block.restTimeSeconds}s)</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {block.exercises.map((exercise) => (
                    <div key={exercise.workoutExerciseId} className="space-y-2">
                      {/* Exercise Media (Autoplay Loop Muted) */}
                      {exercise.gifUrl && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                          {exercise.gifUrl.endsWith('.mp4') || exercise.gifUrl.endsWith('.webm') ? (
                            <video src={exercise.gifUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                          ) : (
                            <img src={exercise.gifUrl} alt={exercise.exerciseName} className="h-full w-full object-cover" />
                          )}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-white">{exercise.exerciseName}</h4>
                          <span className="text-xs text-slate-400">
                            {exercise.sets} séries de {exercise.reps} reps
                          </span>
                        </div>
                      </div>

                      {exercise.executionNotes && <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-700/50 italic">💡 {exercise.executionNotes}</p>}

                      {/* Load Input */}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-xs font-semibold text-slate-300">Carga Utilizada (kg):</span>
                        <Input
                          type="number"
                          step="0.5"
                          value={exerciseLoads[exercise.workoutExerciseId] ?? ''}
                          onChange={(e) => {
                            setExerciseLoads({
                              ...exerciseLoads,
                              [exercise.workoutExerciseId]: parseFloat(e.target.value) || 0,
                            })
                          }}
                          placeholder="Ex: 40"
                          className="w-24 h-9 bg-slate-900 border-slate-600 text-white font-bold text-center text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {/* Finish Workout Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800">
              <div className="max-w-lg mx-auto">
                <Button onClick={handleFinishWorkout} className="w-full py-4 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center gap-2">
                  <Check className="h-5 w-5" /> Finalizar Treino
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
