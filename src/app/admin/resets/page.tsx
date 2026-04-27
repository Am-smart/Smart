"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PasswordReset } from "@/components/admin/PasswordReset";
import { UserDTO } from '@/lib/dto/auth.dto';
import { getUsers } from '@/lib/api-actions';

export default function ResetsPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);

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
