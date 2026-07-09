"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTeam, getTeamMembers, listTeams } from "@/lib/api";
import { queryKeys } from "./keys";

export function useTeams(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams(token),
    queryFn: () => listTeams(token!),
    enabled: !!token,
  });
}

export function useTeamMembers(token: string | undefined, teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teamMembers(token, teamId),
    queryFn: () => getTeamMembers(token!, teamId!),
    enabled: !!token && !!teamId,
  });
}

export function useCreateTeam(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; sector?: "business" | "professional" }) =>
      createTeam(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams(token) });
    },
  });
}