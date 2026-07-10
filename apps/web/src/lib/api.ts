import type {
  ApiResponse,
  AuthLoginResponse,
  AuthMethod,
  AvailableAuthMethods,
  ConnectionsListResponse,
  CreatePostRequest,
  FeedResponse,
  FeedType,
  KidsRegisterRequest,
  KidsRegisterResponse,
  ModeSelectRequest,
  ModeSelectResponse,
  ParentalApprovalResponse,
  Post,
  Comment,
  CommandResponse,
  DigitalTwin,
  FeatureFlags,
  ArticlePreview,
  DirectionsResult,
  Cart,
  CheckoutResult,
  CreateProductRequest,
  HubDashboard,
  LocationUpdateRequest,
  MarketHistory,
  MarketplaceDashboard,
  MarketplaceProduct,
  MarketQuote,
  MemberLocation,
  Order,
  PlaceResult,
  PostType,
  AIComposeResult,
  AvatarVideoJob,
  TwinBriefing,
  TwinMessage,
  ProfessionalDashboard,
  ProfessionalProfile,
  RobotDashboard,
  SafetyDashboard,
  PublicUser,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
  UserLocation,
  UserMode,
  UserProfile,
  ViewContext,
  Wallet,
  WalletTransaction,
  WebAuthnChallenge,
  ZKPAgeProof,
  InboxSummary,
  Notification,
  Team,
  TeamMember,
  Meeting,
  CallSession,
  StatusUpdate,
  Contact,
  PodcastEpisode,
  ShareResult,
} from "@nexus/types";

const IDENTITY_URL = process.env.NEXT_PUBLIC_IDENTITY_URL || "http://localhost:8001";
const SOCIAL_URL = process.env.NEXT_PUBLIC_SOCIAL_URL || "http://localhost:8002";
const CONTENT_URL = process.env.NEXT_PUBLIC_CONTENT_URL || "http://localhost:8003";
const PROFESSIONAL_URL = process.env.NEXT_PUBLIC_PROFESSIONAL_URL || "http://localhost:8004";
const SAFETY_URL = process.env.NEXT_PUBLIC_SAFETY_URL || "http://localhost:8005";
const ROBOT_URL = process.env.NEXT_PUBLIC_ROBOT_URL || "http://localhost:8006";
const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:8007";
const COMMERCE_URL = process.env.NEXT_PUBLIC_COMMERCE_URL || "http://localhost:8008";
const COLLABORATION_URL = process.env.NEXT_PUBLIC_COLLABORATION_URL || "http://localhost:8009";
const NOTIFICATION_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL || "http://localhost:8010";

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Request timed out — is the service running? (${baseUrl})`);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (!res.ok) {
    const body = json as { detail?: string | { msg: string }[]; error?: string };
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : body.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  const response = json as ApiResponse<T>;
  if (!response.success) {
    throw new Error(response.error || `Request failed: ${res.status}`);
  }

  if (response.data === null) {
    throw new Error("Empty response data");
  }

  return response.data;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function loginPassword(
  email: string,
  password: string
): Promise<AuthLoginResponse> {
  return request<AuthLoginResponse>(IDENTITY_URL, "/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginPin(email: string, pin: string): Promise<AuthLoginResponse> {
  return request<AuthLoginResponse>(IDENTITY_URL, "/api/v1/auth/login/pin", {
    method: "POST",
    body: JSON.stringify({ email, pin }),
  });
}

export async function loginBiometric(
  email: string,
  factorType: "face" | "palm" | "voice",
  templateHash: string,
  voiceCommand?: string
): Promise<AuthLoginResponse> {
  return request<AuthLoginResponse>(IDENTITY_URL, "/api/v1/auth/login/biometric", {
    method: "POST",
    body: JSON.stringify({
      email,
      factor_type: factorType,
      template_hash: templateHash,
      voice_command: voiceCommand,
    }),
  });
}

export async function loginKidsFace(
  displayName: string,
  faceTemplateHash: string
): Promise<AuthLoginResponse> {
  return request<AuthLoginResponse>(IDENTITY_URL, "/api/v1/auth/login/kids-face", {
    method: "POST",
    body: JSON.stringify({
      display_name: displayName,
      face_template_hash: faceTemplateHash,
    }),
  });
}

export async function getAuthMethods(email: string): Promise<AvailableAuthMethods> {
  return request<AvailableAuthMethods>(
    IDENTITY_URL,
    `/api/v1/auth/methods?email=${encodeURIComponent(email)}`
  );
}

export async function getWebAuthnLoginOptions(email: string): Promise<WebAuthnChallenge> {
  return request<WebAuthnChallenge>(
    IDENTITY_URL,
    `/api/v1/auth/webauthn/login/options?email=${encodeURIComponent(email)}`,
    { method: "POST" }
  );
}

export async function loginWebAuthn(
  credentialId: string,
  challenge: string,
  email?: string
): Promise<AuthLoginResponse> {
  return request<AuthLoginResponse>(IDENTITY_URL, "/api/v1/auth/webauthn/login", {
    method: "POST",
    body: JSON.stringify({ credential_id: credentialId, challenge, email }),
  });
}

export async function getWebAuthnRegisterOptions(token: string): Promise<WebAuthnChallenge> {
  return request<WebAuthnChallenge>(IDENTITY_URL, "/api/v1/auth/webauthn/register/options", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function enrollPinWithPassword(
  email: string,
  password: string,
  pin: string
): Promise<void> {
  await request(IDENTITY_URL, "/api/v1/auth/factors/pin/password", {
    method: "POST",
    body: JSON.stringify({ email, password, pin }),
  });
}

export async function enrollBiometricWithPassword(
  email: string,
  password: string,
  factorType: "face" | "palm" | "voice",
  templateHash: string
): Promise<void> {
  await request(IDENTITY_URL, "/api/v1/auth/factors/biometric/password", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      factor_type: factorType,
      template_hash: templateHash,
    }),
  });
}

export async function getWebAuthnRegisterOptionsWithPassword(
  email: string,
  password: string
): Promise<WebAuthnChallenge> {
  return request<WebAuthnChallenge>(
    IDENTITY_URL,
    "/api/v1/auth/webauthn/register/options/password",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function enrollWebAuthnWithPassword(
  email: string,
  password: string,
  credentialId: string,
  challenge: string
): Promise<void> {
  await request(IDENTITY_URL, "/api/v1/auth/factors/webauthn/password", {
    method: "POST",
    body: JSON.stringify({ email, password, credential_id: credentialId, challenge }),
  });
}

export async function enrollPin(token: string, pin: string): Promise<void> {
  await request(IDENTITY_URL, "/api/v1/auth/factors/pin", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ pin }),
  });
}

export async function enrollBiometric(
  token: string,
  factorType: "face" | "palm" | "voice",
  templateHash: string,
  label?: string
): Promise<void> {
  await request(IDENTITY_URL, "/api/v1/auth/factors/biometric", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      factor_type: factorType,
      template_hash: templateHash,
      label,
    }),
  });
}

export async function enrollWebAuthn(
  token: string,
  credentialId: string,
  challenge: string,
  label?: string
): Promise<void> {
  await request(IDENTITY_URL, "/api/v1/auth/factors/webauthn", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ credential_id: credentialId, challenge, label }),
  });
}

export async function createParentalApproval(
  token: string,
  childDisplayName: string
): Promise<ParentalApprovalResponse> {
  return request<ParentalApprovalResponse>(IDENTITY_URL, "/api/v1/auth/parental-approval", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ child_display_name: childDisplayName }),
  });
}

export async function registerKids(data: KidsRegisterRequest): Promise<KidsRegisterResponse> {
  return request<KidsRegisterResponse>(IDENTITY_URL, "/api/v1/auth/register/kids", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type { AuthMethod };

export async function generateStubProof(isAdult = true): Promise<ZKPAgeProof> {
  return request<ZKPAgeProof>(IDENTITY_URL, `/api/v1/zkp/stub-proof?is_adult=${isAdult}`, {
    method: "POST",
  });
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return request<RegisterResponse>(IDENTITY_URL, "/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function selectMode(token: string, mode: UserMode): Promise<ModeSelectResponse> {
  const body: ModeSelectRequest = { mode };
  return request<ModeSelectResponse>(IDENTITY_URL, "/api/v1/auth/mode", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

export async function getMe(token: string): Promise<UserProfile> {
  return request<UserProfile>(IDENTITY_URL, "/api/v1/users/me", {
    headers: authHeaders(token),
  });
}

export async function updateLocation(
  token: string,
  data: LocationUpdateRequest
): Promise<UserLocation> {
  return request<UserLocation>(IDENTITY_URL, "/api/v1/location", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getMyLocation(token: string): Promise<UserLocation | null> {
  return request<UserLocation | null>(IDENTITY_URL, "/api/v1/location/me", {
    headers: authHeaders(token),
  });
}

export async function getMemberLocations(token: string): Promise<MemberLocation[]> {
  return request<MemberLocation[]>(IDENTITY_URL, "/api/v1/location/members", {
    headers: authHeaders(token),
  });
}

export async function getMemberLocation(
  token: string,
  userId: string
): Promise<MemberLocation | null> {
  return request<MemberLocation | null>(
    IDENTITY_URL,
    `/api/v1/location/${userId}`,
    { headers: authHeaders(token) }
  );
}

export async function updateProfile(
  token: string,
  data: UpdateProfileRequest
): Promise<UserProfile> {
  return request<UserProfile>(IDENTITY_URL, "/api/v1/users/me", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function searchUsers(query: string): Promise<PublicUser[]> {
  return request<PublicUser[]>(
    IDENTITY_URL,
    `/api/v1/users/search?q=${encodeURIComponent(query)}`
  );
}

export async function composeWithAI(
  token: string,
  draft: string,
  opts: { tone?: string; context?: string } = {}
): Promise<AIComposeResult> {
  return request<AIComposeResult>(CONTENT_URL, "/api/v1/ai/compose", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      draft,
      tone: opts.tone ?? "friendly",
      context: opts.context ?? "social",
    }),
  });
}

export async function createPost(token: string, data: CreatePostRequest): Promise<Post> {
  return request<Post>(CONTENT_URL, "/api/v1/posts", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getFeed(
  token: string,
  opts: {
    feedType?: FeedType;
    context?: ViewContext;
    mode?: UserMode;
  } = {}
): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (opts.feedType) params.set("feed_type", opts.feedType);
  if (opts.context) params.set("context", opts.context);
  if (opts.mode) params.set("mode", opts.mode);
  const qs = params.toString() ? `?${params}` : "";
  return request<FeedResponse>(CONTENT_URL, `/api/v1/feed${qs}`, {
    headers: authHeaders(token),
  });
}

export async function getConnections(token: string): Promise<ConnectionsListResponse> {
  return request<ConnectionsListResponse>(SOCIAL_URL, "/api/v1/connections", {
    headers: authHeaders(token),
  });
}

export async function requestConnection(
  token: string,
  recipientId: string
): Promise<void> {
  await request(SOCIAL_URL, "/api/v1/connections", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ recipient_id: recipientId }),
  });
}

export async function acceptConnection(token: string, connectionId: string): Promise<void> {
  await request(SOCIAL_URL, `/api/v1/connections/${connectionId}/accept`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function getProfessionalProfile(token: string): Promise<ProfessionalProfile> {
  return request<ProfessionalProfile>(PROFESSIONAL_URL, "/api/v1/profile", {
    headers: authHeaders(token),
  });
}

export async function getProfessionalDashboard(token: string): Promise<ProfessionalDashboard> {
  return request<ProfessionalDashboard>(PROFESSIONAL_URL, "/api/v1/dashboard", {
    headers: authHeaders(token),
  });
}

export async function getCorporateDashboard(token: string): Promise<import("@nexus/types").CorporateDashboard> {
  return request(PROFESSIONAL_URL, "/api/v1/dashboard/corporate", {
    headers: authHeaders(token),
  });
}

export async function listOrganizations(
  industry?: string
): Promise<import("@nexus/types").Organization[]> {
  const qs = industry ? `?industry=${encodeURIComponent(industry)}` : "";
  return request(PROFESSIONAL_URL, `/api/v1/organizations${qs}`);
}

export async function createOrganization(
  token: string,
  data: {
    name: string;
    slug: string;
    corporate_email: string;
    sector_category: string;
    industry?: string;
    size_band?: string;
    website?: string;
    description?: string;
  }
): Promise<import("@nexus/types").Organization> {
  return request(PROFESSIONAL_URL, "/api/v1/organizations", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function listCorporateSectors(): Promise<import("@nexus/types").CorporateSector[]> {
  return request(PROFESSIONAL_URL, "/api/v1/corporate/sectors");
}

export async function listPublicCorporateServices(
  sector?: string
): Promise<import("@nexus/types").CorporateServiceListing[]> {
  const qs = sector ? `?sector=${encodeURIComponent(sector)}` : "";
  return request(PROFESSIONAL_URL, `/api/v1/corporate/services/public${qs}`);
}

export async function getOrgCompliance(
  token: string,
  orgId: string
): Promise<import("@nexus/types").CorporateComplianceStatus> {
  return request(PROFESSIONAL_URL, `/api/v1/organizations/${orgId}/compliance`, {
    headers: authHeaders(token),
  });
}

export async function verifyOrgEmail(
  token: string,
  orgId: string,
  corporate_email: string
): Promise<import("@nexus/types").CorporateComplianceStatus> {
  return request(PROFESSIONAL_URL, `/api/v1/organizations/${orgId}/verify-email`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ corporate_email }),
  });
}

export async function submitOrgCredentials(
  token: string,
  orgId: string,
  data: {
    sector_category: string;
    registration_number: string;
    license_body?: string;
    notes?: string;
  }
): Promise<{ org_id: string; status: string; sector_category: string }> {
  return request(PROFESSIONAL_URL, `/api/v1/organizations/${orgId}/credentials`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function startNetworkingTrial(
  token: string,
  orgId: string
): Promise<import("@nexus/types").OrgNetworkingAccess> {
  return request(PROFESSIONAL_URL, `/api/v1/organizations/${orgId}/subscription/trial`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function createCorporateService(
  token: string,
  orgId: string,
  data: { title: string; description?: string; price_hint?: string }
): Promise<import("@nexus/types").CorporateServiceListing> {
  return request(PROFESSIONAL_URL, `/api/v1/organizations/${orgId}/services`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getCareerProfile(token: string): Promise<import("@nexus/types").CareerProfile> {
  return request(PROFESSIONAL_URL, "/api/v1/career/profile", { headers: authHeaders(token) });
}

export async function upsertCareerProfile(
  token: string,
  data: Partial<import("@nexus/types").CareerProfile>
): Promise<import("@nexus/types").CareerProfile> {
  return request(PROFESSIONAL_URL, "/api/v1/career/profile", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function addWorkExperience(
  token: string,
  data: Omit<import("@nexus/types").WorkExperience, "id">
): Promise<import("@nexus/types").WorkExperience> {
  return request(PROFESSIONAL_URL, "/api/v1/career/experiences", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function deleteWorkExperience(token: string, expId: string): Promise<void> {
  await request(PROFESSIONAL_URL, `/api/v1/career/experiences/${expId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function searchCareerPeople(params?: {
  q?: string;
  sector?: string;
  skills?: string;
}): Promise<import("@nexus/types").PeopleSearchResult[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.sector) qs.set("sector", params.sector);
  if (params?.skills) qs.set("skills", params.skills);
  const q = qs.toString();
  return request(PROFESSIONAL_URL, `/api/v1/career/people${q ? `?${q}` : ""}`);
}

export async function listCareerJobs(params?: {
  sector?: string;
  q?: string;
}): Promise<import("@nexus/types").JobPosting[]> {
  const qs = new URLSearchParams();
  if (params?.sector) qs.set("sector", params.sector);
  if (params?.q) qs.set("q", params.q);
  const q = qs.toString();
  return request(PROFESSIONAL_URL, `/api/v1/career/jobs${q ? `?${q}` : ""}`);
}

export async function createJobPosting(
  token: string,
  data: {
    org_id: string;
    title: string;
    description?: string;
    sector_category: string;
    location_type?: string;
    employment_type?: string;
    salary_range?: string;
    skills_required?: string;
    education_level?: string;
  }
): Promise<import("@nexus/types").JobPosting> {
  return request(PROFESSIONAL_URL, "/api/v1/career/jobs", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function applyToJob(
  token: string,
  jobId: string,
  data?: { cover_note?: string; cv_url?: string }
): Promise<import("@nexus/types").JobApplication> {
  return request(PROFESSIONAL_URL, `/api/v1/career/jobs/${jobId}/apply`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data ?? {}),
  });
}

export async function listJobApplications(
  token: string,
  jobId: string
): Promise<import("@nexus/types").JobApplication[]> {
  return request(PROFESSIONAL_URL, `/api/v1/career/jobs/${jobId}/applications`, {
    headers: authHeaders(token),
  });
}

export async function listOrgJobs(token: string, orgId: string): Promise<import("@nexus/types").JobPosting[]> {
  return request(PROFESSIONAL_URL, `/api/v1/career/jobs/org/${orgId}`, {
    headers: authHeaders(token),
  });
}

export async function closeJobPosting(
  token: string,
  jobId: string
): Promise<import("@nexus/types").JobPosting> {
  return request(PROFESSIONAL_URL, `/api/v1/career/jobs/${jobId}/close`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function listTalentShortlist(
  token: string
): Promise<import("@nexus/types").TalentShortlistEntry[]> {
  return request(PROFESSIONAL_URL, "/api/v1/career/shortlist", {
    headers: authHeaders(token),
  });
}

export async function addToTalentShortlist(
  token: string,
  candidateUserId: string
): Promise<import("@nexus/types").TalentShortlistEntry> {
  return request(PROFESSIONAL_URL, "/api/v1/career/shortlist", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ candidate_user_id: candidateUserId }),
  });
}

export async function removeFromTalentShortlist(
  token: string,
  candidateUserId: string
): Promise<void> {
  await request(PROFESSIONAL_URL, `/api/v1/career/shortlist/${candidateUserId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function listOrgMemberships(
  token: string
): Promise<import("@nexus/types").OrgMembership[]> {
  return request(PROFESSIONAL_URL, "/api/v1/organizations/memberships", {
    headers: authHeaders(token),
  });
}

export async function getBusinessProfile(
  token: string
): Promise<import("@nexus/types").BusinessProfile | null> {
  return request(PROFESSIONAL_URL, "/api/v1/business-profile", {
    headers: authHeaders(token),
  });
}

export async function upsertBusinessProfile(
  token: string,
  data: { business_name: string; category?: string; tagline?: string }
): Promise<import("@nexus/types").BusinessProfile> {
  return request(PROFESSIONAL_URL, "/api/v1/business-profile", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getBusinessToolsAccess(
  token: string
): Promise<import("@nexus/types").BusinessToolsAccess> {
  return request(PROFESSIONAL_URL, "/api/v1/business/tools", { headers: authHeaders(token) });
}

export async function startBusinessToolsTrial(
  token: string
): Promise<import("@nexus/types").BusinessToolsAccess> {
  return request(PROFESSIONAL_URL, "/api/v1/business/subscription/trial", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function createBusinessSubscriptionCheckout(
  token: string,
  data: { success_url: string; cancel_url: string }
): Promise<import("@nexus/types").SubscriptionCheckoutResult> {
  return request(PROFESSIONAL_URL, "/api/v1/business/subscription/checkout", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function createCorporateSubscriptionCheckout(
  token: string,
  orgId: string,
  data: { success_url: string; cancel_url: string }
): Promise<import("@nexus/types").SubscriptionCheckoutResult> {
  return request(PROFESSIONAL_URL, `/api/v1/organizations/${orgId}/subscription/checkout`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function activateSubscriptionCheckout(
  sessionId: string
): Promise<import("@nexus/types").ActivateSubscriptionResult> {
  return request(PROFESSIONAL_URL, "/api/v1/billing/activate-success", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export async function getHubDashboard(token?: string): Promise<HubDashboard> {
  return request<HubDashboard>(HUB_URL, "/api/v1/dashboard", {
    headers: token ? authHeaders(token) : {},
  });
}

export async function getHubMarkets(symbols?: string): Promise<MarketQuote[]> {
  const qs = symbols ? `?symbols=${encodeURIComponent(symbols)}` : "";
  return request<MarketQuote[]>(HUB_URL, `/api/v1/markets${qs}`);
}

export async function readArticleInApp(url: string): Promise<ArticlePreview> {
  return request<ArticlePreview>(
    HUB_URL,
    `/api/v1/read?url=${encodeURIComponent(url)}`
  );
}

export async function searchPlaces(
  query: string,
  lat?: number,
  lng?: number
): Promise<PlaceResult[]> {
  const params = new URLSearchParams({ q: query });
  if (lat != null) params.set("lat", String(lat));
  if (lng != null) params.set("lng", String(lng));
  return request<PlaceResult[]>(HUB_URL, `/api/v1/places/search?${params}`);
}

export async function nearbyPlaces(
  lat: number,
  lng: number,
  type = "restaurant"
): Promise<PlaceResult[]> {
  return request<PlaceResult[]>(
    HUB_URL,
    `/api/v1/places/nearby?lat=${lat}&lng=${lng}&type=${type}`
  );
}

export async function getDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode = "driving"
): Promise<DirectionsResult> {
  return request<DirectionsResult>(
    HUB_URL,
    `/api/v1/places/directions?origin_lat=${originLat}&origin_lng=${originLng}&dest_lat=${destLat}&dest_lng=${destLng}&mode=${mode}`
  );
}

export async function getMarketHistory(
  symbol: string,
  range = "1mo"
): Promise<MarketHistory> {
  return request<MarketHistory>(
    HUB_URL,
    `/api/v1/markets/${encodeURIComponent(symbol)}/history?range=${range}`
  );
}

export async function getFeatureFlags(token: string): Promise<FeatureFlags> {
  return request<FeatureFlags>(IDENTITY_URL, "/api/v1/features", {
    headers: authHeaders(token),
  });
}

export async function getSafetyDashboard(): Promise<SafetyDashboard> {
  return request<SafetyDashboard>(SAFETY_URL, "/api/v1/dashboard");
}

export async function reportPost(
  token: string,
  postId: string,
  reason: string,
  details?: string
): Promise<void> {
  await request(SAFETY_URL, "/api/v1/reports", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ post_id: postId, reason, details }),
  });
}

export async function getRobotDashboard(token: string): Promise<RobotDashboard> {
  return request<RobotDashboard>(ROBOT_URL, "/api/v1/dashboard", {
    headers: authHeaders(token),
  });
}

export async function issueRobotCommand(
  token: string,
  agentId: string,
  command: string
): Promise<CommandResponse> {
  return request<CommandResponse>(ROBOT_URL, "/api/v1/commands", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ agent_id: agentId, command }),
  });
}

export async function createRobotTwin(
  token: string,
  name: string,
  ownerDisplayName?: string
): Promise<DigitalTwin> {
  return request<DigitalTwin>(ROBOT_URL, "/api/v1/twins", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name, owner_display_name: ownerDisplayName }),
  });
}

export async function activateTwin(
  token: string,
  agentId: string,
  ownerDisplayName: string
): Promise<DigitalTwin> {
  return request<DigitalTwin>(ROBOT_URL, `/api/v1/twins/${agentId}/activate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ owner_display_name: ownerDisplayName }),
  });
}

export async function deactivateTwin(token: string, agentId: string): Promise<DigitalTwin> {
  return request<DigitalTwin>(ROBOT_URL, `/api/v1/twins/${agentId}/deactivate`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function sendTwinMessage(
  token: string,
  agentId: string,
  fromName: string,
  body: string
): Promise<TwinMessage> {
  return request<TwinMessage>(ROBOT_URL, `/api/v1/twins/${agentId}/messages`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ from_name: fromName, body }),
  });
}

export async function twinPost(
  token: string,
  agentId: string,
  body: string,
  context = "personal"
): Promise<Post> {
  return request<Post>(ROBOT_URL, `/api/v1/twins/${agentId}/post`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ body, context }),
  });
}

export async function getTwinBriefing(token: string, agentId: string): Promise<TwinBriefing> {
  return request<TwinBriefing>(ROBOT_URL, `/api/v1/twins/${agentId}/briefing`, {
    headers: authHeaders(token),
  });
}

export async function createComment(
  token: string,
  postId: string,
  body: string
): Promise<Comment> {
  return request<Comment>(CONTENT_URL, "/api/v1/comments", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ post_id: postId, body }),
  });
}

export async function getComments(postId: string): Promise<Comment[]> {
  return request<Comment[]>(CONTENT_URL, `/api/v1/comments/${postId}`);
}

export async function uploadTwinAvatar(
  token: string,
  agentId: string,
  imageData: string
): Promise<DigitalTwin> {
  return request<DigitalTwin>(ROBOT_URL, `/api/v1/twins/${agentId}/avatar`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ image_data: imageData }),
  });
}

export async function generateTwinAvatarVideo(
  token: string,
  agentId: string,
  script: string,
  voiceId = "en-US-JennyNeural"
): Promise<AvatarVideoJob> {
  return request<AvatarVideoJob>(ROBOT_URL, `/api/v1/twins/${agentId}/avatar/video`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ script, voice_id: voiceId }),
  });
}

export async function twinVideoPost(
  token: string,
  agentId: string,
  data: {
    script: string;
    video_url: string;
    context?: string;
    ai_assisted?: boolean;
    hide_ai_tag?: boolean;
  }
): Promise<Post> {
  return request<Post>(ROBOT_URL, `/api/v1/twins/${agentId}/video-post`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function createMediaPost(
  token: string,
  data: {
    body: string;
    post_type: PostType;
    media_url?: string;
    filter_preset?: string;
    context?: ViewContext;
    org_id?: string | null;
    ai_assisted?: boolean;
    hide_ai_tag?: boolean;
    location_label?: string;
    location_lat?: number;
    location_lng?: number;
    is_live_session?: boolean;
  }
): Promise<Post> {
  return request<Post>(CONTENT_URL, "/api/v1/posts", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getWallet(token: string): Promise<Wallet> {
  return request<Wallet>(COMMERCE_URL, "/api/v1/wallet", {
    headers: authHeaders(token),
  });
}

export async function listGiftCatalog(): Promise<import("@nexus/types").GiftCatalogItem[]> {
  return request(COMMERCE_URL, "/api/v1/creator/gifts");
}

export async function sendLiveGift(
  token: string,
  data: { recipient_id: string; gift_id: string; live_session_id?: string }
): Promise<{ id: string; gift_emoji: string; gift_name: string; creator_earned: number }> {
  return request(COMMERCE_URL, "/api/v1/creator/gifts/send", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function buyNexCoins(
  token: string,
  packId: "starter" | "popular" | "pro"
): Promise<Wallet> {
  return request<Wallet>(COMMERCE_URL, "/api/v1/creator/coins/buy", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ pack_id: packId }),
  });
}

export async function recordQualifiedView(
  token: string,
  data: { post_id: string; creator_id: string; watch_seconds: number }
): Promise<{ counted: boolean }> {
  return request(COMMERCE_URL, "/api/v1/creator/views", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getCreatorDashboard(
  token: string
): Promise<import("@nexus/types").CreatorDashboard> {
  return request(COMMERCE_URL, "/api/v1/creator/dashboard", {
    headers: authHeaders(token),
  });
}

export async function payoutCreatorBalance(token: string): Promise<Wallet> {
  return request<Wallet>(COMMERCE_URL, "/api/v1/creator/payout", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function getWalletTransactions(token: string): Promise<WalletTransaction[]> {
  return request<WalletTransaction[]>(COMMERCE_URL, "/api/v1/wallet/transactions", {
    headers: authHeaders(token),
  });
}

export async function setPaymentProvider(
  token: string,
  provider: "stripe" | "paypal",
  connected: boolean
): Promise<Wallet> {
  return request<Wallet>(COMMERCE_URL, "/api/v1/wallet/providers", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ provider, connected }),
  });
}

export async function getMarketplaceProducts(
  opts: { category?: string; q?: string } = {}
): Promise<MarketplaceProduct[]> {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  if (opts.q) params.set("q", opts.q);
  const qs = params.toString() ? `?${params}` : "";
  return request<MarketplaceProduct[]>(COMMERCE_URL, `/api/v1/marketplace/products${qs}`);
}

export async function getMyProducts(token: string): Promise<MarketplaceProduct[]> {
  return request<MarketplaceProduct[]>(COMMERCE_URL, "/api/v1/marketplace/products/mine", {
    headers: authHeaders(token),
  });
}

export async function createProduct(
  token: string,
  data: CreateProductRequest
): Promise<MarketplaceProduct> {
  return request<MarketplaceProduct>(COMMERCE_URL, "/api/v1/marketplace/products", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getMarketplaceDashboard(token: string): Promise<MarketplaceDashboard> {
  return request<MarketplaceDashboard>(COMMERCE_URL, "/api/v1/marketplace/dashboard", {
    headers: authHeaders(token),
  });
}

export async function getCart(token: string): Promise<Cart> {
  return request<Cart>(COMMERCE_URL, "/api/v1/cart", {
    headers: authHeaders(token),
  });
}

export async function addToCart(
  token: string,
  productId: string,
  quantity = 1
): Promise<Cart> {
  return request<Cart>(COMMERCE_URL, "/api/v1/cart/items", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export async function removeFromCart(token: string, productId: string): Promise<Cart> {
  return request<Cart>(COMMERCE_URL, `/api/v1/cart/items/${productId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function checkout(token: string): Promise<CheckoutResult> {
  return request<CheckoutResult>(COMMERCE_URL, "/api/v1/checkout", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function getOrders(token: string): Promise<Order[]> {
  return request<Order[]>(COMMERCE_URL, "/api/v1/orders", {
    headers: authHeaders(token),
  });
}

export async function getSalesOrders(token: string): Promise<Order[]> {
  return request<Order[]>(COMMERCE_URL, "/api/v1/orders/sales", {
    headers: authHeaders(token),
  });
}

export async function getInbox(token: string): Promise<InboxSummary> {
  return request<InboxSummary>(NOTIFICATION_URL, "/api/v1/inbox", {
    headers: authHeaders(token),
  });
}

export async function markNotificationRead(
  token: string,
  notificationId: string
): Promise<Notification> {
  return request<Notification>(
    NOTIFICATION_URL,
    `/api/v1/notifications/${notificationId}/read`,
    { method: "POST", headers: authHeaders(token) }
  );
}

export function notificationWsUrl(token: string): string {
  const base = NOTIFICATION_URL.replace(/^http/, "ws");
  return `${base}/api/v1/ws?token=${encodeURIComponent(token)}`;
}

export function callSignalingWsUrl(
  token: string,
  roomCode: string,
  kind: "call" | "meeting" = "call"
): string {
  const base = COLLABORATION_URL.replace(/^http/, "ws");
  return `${base}/api/v1/calls/ws?token=${encodeURIComponent(token)}&room=${encodeURIComponent(roomCode)}&kind=${kind}`;
}

export async function getIceServers(token: string): Promise<RTCIceServer[]> {
  const data = await request<{ ice_servers: { urls: string[]; username?: string; credential?: string }[] }>(
    COLLABORATION_URL,
    "/api/v1/webrtc/ice-servers",
    { headers: authHeaders(token) }
  );
  return data.ice_servers.map((s) => ({
    urls: s.urls,
    ...(s.username && s.credential
      ? { username: s.username, credential: s.credential }
      : {}),
  }));
}

export async function getVapidPublicKey(): Promise<string> {
  const data = await request<{ public_key: string }>(
    NOTIFICATION_URL,
    "/api/v1/push/vapid-public-key"
  );
  return data.public_key;
}

export async function subscribePush(
  token: string,
  subscription: PushSubscription
): Promise<void> {
  const sub = subscription.toJSON();
  await request(NOTIFICATION_URL, "/api/v1/push/subscribe", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: sub.keys,
    }),
  });
}

export async function listTeams(token: string): Promise<Team[]> {
  return request<Team[]>(COLLABORATION_URL, "/api/v1/teams", {
    headers: authHeaders(token),
  });
}

export async function createTeam(
  token: string,
  data: { name: string; sector?: "business" | "professional" }
): Promise<Team> {
  return request<Team>(COLLABORATION_URL, "/api/v1/teams", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getTeamMembers(token: string, teamId: string): Promise<TeamMember[]> {
  return request<TeamMember[]>(COLLABORATION_URL, `/api/v1/teams/${teamId}/members`, {
    headers: authHeaders(token),
  });
}

export async function listMeetings(token: string): Promise<Meeting[]> {
  return request<Meeting[]>(COLLABORATION_URL, "/api/v1/meetings", {
    headers: authHeaders(token),
  });
}

export async function listUpcomingMeetings(token: string): Promise<Meeting[]> {
  return request<Meeting[]>(COLLABORATION_URL, "/api/v1/meetings/upcoming", {
    headers: authHeaders(token),
  });
}

export async function createMeeting(
  token: string,
  data: {
    title: string;
    scheduled_at: string;
    duration_min?: number;
    team_id?: string;
  }
): Promise<Meeting> {
  return request<Meeting>(COLLABORATION_URL, "/api/v1/meetings", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function startCall(
  token: string,
  data: {
    callee_id: string;
    callee_name: string;
    call_type?: "voice" | "video";
  }
): Promise<CallSession> {
  return request<CallSession>(COLLABORATION_URL, "/api/v1/calls", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getRecentCalls(token: string): Promise<CallSession[]> {
  return request<CallSession[]>(COLLABORATION_URL, "/api/v1/calls/recent", {
    headers: authHeaders(token),
  });
}

export async function answerCall(token: string, callId: string): Promise<CallSession> {
  return request<CallSession>(COLLABORATION_URL, `/api/v1/calls/${callId}/answer`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function endCall(token: string, callId: string): Promise<CallSession> {
  return request<CallSession>(COLLABORATION_URL, `/api/v1/calls/${callId}/end`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function postStatus(
  token: string,
  data: { text?: string; media_url?: string; media_type?: string }
): Promise<StatusUpdate> {
  return request<StatusUpdate>(COLLABORATION_URL, "/api/v1/status", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getStatusFeed(token: string): Promise<StatusUpdate[]> {
  return request<StatusUpdate[]>(COLLABORATION_URL, "/api/v1/status/feed", {
    headers: authHeaders(token),
  });
}

export async function getMyStatus(token: string): Promise<StatusUpdate | null> {
  return request<StatusUpdate | null>(COLLABORATION_URL, "/api/v1/status/me", {
    headers: authHeaders(token),
  });
}

export async function listContacts(token: string, sync = true): Promise<Contact[]> {
  const qs = sync ? "?sync=true" : "?sync=false";
  return request<Contact[]>(COLLABORATION_URL, `/api/v1/contacts${qs}`, {
    headers: authHeaders(token),
  });
}

export async function addContact(
  token: string,
  data: {
    display_name: string;
    email?: string;
    phone?: string;
    contact_user_id?: string;
  }
): Promise<Contact> {
  return request<Contact>(COLLABORATION_URL, "/api/v1/contacts", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function shareWithContacts(
  token: string,
  data: {
    content_type: "post" | "status" | "meeting" | "product" | "update";
    content_id?: string;
    message: string;
    contact_ids: string[];
  }
): Promise<ShareResult> {
  return request<ShareResult>(COLLABORATION_URL, "/api/v1/share", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function createPodcastEpisode(
  token: string,
  data: {
    title: string;
    description?: string;
    media_url?: string;
    episode_type?: "podcast" | "vlog" | "tv";
    publish?: boolean;
  }
): Promise<PodcastEpisode> {
  return request<PodcastEpisode>(COLLABORATION_URL, "/api/v1/podcast/episodes", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function listPodcastEpisodes(
  token: string,
  episodeType?: "podcast" | "vlog" | "tv"
): Promise<PodcastEpisode[]> {
  const qs = episodeType ? `?type=${episodeType}` : "";
  return request<PodcastEpisode[]>(COLLABORATION_URL, `/api/v1/podcast/episodes${qs}`, {
    headers: authHeaders(token),
  });
}