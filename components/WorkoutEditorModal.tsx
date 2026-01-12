import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Card, Button, Input, Label } from './ui';
import { X, Plus, Trash2, Save, Dumbbell, ArrowUp, ArrowDown, Flame, Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { WorkoutPlan, WorkoutExercise, Client } from '../types';
import { generateWorkoutInsights } from '../services/geminiService';

interface WorkoutEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workout: WorkoutPlan) => void;
  initialData?: WorkoutPlan | null;
  client?: Client; // Changed from clientId to full client object
}

export const WorkoutEditorModal = ({ isOpen, onClose, onSave, initialData, client }: WorkoutEditorModalProps) => {
  const { evaluations, workouts: allWorkouts, aiPromptInstructions } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insights, setInsights] = useState<any[] | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || '');
        setTags(initialData.tags.join(', '));
        setExercises(initialData.exercises);
      } else {
        // Reset for new
        setTitle('');
        setDescription('');
        setTags('');
        setExercises([{ name: '', sets: 3, reps: '10', notes: '', isWarmup: false }]);
      }
      // Reset insights when modal opens
      setInsights(null);
      setInsightError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleGetInsights = async () => {
    if (!client) return;

    setIsLoadingInsights(true);
    setInsightError(null);
    try {
        const clientEvaluations = evaluations.filter(e => e.clientId === client.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const archivedPlans = allWorkouts.filter(w => w.clientId === client.id && w.status === 'Archived');
        
        const generatedInsights = await generateWorkoutInsights({
            client,
            latestEvaluation: clientEvaluations[0],
            archivedPlans,
            customInstructions: aiPromptInstructions,
        });
        setInsights(generatedInsights.insights || []);
    } catch (error: any) {
        setInsightError(error.message || 'An unknown error occurred.');
    } finally {
        setIsLoadingInsights(false);
    }
  };

  const handleAddSuggestion = (suggestedExercise: WorkoutExercise) => {
    const newExercise: WorkoutExercise = {
        name: suggestedExercise.name || '',
        sets: suggestedExercise.sets || 3,
        reps: suggestedExercise.reps || '10',
        notes: suggestedExercise.notes || '',
        isWarmup: false,
    };
    setExercises(prev => [...prev, newExercise]);
  };


  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: '10', notes: '', isWarmup: false }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === exercises.length - 1)) return;
    
    const newExercises = [...exercises];
    const temp = newExercises[index];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    newExercises[index] = newExercises[targetIndex];
    newExercises[targetIndex] = temp;
    setExercises(newExercises);
  };

  const handleExerciseChange = (index: number, field: keyof WorkoutExercise, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t !== '');
    
    const workout: WorkoutPlan = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      clientId: client?.id || initialData?.clientId, // Maintain existing or set new
      title,
      description,
      tags: tagArray,
      exercises,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      status: initialData?.status || 'Active'
    };

    onSave(workout);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-3xl bg-white shadow-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-lg">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit Workout' : 'Create New Workout'}
            {client && <span className="text-base font-normal text-slate-500 ml-2">for {client.name}</span>}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="title">Plan Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Upper Body Power" /></div>
            <div className="space-y-2"><Label htmlFor="tags">Tags (comma separated)</Label><Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Strength, Hypertrophy, 45min" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief overview of the workout goals..." /></div>
          
          {(insights || insightError) && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg animate-in fade-in">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-indigo-900 flex items-center"><Lightbulb className="h-4 w-4 mr-2 text-indigo-500" /> AI Suggestions</h4>
                <button type="button" onClick={() => { setInsights(null); setInsightError(null); }} className="text-indigo-400 hover:text-indigo-600"><X className="h-4 w-4" /></button>
              </div>
              {insightError ? (
                  <p className="text-sm text-red-700">{insightError}</p>
              ) : insights && insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div key={index} className="flex items-start justify-between gap-3 p-3 bg-white rounded border border-indigo-200/50 shadow-sm">
                        <div className="flex-1">
                          <p className="font-semibold text-indigo-900 text-sm">
                            {insight.suggestion.name} ({insight.suggestion.sets}x{insight.suggestion.reps})
                          </p>
                          <p className="text-xs text-indigo-700 mt-1">{insight.reason}</p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 w-8 p-0 shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                          onClick={() => handleAddSuggestion(insight.suggestion)}
                          title={`Add ${insight.suggestion.name} to workout`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
              ) : null}
            </div>
          )}

          <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <Label className="text-base flex items-center gap-2"><Dumbbell className="h-4 w-4 text-indigo-600" /> Exercises & Warm-ups</Label>
                <div className="flex items-center gap-2">
                  {client && (
                    <Button type="button" variant="secondary" onClick={handleGetInsights} disabled={isLoadingInsights} className="py-1 px-3 text-xs h-8">
                      {isLoadingInsights ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      Get AI Suggestions
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={handleAddExercise} className="py-1 px-3 text-xs h-8"><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
                </div>
             </div>

             <div className="space-y-3">
               {exercises.map((exercise, index) => (
                 <div key={index} className={`flex flex-col sm:flex-row gap-3 items-start p-4 rounded-lg border transition-all hover:border-indigo-300 ${exercise.isWarmup ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex sm:flex-col gap-1 sm:mt-6 mr-1"><button type="button" onClick={() => handleMoveExercise(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => handleMoveExercise(index, 'down')} disabled={index === exercises.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"><ArrowDown className="h-4 w-4" /></button></div>
                    <div className="flex-1 w-full grid gap-3"><div className="flex items-center justify-between"><label className={`flex items-center gap-2 cursor-pointer text-xs font-semibold px-2 py-1 rounded border transition-colors ${exercise.isWarmup ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><input type="checkbox" checked={!!exercise.isWarmup} onChange={(e) => handleExerciseChange(index, 'isWarmup', e.target.checked)} className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-3 w-3" /><span className="flex items-center"><Flame className={`h-3 w-3 mr-1 ${exercise.isWarmup ? 'fill-orange-500' : ''}`} /> Warm-up</span></label><button type="button" onClick={() => handleRemoveExercise(index)} className="text-slate-400 hover:text-red-500 p-1" title="Remove Item"><Trash2 className="h-4 w-4" /></button></div><div className="flex flex-col sm:flex-row gap-3"><div className="flex-1 space-y-1"><Label className="text-xs text-slate-500">{exercise.isWarmup ? 'Warm-up Activity' : 'Exercise Name'}</Label><Input value={exercise.name} onChange={(e) => handleExerciseChange(index, 'name', e.target.value)} placeholder={exercise.isWarmup ? "e.g. Treadmill" : "e.g. Bench Press"} required className="bg-white" /></div><div className="flex gap-2 w-full sm:w-auto"><div className="w-20 space-y-1"><Label className="text-xs text-slate-500">Sets</Label><Input type="number" value={exercise.sets} onChange={(e) => handleExerciseChange(index, 'sets', Number(e.target.value))} min={1} className="bg-white" /></div><div className="w-24 space-y-1"><Label className="text-xs text-slate-500">Reps/Dur.</Label><Input value={exercise.reps} onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)} placeholder={exercise.isWarmup ? "5 min" : "10-12"} className="bg-white" /></div></div></div><div className="w-full space-y-1"><Label className="text-xs text-slate-500">{exercise.isWarmup ? 'Instructions / How-to' : 'Notes / Weight'}</Label><Input value={exercise.notes || ''} onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)} placeholder={exercise.isWarmup ? "Light jog at 6km/h" : "Rest 60s, 50kg..."} className="bg-white" /></div></div>
                 </div>
               ))}
               
               {exercises.length === 0 && (<div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50"><Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-20" /><p>No exercises added yet.</p><Button type="button" variant="ghost" onClick={handleAddExercise} className="mt-2 text-indigo-600 hover:text-indigo-700">Add First Item</Button></div>)}
             </div>
          </div>
        </form>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
           <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
           <Button type="submit" onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700"><Save className="h-4 w-4 mr-2" /> Save Workout</Button>
        </div>
      </Card>
    </div>
  );
};