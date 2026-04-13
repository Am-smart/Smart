"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserManagement } from '@/components/admin/UserManagement';
import { PasswordResetManager } from '@/components/admin/PasswordResetManager';
import { createSupabaseClient } from '@/lib/supabase';
import { User } from '@/lib/types';
import dynamic from 'next/dynamic';

const UserEditor = dynamic(() => import("@/components/admin/UserEditor").then(m => m.UserEditor), { ssr: false });

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const client = createSupabaseClient();

  const fetchUsers = useCallback(async () => {
    const { data } = await client.from('users').select('*').order('full_name');
    setUsers((data || []) as User[]);
  }, [client]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (email: string) => {
      if (confirm('Are you sure you want to delete this user?')) {
          await client.from('users').delete().eq('email', email);
          fetchUsers();
      }
  };

  return (
    <div className="space-y-8">
      {(editingUser || isAdding) && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
            <UserEditor
                user={editingUser || undefined}
                onSave={async () => { setEditingUser(null); setIsAdding(false); fetchUsers(); }}
                onCancel={() => { setEditingUser(null); setIsAdding(false); }}
            />
        </div>
      )}

      <PasswordResetManager />

      <UserManagement
        users={users}
        onAdd={() => setIsAdding(true)}
        onEdit={setEditingUser}
        onDelete={handleDelete}
      />
    </div>
  );
}
