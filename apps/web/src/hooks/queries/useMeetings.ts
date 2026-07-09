"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Meeting } from "@nexus/types";
import { createMeeting, listMeetings, listUpcomingMeetings } from "@/lib/api";
import { queryKeys } from "./keys";

export function useMeetings(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.meetings(token),
    queryFn: () => listMeetings(token!),
    enabled: !!token,
  });
}

export function useUpcomingMeetings(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.upcomingMeetings(token),
    queryFn: () => listUpcomingMeetings(token!),
    enabled: !!token,
    refetchInterval: 30_000,
  });
}

export function useCreateMeeting(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      scheduled_at: string;
      duration_min?: number;
      team_id?: string;
    }) => createMeeting(token!, data),
    onSuccess: (meeting) => {
      queryClient.setQueryData<Meeting[]>(queryKeys.meetings(token), (old) =>
        [meeting, ...(old ?? [])]
      );
      queryClient.setQueryData<Meeting[]>(queryKeys.upcomingMeetings(token), (old) => {
        const list = [meeting, ...(old ?? [])];
        return list.sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings(token) });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingMeetings(token) });
    },
  });
}