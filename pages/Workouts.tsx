import React, { useState } from 'react';
import { useStore } from '../store';
import { WorkoutPlan } from '../types';
import { Card, Button, Input, Label, Badge, Select } from '../components/ui';
import { generateWorkoutPlan } from '../services/geminiService';
import { Sparkles, Dumbbell, Clock, ChevronDown, ChevronUp, Loader2, Plus, Edit2, Trash2, Calendar, Flame } from 'lucide-react';
import { WorkoutEditorModal } from '../components/WorkoutEditorModal';
// FIX: Consolidate date-fns imports to resolve module resolution errors.
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';

export const Workouts = () => {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useStore();
  const [activeTab, setActiveTab] = useState<'library' | 'ai'>('library');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null);

  // Filter out client-specific prescriptions from the general library
  const libraryWorkouts = workouts.filter(w => !w.clientId);

  const handleCreate = () => {
    setEditingWorkout(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (workout: WorkoutPlan) => {
    setEditingWorkout(workout);
    setIsEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this workout template?')) {
      deleteWorkout(id);
    }
  };

  const handleSaveWorkout = (workout: WorkoutPlan) => {
    if (editingWorkout) {
      updateWorkout(workout.id, workout);
    } else {
      addWorkout(workout);
    }
    setIsEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Workouts Library</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'library' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Templates
          </button>
          <button 
             onClick={() => setActiveTab('ai')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'ai' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generator
          </button>
        </div>
      </div>

      {activeTab === 'library' ? (
        <WorkoutLibrary 
            workouts={libraryWorkouts} 
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
      ) : (
        <AIWorkoutGenerator onSave={(w) => {
          addWorkout(w);
          setActiveTab('library');
        }} />
      )}

      {isEditorOpen && (
        <WorkoutEditorModal 
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveWorkout}
          initialData={editingWorkout}
        />
      )}
    </div>
  );
};

interface WorkoutLibraryProps {
  workouts: WorkoutPlan[];
  onCreate: () => void;
  onEdit: (w: WorkoutPlan) => void;
  onDelete: (id: string) => void;
}

const WorkoutLibrary = ({ workouts, onCreate, onEdit, onDelete }: WorkoutLibraryProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {workouts.map(workout => (
        <Card key={workout.id} className="overflow-hidden flex flex-col">
          <div className="p-6 flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex items-center space-x-2">
                 <Badge>{workout.exercises.length} Items</Badge>
                 <div className="flex space-x-1">
                    <button 
                        onClick={() => onEdit(workout)} 
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Edit Template"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(workout.id)} 
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Template"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                 </div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{workout.title}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{workout.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {workout.tags.map(tag => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">#{tag}</span>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
            className="w-full py-2 bg-slate-50 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 flex items-center justify-center transition-colors"
          >
            {expandedId === workout.id ? (
              <>Hide Details <ChevronUp className="ml-1 h-3 w-3" /></>
            ) : (
              <>View {workout.exercises.length} Items <ChevronDown className="ml-1 h-3 w-3" /></>
            )}
          </button>
          
          {expandedId === workout.id && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 space-y-3">
              {workout.exercises.map((ex, idx) => (
                <div key={idx} className={`flex justify-between text-sm items-start border-b border-slate-200 pb-2 last:border-0 last:pb-0 ${ex.isWarmup ? 'bg-orange-50/50 -mx-2 px-2 rounded-md' : ''}`}>
                  <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {ex.isWarmup && <Flame className="h-3 w-3 text-orange-500 flex-shrink-0" />}
                        <span className={`font-medium ${ex.isWarmup ? 'text-orange-800' : 'text-slate-700'} block`}>{ex.name}</span>
                      </div>
                      {ex.notes && <span className="text-xs text-slate-400 block mt-0.5 italic">{ex.notes}</span>}
                  </div>
                  <span className="text-slate-500 font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap ml-2">
                    {ex.sets} x {ex.reps}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
      
      <button 
        onClick={onCreate}
        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all group min-h-[300px]"
      >
        <div className="bg-slate-100 p-4 rounded-full mb-3 group-hover:bg-white shadow-sm transition-all">
          <Plus className="h-6 w-6" />
        </div>
        <span className="font-medium text-lg">Create Template</span>
        <span className="text-sm opacity-70 mt-1">Design a new workout from scratch</span>
      </button>
    </div>
  );
};

const AIWorkoutGenerator = ({ onSave }: { onSave: (w: WorkoutPlan) => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const params = {
      clientName: formData.get('clientName') as string,
      goal: formData.get('goal') as string,
      experienceLevel: formData.get('level') as string,
      daysPerWeek: Number(formData.get('days')),
      limitations: formData.get('limitations') as string,
    };

    try {
      const result = await generateWorkoutPlan(params);
      
      const newWorkout: WorkoutPlan = {
        id: Math.random().toString(36).substr(2, 9),
        title: result.title || `Workout for ${params.clientName}`,
        description: result.description || `Generated plan focused on ${params.goal}`,
        exercises: result.exercises || [],
        tags: result.tags || ['AI Generated'],
        createdAt: new Date().toISOString(),
        status: 'Active'
      };
      
      onSave(newWorkout);
    } catch (err) {
      setError('Failed to generate workout. Check API key or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4">
             <Sparkles className="h-8 w-8 text-indigo-600" />
           </div>
           <h2 className="text-2xl font-bold text-slate-900">AI Workout Generator</h2>
           <p className="text-slate-500 mt-2">Describe your client's needs, and let Gemini craft the perfect session.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" name="clientName" placeholder="e.g. Sarah" required />
            </div>
            <div className="space-y-2">
               <Label htmlFor="level">Experience Level</Label>
               <Select id="level" name="level">
                 <option value="Beginner">Beginner</option>
                 <option value="Intermediate">Intermediate</option>
                 <option value="Advanced">Advanced</option>
               </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Primary Goal</Label>
            <Input id="goal" name="goal" placeholder="e.g. Improve 5k time, Build Glutes" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <Label htmlFor="days">Frequency (Days/Week)</Label>
               <Input id="days" name="days" type="number" min="1" max="7" defaultValue="3" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="limitations">Limitations / Injuries</Label>
              <Input id="limitations" name="limitations" placeholder="Optional (e.g. Knee pain)" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Plan...</>
            ) : (
              'Generate Workout'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};