"use client";

import { useState, useCallback } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(
    async <R = T>(url: string, options?: RequestInit): Promise<R | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Request failed");
        }

        const data: R = await response.json();
        setState({ data: data as unknown as T, loading: false, error: null });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    []
  );

  const get = useCallback(
    async <R = T>(url: string): Promise<R | null> => {
      return request<R>(url, { method: "GET" });
    },
    [request]
  );

  const post = useCallback(
    async <R = T>(url: string, body: unknown): Promise<R | null> => {
      return request<R>(url, { method: "POST", body: JSON.stringify(body) });
    },
    [request]
  );

  const put = useCallback(
    async <R = T>(url: string, body: unknown): Promise<R | null> => {
      return request<R>(url, { method: "PUT", body: JSON.stringify(body) });
    },
    [request]
  );

  const del = useCallback(
    async (url: string): Promise<null> => {
      return request(url, { method: "DELETE" });
    },
    [request]
  );

  return { ...state, get, post, put, del, request };
}
