export type UserMode = "kids" | "prime" | "professional";
export type ViewContext = "personal" | "professional";
export type FeedType = "global" | "connections" | "professional";
export type VerificationStatus = "pending" | "verified" | "failed";
export type ContentVisibility = "public" | "connections" | "private";

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface ZKPAgeProof {
  proof: string;
  public_inputs: Record<string, string>;
  minimum_age: number;
}

export interface ZKPVerificationResult {
  verified: boolean;
  status: VerificationStatus;
  minimum_age_met: boolean;
  message: string;
  proof_hash: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
  age_proof: ZKPAgeProof;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  display_name: string;
  mode: UserMode;
  age_verified: boolean;
  access_token: string;
  zkp_result: ZKPVerificationResult;
}

export interface ModeSelectRequest {
  mode: UserMode;
}

export interface ModeSelectResponse {
  user_id: string;
  mode: UserMode;
  access_token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  mode: UserMode;
  age_verified: boolean;
  bio?: string | null;
  headline?: string | null;
  skills?: string | null;
  company?: string | null;
  created_at?: string | null;
}

export interface PublicUser {
  id: string;
  display_name: string;
  mode: UserMode;
  bio?: string | null;
  headline?: string | null;
  skills?: string | null;
  company?: string | null;
}

export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  headline?: string;
  skills?: string;
  company?: string;
  current_password?: string;
  new_password?: string;
}

export interface CreatePostRequest {
  body: string;
  visibility?: ContentVisibility;
  context?: ViewContext;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  mode: UserMode;
  context: ViewContext;
  visibility: ContentVisibility;
  media_url?: string | null;
  moderation_status?: string;
  created_at: string;
}

export interface FeedResponse {
  posts: Post[];
  total: number;
  feed_type: string;
  context: string;
}

export interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
  other_user_id: string;
  other_display_name: string | null;
}

export interface ConnectionsListResponse {
  connections: Connection[];
  pending_incoming: Connection[];
  total: number;
}

export interface ProfessionalProfile {
  user_id: string;
  display_name: string;
  headline?: string | null;
  company?: string | null;
  skills?: string | null;
  bio?: string | null;
}

export interface ProfessionalDashboard {
  profile: ProfessionalProfile;
  insights: { label: string; value: string; trend: string }[];
  connection_suggestions: string[];
}

export interface FeatureFlags {
  flags: Record<string, boolean>;
  cohort: string | null;
  beta_access: boolean;
}

export interface SafetyDashboard {
  total_events: number;
  blocked_count: number;
  review_count: number;
  open_reports: number;
  incident_rate: number;
  recent_events: {
    id: string;
    action: string;
    score: string;
    labels: string;
    status: string;
    created_at: string;
  }[];
}

export interface DigitalTwin {
  agent_id: string;
  name: string;
  status: string;
  safety_channel: string;
  social_status: string;
  capabilities?: string | null;
}

export interface RobotDashboard {
  twins: DigitalTwin[];
  recent_commands: { agent_id: string; command: string; safety_check: string; created_at: string }[];
  safety_channel_status: string;
}

export interface CommandResponse {
  agent_id: string;
  command: string;
  status: string;
  safety_check: string;
  message: string;
}

export interface AuthSession {
  accessToken: string;
  userId: string;
  email: string;
  displayName: string;
  mode: UserMode;
  ageVerified: boolean;
  viewContext: ViewContext;
}

export type AuthMethod =
  | "password"
  | "pin"
  | "webauthn"
  | "face"
  | "palm"
  | "voice";

export interface AuthLoginResponse {
  user_id: string;
  email: string;
  display_name: string;
  mode: UserMode;
  age_verified: boolean;
  access_token: string;
  auth_method: string;
}

export interface AvailableAuthMethods {
  email: string;
  methods: AuthMethod[];
}

export interface WebAuthnChallenge {
  challenge: string;
  rp_id: string;
  user_id?: string;
  user_name?: string;
  user_display_name?: string;
  allow_credentials?: { id: string; type: string }[];
}

export interface ParentalApprovalResponse {
  approval_code: string;
  child_display_name: string;
  expires_at: string;
}

export interface KidsRegisterRequest {
  display_name: string;
  face_template_hash: string;
  parental_approval_code: string;
  age_proof: ZKPAgeProof;
}

export interface KidsRegisterResponse {
  user_id: string;
  display_name: string;
  mode: UserMode;
  access_token: string;
  zkp_result: ZKPVerificationResult;
  parental_approved: boolean;
}