"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { PasswordReset } from "@/components/admin/PasswordReset";
import { User } from '@/lib/types';

export default function ResetsPage() {
  const { client } = useSupabase();
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = useCallback(async () => {
      const { data } = await client.from('users').select('*').not('reset_request', 'is', null);
      setUsers(data || []);
  }, [client]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <PasswordReset
        users={users}
        onRefresh={fetchUsers}
    />
  );
}
