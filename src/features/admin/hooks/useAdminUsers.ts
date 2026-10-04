import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../api/adminApi";
import type { AdminUserResponse, UserFilterParams } from "../types/admin.types";

export function useAdminUsers(initialFilters?: UserFilterParams) {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [filters, setFilters] = useState<UserFilterParams>(initialFilters || {});
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(async (customFilters?: UserFilterParams) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const res = await adminApi.getUsers(customFilters || filters);
      setUsers(res?.content || []);
      setTotalElements(res?.totalElements || 0);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách người dùng.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserStatus = async (id: string, status: "ACTIVE" | "BLOCKED", reason?: string) => {
    await adminApi.updateUserStatus(id, { status, reason });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  const isEmpty = !isLoading && !isError && users.length === 0;

  return {
    users,
    totalElements,
    filters,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    setFilters,
    refetch: fetchUsers,
    updateUserStatus,
  };
}
