import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { PlannerItem } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '../AppContext';
import { useAuth } from '../auth/AuthContext';

interface PlannerViewProps {
  userId: string;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ userId }) => {
  const { client } = useSupabase();
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const { isOnline, addToQueue, setCache, getCache } = useIndexedDB();
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlanner = useCallback(async () => {
    setIsLoading(true);

    const cached = await getCache<PlannerItem[]>('planner_items');
    if (cached) setItems(cached);

    if (isOnline) {
        const { data } = await client
          .from('planner')
          .select('*')
          .eq('user_id', userId)
          .order('due_date', { ascending: true });

        if (data) {
            setItems((data as PlannerItem[]));
            await setCache('planner_items', data);
        }
    }
    setIsLoading(false);
  }, [userId, client, isOnline, getCache, setCache]);

  useEffect(() => {
    fetchPlanner();
  }, [fetchPlanner]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem) return;

    const payload = {
      id: Math.random().toString(),
      user_id: userId,
      title: newItem,
      due_date: dueDate || null,
      completed: false,
      created_at: new Date().toISOString()
    };

    if (isOnline) {
        const { error } = await client.from('planner').insert([payload]);
        if (!error) {
          setNewItem('');
          setDueDate('');
          fetchPlanner();
          addToast('Task added!', 'success');
        }
    } else {
        await addToQueue('PLANNER_UPDATE', payload, user?.sessionId);
        setItems(prev => [...prev, payload as PlannerItem]);
        setNewItem('');
        setDueDate('');
        addToast('Task queued offline.', 'info');
    }
  };

  const toggleComplete = async (item: PlannerItem) => {
    const updated = { ...item, completed: !item.completed };
    if (isOnline) {
        const { error } = await client
          .from('planner')
          .update({ completed: !item.completed })
          .eq('id', item.id);
        if (!error) fetchPlanner();
    } else {
        await addToQueue('PLANNER_UPDATE', updated, user?.sessionId);
        setItems(prev => prev.map(i => i.id === item.id ? updated : i));
        addToast('Change queued offline.', 'info');
    }
  };

  const deleteItem = async (id: string) => {
    if (!isOnline) {
        addToast('Cannot delete tasks while offline.', 'error');
        return;
    }
    const { error } = await client.from('planner').delete().eq('id', id);
    if (!error) fetchPlanner();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Personal Study Planner</h2>
        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1 rounded-full">
            {items.filter(i => !i.completed).length} Tasks Pending
        </span>
      </div>

      <form onSubmit={addItem} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="What's your next study goal?"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          className="flex-1 min-w-[200px] p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
        />
        <button type="submit" className="btn-primary px-8">Add Task</button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading your planner...</div>
        ) : items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {items.map(item => (
              <div key={item.id} className={`p-4 flex items-center gap-4 group hover:bg-slate-50 transition-colors ${item.completed ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleComplete(item)}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className={`font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{item.title}</div>
                  {item.due_date && (
                    <div className="text-xs text-slate-500 mt-1">Due: {new Date(item.due_date).toLocaleDateString()}</div>
                  )}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 italic">No tasks yet. Start planning your study schedule!</div>
        )}
      </div>
    </div>
  );
};
