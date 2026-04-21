"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getUsers } from '@/lib/data-actions';
import { PasswordReset } from "@/components/admin/PasswordReset";
import { User } from '@/lib/types';

export default function ResetsPage() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = useCallback(async () => {
      const data = await getUsers();
      setUsers(data.filter(u => u.reset_request) || []);
  }, []);

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
