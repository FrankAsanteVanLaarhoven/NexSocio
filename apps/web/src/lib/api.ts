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
  CommandResponse,
  FeatureFlags,
  ProfessionalDashboard,
  ProfessionalProfile,
  RobotDashboard,
  SafetyDashboard,
  PublicUser,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
  UserMode,
  UserProfile,
  ViewContext,
  WebAuthnChallenge,
  ZKPAgeProof,
} from "@nexus/types";

const IDENTITY_URL = process.env.NEXT_PUBLIC_IDENTITY_URL || "http://localhost:8001";
const SOCIAL_URL = process.env.NEXT_PUBLIC_SOCIAL_URL || "http://localhost:8002";
const CONTENT_URL = process.env.NEXT_PUBLIC_CONTENT_URL || "http://localhost:8003";
const PROFESSIONAL_URL = process.env.NEXT_PUBLIC_PROFESSIONAL_URL || "http://localhost:8004";
const SAFETY_URL = process.env.NEXT_PUBLIC_SAFETY_URL || "http://localhost:8005";
const ROBOT_URL = process.env.NEXT_PUBLIC_ROBOT_URL || "http://localhost:8006";

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

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

export async function createRobotTwin(token: string, name: string): Promise<void> {
  await request(ROBOT_URL, "/api/v1/twins", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
}