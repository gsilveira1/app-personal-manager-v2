
import React, { useState } from 'react';
import { useStore } from '../store';
import { Client, ClientStatus, ClientType, CheckInFrequency, Plan } from '../types';
import { Card, Button, Input, Badge, Select, Label } from '../components/ui';
import { Search, Plus, MoreHorizontal, Phone, Mail, Globe, MapPin, Eye, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WEEKS_IN_MONTH = 4.33;

const calculateMonthlyPrice = (plan: Plan) => {
  return plan.pricePerSession * plan.sessionsPerWeek * WEEKS_IN_MONTH;
};

export const Clients = () => {
  const { clients, plans, addClient } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search clients..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1" />
        </div>
        
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClients.map((client) => {
                const clientPlan = plans.find(p => p.id === client.planId);
                return (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/clients/${client.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img src={client.avatar} alt={client.name} className="h-10 w-10 rounded-full bg-slate-200 object-cover" />
                      <div>
                        <div className="font-medium text-slate-900">{client.name}</div>
                        <div className="text-slate-500 text-xs">ID: #{client.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={client.status === ClientStatus.Active ? 'success' : 'default'}>
                      {client.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                      {clientPlan ? (
                          <div className="flex items-center gap-1.5">
                              <Wallet className="h-3 w-3 text-slate-400" />
                              <span className="font-medium text-slate-700">{clientPlan.name}</span>
                          </div>
                      ) : (
                          <span className="text-slate-400 italic">No Plan</span>
                      )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-slate-600">
                        {client.type === 'Online' ? (
                            <Globe className="h-3 w-3 mr-1.5 text-indigo-500" />
                        ) : (
                            <MapPin className="h-3 w-3 mr-1.5 text-emerald-500" />
                        )}
                        {client.type}
                    </div>
                    {client.type === 'Online' && client.checkInFrequency && (
                        <div className="text-xs text-slate-400 mt-1">
                            {client.checkInFrequency} Check-ins
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-slate-600">
                        <Mail className="h-3 w-3 mr-2" />
                        {client.email}
                      </div>
                      <div className="flex items-center text-slate-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clients/${client.id}`);
                    }}>
                        <Eye className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                    </Button>
                  </td>
                </tr>
              )}})}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No clients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <AddClientModal onClose={() => setIsModalOpen(false)} onSave={addClient} />
      )}
    </div>
  );
};

const AddClientModal = ({ onClose, onSave }: { onClose: () => void; onSave: (c: Client) => void }) => {
  const { plans } = useStore();
  const [clientType, setClientType] = useState<ClientType>('In-Person');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      status: formData.get('status') as ClientStatus,
      type: clientType,
      checkInFrequency: clientType === 'Online' ? formData.get('frequency') as CheckInFrequency : undefined,
      goal: formData.get('goal') as string,
      avatar: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
      planId: formData.get('planId') as string
    };
    onSave(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required placeholder="John Doe" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required placeholder="+1 555 0000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status">
                <option value={ClientStatus.Active}>Active</option>
                <option value={ClientStatus.Inactive}>Inactive</option>
                <option value={ClientStatus.Lead}>Lead</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                id="type" 
                name="type" 
                value={clientType} 
                onChange={(e) => setClientType(e.target.value as ClientType)}
              >
                <option value="In-Person">In-Person</option>
                <option value="Online">Online</option>
              </Select>
            </div>
          </div>
          
          {clientType === 'Online' && (
             <div className="space-y-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
               <Label htmlFor="frequency" className="text-indigo-900">Plan Check-in Frequency</Label>
               <Select id="frequency" name="frequency" className="border-indigo-200 focus:ring-indigo-500">
                 <option value="Weekly">Weekly</option>
                 <option value="Bi-weekly">Bi-weekly</option>
                 <option value="Monthly">Monthly</option>
               </Select>
               <p className="text-xs text-indigo-600 mt-1">This determines the follow-up schedule.</p>
             </div>
          )}

          <div className="space-y-2">
             <Label htmlFor="planId">Subscription Plan</Label>
             <Select id="planId" name="planId" required>
                 <option value="">Select a plan...</option>
                 {plans.map(plan => (
                     <option key={plan.id} value={plan.id}>
                         {plan.name} (${calculateMonthlyPrice(plan).toFixed(2)}/mo)
                     </option>
                 ))}
             </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Primary Goal</Label>
            <Input id="goal" name="goal" placeholder="e.g. Weight Loss" />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Client</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
