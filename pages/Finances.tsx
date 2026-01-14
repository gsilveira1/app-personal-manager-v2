import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { PaymentStatus, PaymentMethod, FinanceRecord, TransactionType } from '../types';
import { Card, Badge, Button, Input, Select, Label } from '../components/ui';
import { DollarSign, Download, Filter, Search, PlusCircle, CheckCircle2, AlertCircle, X, ShoppingBag, Wallet } from 'lucide-react';
// FIX: Switched to individual submodule imports for date-fns functions to resolve module resolution errors.
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import startOfDay from 'date-fns/startOfDay';
import endOfDay from 'date-fns/endOfDay';
import subMonths from 'date-fns/subMonths';
import isSameMonth from 'date-fns/isSameMonth';
import { Link, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const Finances = () => {
  const { finances, clients, products, plans, generateMonthlyInvoices, markFinanceRecordPaid, addFinanceRecord } = useStore();
  const [searchParams] = useSearchParams();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Initialize filters based on URL params (e.g. coming from ClientDetails)
  const [filters, setFilters] = useState({
    status: 'All',
    method: 'All',
    search: '',
    clientId: searchParams.get('clientId') || 'All'
  });

  // Chart Timeframe State
  const [chartViewDate, setChartViewDate] = useState(new Date());

  const filteredFinances = useMemo(() => {
    return finances.filter(record => {
      const recordDate = parseISO(record.date);
      
      const clientName = clients.find(c => c.id === record.clientId)?.name.toLowerCase() || '';
      
      // Filter Logic
      const matchesSearch = filters.search === '' || 
        clientName.includes(filters.search.toLowerCase()) ||
        record.description.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'All' || record.status === filters.status;
      const matchesMethod = filters.method === 'All' || record.method === filters.method;
      const matchesClient = filters.clientId === 'All' || record.clientId === filters.clientId;

      let matchesDate = true;
      if (dateRange.start) matchesDate = matchesDate && recordDate >= startOfDay(parseISO(dateRange.start));
      if (dateRange.end) matchesDate = matchesDate && recordDate <= endOfDay(parseISO(dateRange.end));

      return matchesSearch && matchesStatus && matchesMethod && matchesClient && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [finances, clients, dateRange, filters]);

  // --- Chart Data Preparation ---
  const revenueTrendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(chartViewDate, i);
        const monthLabel = format(d, 'MMM');
        const monthTotal = finances
            .filter(f => isSameMonth(parseISO(f.date), d) && f.status === PaymentStatus.Paid)
            .reduce((acc, curr) => acc + curr.amount, 0);
        data.push({ name: monthLabel, amount: monthTotal });
    }
    return data;
  }, [finances, chartViewDate]);

  const compositionData = useMemo(() => {
      const subscriptions = finances
        .filter(f => f.type === 'Subscription' && f.status === PaymentStatus.Paid)
        .reduce((acc, curr) => acc + curr.amount, 0);
      const products = finances
        .filter(f => f.type === 'OneTime' && f.status === PaymentStatus.Paid)
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      return [
          { name: 'Subscriptions', value: subscriptions },
          { name: 'Products', value: products }
      ];
  }, [finances]);
  
  const COLORS = ['#4f46e5', '#10b981']; // Indigo, Emerald

  // --- Totals ---
  const totalRevenue = filteredFinances.filter(f => f.status === PaymentStatus.Paid).reduce((acc, curr) => acc + curr.amount, 0);
  const pendingAmount = filteredFinances.filter(f => f.status === PaymentStatus.Pending).reduce((acc, curr) => acc + curr.amount, 0);

  const handleGenerateInvoices = () => {
    generateMonthlyInvoices();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Finances</h1>
            <p className="text-slate-500 text-sm">Track payments, subscriptions, and one-time sales.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full xl:w-auto">
             <Button onClick={() => setIsTransactionModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap">
                <PlusCircle className="mr-2 h-4 w-4" /> New Transaction
             </Button>
             <Button onClick={handleGenerateInvoices} variant="secondary" className="whitespace-nowrap">
                <Wallet className="mr-2 h-4 w-4" /> Run Monthly Invoices
             </Button>
             
             <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Search..." 
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
            </div>
            <Button variant={isFilterOpen ? "secondary" : "outline"} onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
        </div>

        {isFilterOpen && (
            <Card className="p-4 bg-slate-50 border-slate-200 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Date Range</Label>
                        <div className="flex items-center gap-2">
                            <Input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} className="w-full"/>
                            <span className="text-slate-400">-</span>
                            <Input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} className="w-full"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={filters.status} onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}>
                            <option value="All">All Statuses</option>
                            {Object.values(PaymentStatus).map(status => <option key={status} value={status}>{status}</option>)}
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <Select value={filters.clientId} onChange={(e) => setFilters(prev => ({...prev, clientId: e.target.value}))}>
                            <option value="All">All Clients</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <Button variant="ghost" onClick={() => { setDateRange({ start: '', end: '' }); setFilters({ status: 'All', method: 'All', search: '', clientId: 'All' }); }} className="text-slate-500 hover:text-slate-700">
                        Reset Filters
                    </Button>
                </div>
            </Card>
        )}
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-slate-900">Revenue Trend (6 Months)</h3>
                  <div className="flex items-center text-sm text-slate-500">
                      <span className="bg-indigo-100 w-3 h-3 rounded-full mr-2"></span> Paid Revenue
                  </div>
              </div>
              <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                          <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Total Revenue</h3>
                <div className="text-3xl font-bold text-indigo-600">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-sm text-slate-500 mt-1">Based on current filters</div>
            </Card>
            
            <Card className="p-6 flex flex-col justify-center">
                 <h3 className="font-semibold text-slate-900 mb-4">Revenue Mix</h3>
                 <div className="h-[150px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                             <Pie data={compositionData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                 {compositionData.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                             </Pie>
                             <Tooltip />
                             <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                         </PieChart>
                     </ResponsiveContainer>
                 </div>
            </Card>
          </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-slate-900">Transaction History</h3>
          {filters.clientId !== 'All' && (
              <Badge variant="default" className="flex items-center gap-1">
                  Filtered by Client <button onClick={() => setFilters(prev => ({...prev, clientId: 'All'}))}><X className="h-3 w-3 ml-1"/></button>
              </Badge>
          )}
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFinances.map((record) => {
                const client = clients.find(c => c.id === record.clientId);
                return (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {format(parseISO(record.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {client ? (
                          <Link to={`/clients/${client.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                              {client.name}
                          </Link>
                      ) : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{record.description}</td>
                    <td className="px-6 py-4">
                        {record.type === 'Subscription' ? (
                            <Badge variant="default" className="bg-indigo-50 text-indigo-700">Plan</Badge>
                        ) : (
                            <Badge variant="default" className="bg-emerald-50 text-emerald-700">Product</Badge>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        record.status === PaymentStatus.Paid ? 'success' : 
                        record.status === PaymentStatus.Pending ? 'warning' : 'error'
                      }>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 whitespace-nowrap">
                      ${record.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                         {record.status !== PaymentStatus.Paid && (
                             <Button 
                                variant="ghost" 
                                className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => setPaymentModalOpen(record.id)}
                                title="Mark as Paid"
                             >
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Pay
                             </Button>
                         )}
                    </td>
                  </tr>
                );
              })}
              {filteredFinances.length === 0 && (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No transactions found matching your filters.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {paymentModalOpen && (
          <PaymentModal 
             isOpen={!!paymentModalOpen} 
             onClose={() => setPaymentModalOpen(null)}
             onConfirm={(method) => {
                 if (paymentModalOpen) {
                     markFinanceRecordPaid(paymentModalOpen, method);
                     setPaymentModalOpen(null);
                 }
             }}
          />
      )}
      
      {isTransactionModalOpen && (
          <NewTransactionModal 
            isOpen={isTransactionModalOpen}
            onClose={() => setIsTransactionModalOpen(false)}
            onSave={(record) => {
                addFinanceRecord(record);
                setIsTransactionModalOpen(false);
            }}
            clients={clients}
            products={products}
          />
      )}
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (m: PaymentMethod) => void }) => {
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.Pix);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <Card className="w-full max-w-sm bg-white p-6 shadow-xl">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-slate-900">Confirm Payment</h3>
                     <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
                 </div>
                 <p className="text-slate-500 text-sm mb-4">Select the method used for this payment:</p>
                 <div className="space-y-4">
                     <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                         {Object.values(PaymentMethod).map(m => (
                             <option key={m} value={m}>{m}</option>
                         ))}
                     </Select>
                     <div className="flex gap-2 justify-end pt-2">
                         <Button variant="outline" onClick={onClose}>Cancel</Button>
                         <Button onClick={() => onConfirm(method)}>Confirm Payment</Button>
                     </div>
                 </div>
             </Card>
        </div>
    )
}

const NewTransactionModal = ({ isOpen, onClose, onSave, clients, products }: any) => {
    const [clientId, setClientId] = useState(clients[0]?.id || '');
    const [productId, setProductId] = useState(products[0]?.id || '');
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const product = products.find((p: any) => p.id === productId);
        if (!product) return;

        const newRecord: FinanceRecord = {
            id: Math.random().toString(36).substr(2, 9),
            clientId,
            amount: product.price,
            date: new Date().toISOString(),
            status: PaymentStatus.Pending,
            method: PaymentMethod.Pix,
            description: `Product: ${product.name}`,
            type: 'OneTime',
            relatedId: product.id
        };
        onSave(newRecord);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <Card className="w-full max-w-md bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10">
                     <h3 className="text-lg font-bold text-slate-900">Sell Product / Service</h3>
                     <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
                 </div>
                 
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="space-y-2">
                        <Label>Client</Label>
                        <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                     </div>
                     
                     <div className="space-y-2">
                        <Label>Product or Service</Label>
                        <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                            {products.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                            ))}
                        </Select>
                        <p className="text-xs text-slate-500">One-time payment for stand-alone items.</p>
                     </div>

                     <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                         <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                         <Button type="submit">Create Transaction</Button>
                     </div>
                 </form>
             </Card>
        </div>
    );
};