"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CallSession } from "@nexus/types";
import { answerCall, endCall, getRecentCalls, startCall } from "@/lib/api";
import { queryKeys } from "./keys";

export function useRecentCalls(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.calls(token),
    queryFn: () => getRecentCalls(token!),
    enabled: !!token,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useStartCall(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      callee_id: string;
      callee_name: string;
      call_type?: "voice" | "video";
    }) => startCall(token!, data),
    onSuccess: (call) => {
      queryClient.setQueryData<CallSession[]>(queryKeys.calls(token), (old) => [
        call,
        ...(old ?? []).filter((c) => c.id !== call.id),
      ]);
    },
  });
}

export function useAnswerCall(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (callId: string) => answerCall(token!, callId),
    onMutate: async (callId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.calls(token) });
      const previous = queryClient.getQueryData<CallSession[]>(queryKeys.calls(token));
      queryClient.setQueryData<CallSession[]>(queryKeys.calls(token), (old) =>
        old?.map((c) => (c.id === callId ? { ...c, status: "active" } : c))
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.calls(token), ctx.previous);
      }
    },
    onSuccess: (call) => {
      queryClient.setQueryData<CallSession[]>(queryKeys.calls(token), (old) =>
        old?.map((c) => (c.id === call.id ? call : c)) ?? [call]
      );
    },
  });
}

export function useEndCall(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (callId: string) => endCall(token!, callId),
    onMutate: async (callId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.calls(token) });
      const previous = queryClient.getQueryData<CallSession[]>(queryKeys.calls(token));
      queryClient.setQueryData<CallSession[]>(queryKeys.calls(token), (old) =>
        old?.map((c) => (c.id === callId ? { ...c, status: "ended" } : c))
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.calls(token), ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls(token) });
    },
  });
}