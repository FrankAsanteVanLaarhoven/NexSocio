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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls(token) });
    },
  });
}

export function useAnswerCall(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (callId: string) => answerCall(token!, callId),
    onSuccess: (call: CallSession) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls(token) });
    },
  });
}