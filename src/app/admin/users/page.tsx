"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { UserManagement } from "@/components/admin/UserManagement";
import { UserEditor } from "@/components/admin/UserEditor";
import { User } from '@/lib/types';
import { saveUser, deleteUser } from '@/lib/data-actions';

export default function UsersPage() {
  const { client } = useSupabase();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchUsers = useCallback(async () => {
      const { data } = await client.from('users').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
  }, [client]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (isAdding || editingUser) {
      return (
          <UserEditor
              user={editingUser || undefined}
              onSave={() => { setEditingUser(null); setIsAdding(false); fetchUsers(); }}
              onCancel={() => { setEditingUser(null); setIsAdding(false); }}
          />
      );
  }

  return (
    <UserManagement
        users={users}
        onEdit={setEditingUser}
        onDelete={async (id) => {
            if (!confirm('Are you sure you want to delete this user?')) return;
            await deleteUser(id);
            fetchUsers();
        }}
        onUpdate={async (id, updates) => {
            const res = await saveUser({ ...updates, id });
            if (res.success) fetchUsers();
        }}
        onAdd={() => setIsAdding(true)}
    />
  );
}
