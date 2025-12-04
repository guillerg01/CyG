"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense } from "../types";
import { useApi } from "@/shared/hooks";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { get, post, put, del } = useApi();

  const fetchExpenses = useCallback(
    async (filters?: {
      accountId?: string;
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      expenseType?: string;
      paymentMethod?: string;
      limit?: number;
    }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters?.accountId) params.append("accountId", filters.accountId);
        if (filters?.categoryId)
          params.append("categoryId", filters.categoryId);
        if (filters?.startDate) params.append("startDate", filters.startDate);
        if (filters?.endDate) params.append("endDate", filters.endDate);
        if (filters?.expenseType)
          params.append("expenseType", filters.expenseType);
        if (filters?.paymentMethod)
          params.append("paymentMethod", filters.paymentMethod);
        if (filters?.limit) params.append("limit", filters.limit.toString());

        const data = await get<Expense[]>(`/api/expenses?${params.toString()}`);
        if (data) {
          setExpenses(data);
        }
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const createExpense = useCallback(
    async (expenseData: {
      amount: number;
      description?: string;
      currency: string;
      paymentMethod: string;
      expenseType: string;
      isShared: boolean;
      plannedDate?: string;
      accountId: string;
      categoryId: string;
      createdAt?: string;
    }) => {
      const data = await post<Expense>("/api/expenses", expenseData);
      if (data) {
        setExpenses((prev) => [data, ...prev]);
        return data;
      }
      throw new Error("Failed to create expense");
    },
    [post]
  );

  const updateExpense = useCallback(
    async (id: string, expenseData: Partial<Expense>) => {
      const data = await put<Expense>(`/api/expenses/${id}`, expenseData);
      if (data) {
        setExpenses((prev) => prev.map((e) => (e.id === id ? data : e)));
        return data;
      }
      throw new Error("Failed to update expense");
    },
    [put]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      await del(`/api/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    },
    [del]
  );

  return {
    expenses,
    loading,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
