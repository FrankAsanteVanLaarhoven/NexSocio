"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings(token) });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingMeetings(token) });
    },
  });
}