export const queryKeys = {
  inbox: (token?: string) => ["inbox", token] as const,
  statusFeed: (token?: string) => ["status", "feed", token] as const,
  myStatus: (token?: string) => ["status", "me", token] as const,
  teams: (token?: string) => ["teams", token] as const,
  teamMembers: (token?: string, teamId?: string) =>
    ["teams", token, teamId, "members"] as const,
  meetings: (token?: string) => ["meetings", token] as const,
  upcomingMeetings: (token?: string) => ["meetings", "upcoming", token] as const,
  contacts: (token?: string) => ["contacts", token] as const,
  calls: (token?: string) => ["calls", token] as const,
};