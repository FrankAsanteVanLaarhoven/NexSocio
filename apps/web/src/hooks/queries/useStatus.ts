"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyStatus, getStatusFeed, postStatus } from "@/lib/api";
import { queryKeys } from "./keys";

export function useStatusFeed(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.statusFeed(token),
    queryFn: () => getStatusFeed(token!),
    enabled: !!token,
  });
}

export function useMyStatus(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.myStatus(token),
    queryFn: () => getMyStatus(token!),
    enabled: !!token,
  });
}

export function usePostStatus(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => postStatus(token!, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.statusFeed(token) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myStatus(token) });
    },
  });
}