import { useState, useEffect } from 'react'
import { Dumbbell, Plus, Bookmark, Clock, CheckCircle2, ChevronRight, Layers, Trash2 } from 'lucide-react'
import { Card, Button, Input, Label } from '../../atoms'
import * as api from '../../../services/api/apiService'
import type { Client, WorkoutSheet, WorkoutTemplate, ExerciseCatalogItem, WorkoutSheetItem } from '../../../types'

interface WorkoutSheetsTabProps {
  client: Client
}

export const WorkoutSheetsTab = ({ client }: WorkoutSheetsTabProps) => {
  const [sheets, setSheets] = useState<WorkoutSheet[]>([])
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [activeSheet, setActiveSheet] = useState<WorkoutSheet | null>(null)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Builder State
  const [sheetName, setSheetName] = useState('Ficha de Treino')
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [builderWorkouts, setBuilderWorkouts] = useState<WorkoutSheetItem[]>([
    {
      letter: 'A',
      name: 'Peito, Ombros e Tríceps',
      blocks: [
        {
          type: 'REGULAR',
          restTimeSeconds: 60,
          exercises: [
            {
              exerciseName: 'Supino Reto com Barra',
              sets: 4,
              reps: '8-10',
              suggestedLoadKg: 40,
              executionNotes: 'Pausa de 1 segundo embaixo',
            },
          ],
        },
      ],
    },
  ])

  const loadSheets = async () => {
    setIsLoading(true)
    try {
      const [sheetsData, templatesData] = await Promise.all([api.getWorkoutSheets(client.id), api.getWorkoutTemplates()])
      setSheets(sheetsData || [])
      setTemplates(templatesData || [])
      if (sheetsData && sheetsData.length > 0) {
        setActiveSheet(sheetsData.find((s) => s.active) || sheetsData[0])
      }
    } catch (err) {
      console.error('Error loading workout sheets:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSheets()
  }, [client.id])

  const handleAddWorkoutLetter = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']
    const nextLetter = letters[builderWorkouts.length] || 'X'
    setBuilderWorkouts([
      ...builderWorkouts,
      {
        letter: nextLetter,
        name: `Treino ${nextLetter}`,
        blocks: [
          {
            type: 'REGULAR',
            restTimeSeconds: 60,
            exercises: [
              {
                exerciseName: 'Novo Exercício',
                sets: 3,
                reps: '10-12',
                suggestedLoadKg: 20,
              },
            ],
          },
        ],
      },
    ])
  }

  const handleAddBlock = (workoutIndex: number, type: 'REGULAR' | 'BISET' | 'TRISET' = 'REGULAR') => {
    const minExercises = type === 'BISET' ? 2 : type === 'TRISET' ? 3 : 1
    const defaultExercises = Array.from({ length: minExercises }, (_, i) => ({
      exerciseName: `Exercício ${i + 1}`,
      sets: 3,
      reps: '10-12',
      suggestedLoadKg: 15,
    }))

    const updated = [...builderWorkouts]
    updated[workoutIndex].blocks.push({
      type,
      restTimeSeconds: type === 'REGULAR' ? 60 : 90,
      exercises: defaultExercises,
    })
    setBuilderWorkouts(updated)
  }

  const handleSaveSheet = async () => {
    try {
      await api.createWorkoutSheet(client.id, {
        name: sheetName,
        expiresAt: new Date(expiresAt).toISOString(),
        workouts: builderWorkouts,
      })
      setIsBuilderOpen(false)
      await loadSheets()
    } catch (err: any) {
      alert(err.message || 'Erro ao criar ficha de treino')
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!activeSheet) return
    try {
      await api.saveWorkoutTemplate(activeSheet.id, {
        name: templateName || activeSheet.name,
      })
      setIsTemplateModalOpen(false)
      setTemplateName('')
      await loadSheets()
      alert('Template salvo com sucesso!')
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar template')
    }
  }

  const handleImportTemplate = (template: WorkoutTemplate) => {
    if (template.structure?.workouts) {
      setBuilderWorkouts(template.structure.workouts)
      setSheetName(template.name)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">Carregando fichas de treino...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <Dumbbell className="mr-2 h-5 w-5 text-indigo-600" />
            Fichas de Treino e Prescrição
          </h3>
          <p className="text-xs text-slate-500">Divisões em letras (A, B, C), bi-sets e cronômetros de descanso</p>
        </div>

        <div className="flex items-center gap-2">
          {activeSheet && (
            <Button variant="outline" size="sm" onClick={() => setIsTemplateModalOpen(true)}>
              <Bookmark className="mr-1.5 h-4 w-4" />
              Salvar como Template
            </Button>
          )}
          <Button size="sm" onClick={() => setIsBuilderOpen(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Ficha de Treino
          </Button>
        </div>
      </div>

      {/* Active Sheet View */}
      {activeSheet ? (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Ficha Vigente</span>
              <h4 className="text-lg font-bold text-slate-900 mt-1">{activeSheet.name}</h4>
              {activeSheet.expiresAt && (
                <span className="text-xs text-slate-500 flex items-center mt-0.5">
                  <Clock className="mr-1 h-3.5 w-3.5 text-slate-400" />
                  Vence em: {new Date(activeSheet.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSheet.workouts?.map((w) => (
              <div key={w.id || w.letter} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white text-xs">{w.letter}</span>
                  <span className="font-bold text-sm text-slate-800">{w.name}</span>
                </div>

                <div className="space-y-3">
                  {w.blocks?.map((b, bIdx) => (
                    <div key={b.id || bIdx} className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            b.type === 'BISET' ? 'bg-purple-100 text-purple-800' : b.type === 'TRISET' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {b.type}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">{b.restTimeSeconds}s descanso</span>
                      </div>

                      <div className="space-y-2">
                        {b.exercises?.map((e, eIdx) => (
                          <div key={e.id || eIdx} className="border-t border-slate-100 pt-1.5 first:border-0 first:pt-0">
                            <span className="font-semibold text-xs text-slate-800 block">{e.exerciseName}</span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>{e.sets} séries</span>
                              <span>•</span>
                              <span>{e.reps} reps</span>
                              {e.suggestedLoadKg && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-emerald-700">{e.suggestedLoadKg} kg</span>
                                </>
                              )}
                            </div>
                            {e.executionNotes && <p className="text-[10px] text-slate-400 italic mt-0.5">{e.executionNotes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center text-slate-500">
          <Dumbbell className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-medium">Nenhuma ficha de treino cadastrada.</p>
          <Button onClick={() => setIsBuilderOpen(true)} size="sm" className="mt-4 bg-indigo-600 text-white">
            Criar Primeira Ficha
          </Button>
        </Card>
      )}

      {/* Sheets History */}
      {sheets.length > 1 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center">
            <Clock className="mr-2 h-4 w-4 text-slate-400" />
            Histórico de Fichas Anteriores ({sheets.length - 1})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sheets
              .filter((s) => s.id !== activeSheet?.id)
              .map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSheet(s)}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-semibold text-sm text-slate-800">{s.name}</h5>
                    <p className="text-xs text-slate-500">
                      {s.workouts?.length || 0} divisões • Criada em {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Construtor de Ficha de Treino</h3>
                <p className="text-xs text-slate-500">Prescreva treinos em letras, blocos e séries para {client.name}</p>
              </div>

              {templates.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Template:</span>
                  <select
                    onChange={(e) => {
                      const t = templates.find((tmp) => tmp.id === e.target.value)
                      if (t) handleImportTemplate(t)
                    }}
                    className="text-xs border border-slate-200 rounded p-1.5 bg-white"
                  >
                    <option value="">Importar Template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Nome da Ficha</Label>
                <Input value={sheetName} onChange={(e) => setSheetName(e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Validade da Ficha</Label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="text-sm" />
              </div>
            </div>

            {/* Workouts Builder */}
            <div className="space-y-4">
              {builderWorkouts.map((w, wIdx) => (
                <div key={wIdx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white text-xs">{w.letter}</span>
                      <Input
                        value={w.name}
                        onChange={(e) => {
                          const upd = [...builderWorkouts]
                          upd[wIdx].name = e.target.value
                          setBuilderWorkouts(upd)
                        }}
                        className="text-sm font-semibold h-8 w-64 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAddBlock(wIdx, 'REGULAR')}>
                        + Bloco Regular
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleAddBlock(wIdx, 'BISET')}>
                        + Bi-set
                      </Button>
                    </div>
                  </div>

                  {/* Blocks */}
                  <div className="space-y-3">
                    {w.blocks.map((b, bIdx) => (
                      <div key={bIdx} className="rounded-lg bg-white p-3 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                          <span className="font-bold text-indigo-700">
                            Bloco #{bIdx + 1} ({b.type})
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Descanso (s):</span>
                            <Input
                              type="number"
                              value={b.restTimeSeconds}
                              onChange={(e) => {
                                const upd = [...builderWorkouts]
                                upd[wIdx].blocks[bIdx].restTimeSeconds = parseInt(e.target.value) || 60
                                setBuilderWorkouts(upd)
                              }}
                              className="w-16 h-7 text-xs"
                            />
                          </div>
                        </div>

                        {/* Exercises in Block */}
                        <div className="space-y-2">
                          {b.exercises.map((ex, exIdx) => (
                            <div key={exIdx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs">
                              <Input
                                placeholder="Nome do exercício"
                                value={ex.exerciseName}
                                onChange={(e) => {
                                  const upd = [...builderWorkouts]
                                  upd[wIdx].blocks[bIdx].exercises[exIdx].exerciseName = e.target.value
                                  setBuilderWorkouts(upd)
                                }}
                                className="sm:col-span-2 h-8 text-xs"
                              />
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  placeholder="Séries"
                                  value={ex.sets}
                                  onChange={(e) => {
                                    const upd = [...builderWorkouts]
                                    upd[wIdx].blocks[bIdx].exercises[exIdx].sets = parseInt(e.target.value) || 3
                                    setBuilderWorkouts(upd)
                                  }}
                                  className="w-16 h-8 text-xs"
                                />
                                <Input
                                  placeholder="Reps (ex: 8-10)"
                                  value={ex.reps}
                                  onChange={(e) => {
                                    const upd = [...builderWorkouts]
                                    upd[wIdx].blocks[bIdx].exercises[exIdx].reps = e.target.value
                                    setBuilderWorkouts(upd)
                                  }}
                                  className="w-24 h-8 text-xs"
                                />
                              </div>
                              <Input
                                type="number"
                                placeholder="Carga kg"
                                value={ex.suggestedLoadKg || ''}
                                onChange={(e) => {
                                  const upd = [...builderWorkouts]
                                  upd[wIdx].blocks[bIdx].exercises[exIdx].suggestedLoadKg = parseFloat(e.target.value) || undefined
                                  setBuilderWorkouts(upd)
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={handleAddWorkoutLetter} className="w-full">
                <Plus className="mr-1.5 h-4 w-4" /> Adicionar Treino ({builderWorkouts.length === 1 ? 'Treino B' : 'Próximo Treino'})
              </Button>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSheet} className="bg-indigo-600 text-white hover:bg-indigo-700">
                Salvar Ficha de Treino
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Save Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900">Salvar como Template</h3>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Nome do Template</Label>
              <Input placeholder="Ex: Treino ABC Hipertrofia Intermediário" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="mt-1 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAsTemplate} className="bg-indigo-600 text-white">
                Salvar Template
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
