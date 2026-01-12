import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Plan } from '../types';
import { Card, Button, Input, Label, Select } from '../components/ui';
import { DollarSign, Trash2, Edit2, Plus, X, Repeat, Clock, Bot } from 'lucide-react';

const WEEKS_IN_MONTH = 4.33;

const calculateMonthlyPrice = (plan: Plan) => {
  return plan.pricePerSession * plan.sessionsPerWeek * WEEKS_IN_MONTH;
};

export const Settings = () => {
  const { plans, addPlan, updatePlan, deletePlan, aiPromptInstructions, updateAiPromptInstructions } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const handleCreate = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this plan? This will also unassign it from any clients.')) {
      deletePlan(id);
    }
  };
  
  const handleSave = (planData: Omit<Plan, 'id'>) => {
    if (editingPlan) {
      updatePlan(editingPlan.id, planData);
    } else {
      addPlan({ ...planData, id: Math.random().toString(36).substr(2, 9) });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <Card>
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <Bot className="mr-3 h-5 w-5 text-indigo-600" />
                AI Custom Instructions
            </h2>
            <p className="text-sm text-slate-500 mt-1">
                Provide general instructions for the AI to consider when generating workout insights. This is optional.
            </p>
        </div>
        <div className="p-6">
            <Label htmlFor="ai-instructions">General Prompt Instructions</Label>
            <textarea
                id="ai-instructions"
                name="ai-instructions"
                rows={5}
                className="mt-2 w-full p-3 text-sm border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 ring-offset-white focus-visible:outline-none placeholder:text-slate-500"
                placeholder="e.g., Always include at least one compound movement. Prioritize free weights over machines. Focus on exercises that are safe for clients with lower back pain."
                value={aiPromptInstructions}
                onChange={(e) => updateAiPromptInstructions(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-2">Changes are saved automatically.</p>
        </div>
      </Card>
      
      <Card>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Subscription Plans</h2>
            <p className="text-sm text-slate-500">Create and manage your client subscription packages.</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Plan
          </Button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              onEdit={() => handleEdit(plan)} 
              onDelete={() => handleDelete(plan.id)}
            />
          ))}
        </div>
      </Card>

      {isModalOpen && (
        <PlanEditorModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={editingPlan}
        />
      )}
    </div>
  );
};

interface PlanCardProps {
  plan: Plan;
  onEdit: () => void;
  onDelete: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onEdit, onDelete }) => {
  const monthlyPrice = calculateMonthlyPrice(plan);

  return (
    <Card className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-slate-50">
      <div className="p-6">
        <div className="flex justify-between items-start">
           <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
           <div className="flex items-center space-x-1">
             <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}><Edit2 className="h-4 w-4 text-slate-500" /></Button>
             <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDelete}><Trash2 className="h-4 w-4 text-red-500" /></Button>
           </div>
        </div>
        
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-center">
            <Repeat className="h-4 w-4 mr-3 text-indigo-500" />
            <span><strong>{plan.sessionsPerWeek}</strong> sessions / week</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-3 text-indigo-500" />
            <span><strong>{plan.sessionDurationMinutes}</strong> min / session</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-3 text-indigo-500" />
            <span><strong>${plan.pricePerSession}</strong> / session</span>
          </div>
        </div>
      </div>
      <div className="bg-slate-800 text-white p-4 rounded-b-lg mt-4 text-center">
         <p className="text-sm opacity-80">Estimated Monthly</p>
         <p className="text-2xl font-bold">${monthlyPrice.toFixed(2)}</p>
      </div>
    </Card>
  );
};

const PlanEditorModal = ({ isOpen, onClose, onSave, initialData }: { isOpen: boolean; onClose: () => void; onSave: (p: Omit<Plan, 'id'>) => void; initialData: Plan | null }) => {
  const [plan, setPlan] = useState({
    name: '',
    sessionsPerWeek: 2,
    sessionDurationMinutes: 60,
    pricePerSession: 40,
  });

  useEffect(() => {
    if (initialData) {
      setPlan(initialData);
    } else {
      setPlan({
        name: '',
        sessionsPerWeek: 2,
        sessionDurationMinutes: 60,
        pricePerSession: 40,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPlan(prev => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(plan);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">{initialData ? 'Edit Plan' : 'Create New Plan'}</h2>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input id="name" name="name" value={plan.name} onChange={handleChange} required placeholder="e.g., Hybrid Starter" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionsPerWeek">Sessions / Week</Label>
              <Input id="sessionsPerWeek" name="sessionsPerWeek" type="number" value={plan.sessionsPerWeek} onChange={handleChange} required min="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionDurationMinutes">Duration (min)</Label>
              <Select id="sessionDurationMinutes" name="sessionDurationMinutes" value={plan.sessionDurationMinutes} onChange={handleChange}>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricePerSession">Price / Session ($)</Label>
            <Input id="pricePerSession" name="pricePerSession" type="number" step="0.5" value={plan.pricePerSession} onChange={handleChange} required min="0" />
          </div>
          <div className="bg-indigo-50 text-indigo-800 p-4 rounded-md text-center border border-indigo-100">
            <p className="text-sm font-medium">Estimated Monthly Total</p>
            <p className="text-2xl font-bold">${calculateMonthlyPrice(plan).toFixed(2)}</p>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Plan</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};