export type UserMode = "kids" | "prime" | "professional";
export type SubscriptionTier = "free" | "premium" | "business";
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
  subscription_tier?: SubscriptionTier;
  can_hide_ai_tag?: boolean;
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
  media_url?: string | null;
  post_type?: PostType;
  filter_preset?: string | null;
  is_twin_post?: boolean;
  twin_agent_id?: string | null;
  owner_display_name?: string | null;
  ai_assisted?: boolean;
  hide_ai_tag?: boolean;
}

export type PostType = "text" | "reel" | "photo" | "live";

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
  post_type?: PostType;
  filter_preset?: string | null;
  is_twin_post?: boolean;
  twin_agent_id?: string | null;
  is_ai_generated?: boolean;
  show_ai_tag?: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  body: string;
  moderation_status: string;
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
  owner_id?: string;
  owner_display_name?: string | null;
  persona_greeting?: string | null;
  is_active?: boolean;
  avatar_image?: string | null;
  avatar_video_url?: string | null;
  avatar_script?: string | null;
  avatar_provider?: string | null;
}

export interface AvatarVideoJob {
  agent_id: string;
  provider: string;
  talk_id: string;
  video_url?: string | null;
  avatar_image?: string | null;
  script: string;
  status: string;
  instructions?: string | null;
}

export interface AIComposeResult {
  composed: string;
  tagged_as: string;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  currency: string;
  market_state: string;
  exchange: string;
}

export interface MarketHistoryPoint {
  time: number;
  close: number;
}

export interface MarketHistory {
  symbol: string;
  name: string;
  range: string;
  currency: string;
  current_price?: number | null;
  points: MarketHistoryPoint[];
}

export interface TrendingItem {
  symbol: string;
  name: string;
  price?: number | null;
  change_percent?: number | null;
}

export interface HubNewsItem {
  id: string;
  title: string;
  publisher: string;
  link: string;
  published_at?: number | null;
  related_tickers: string[];
}

export interface MapEvent {
  id: string;
  title: string;
  category: string;
  city: string;
  lat: number;
  lng: number;
  starts_at: string;
  status: string;
}

export interface DeviceStatus {
  id: string;
  name: string;
  type: string;
  status: string;
  detail: string;
  last_seen?: string | null;
}

export interface HubDashboard {
  markets: MarketQuote[];
  trending: TrendingItem[];
  news: HubNewsItem[];
  events: MapEvent[];
  devices: DeviceStatus[];
  updated_at: string;
  source: string;
}

export interface TwinMessage {
  id: string;
  twin_agent_id: string;
  from_name: string;
  body: string;
  direction: string;
  created_at: string;
}

export interface TwinBriefing {
  agent_id: string;
  twin_name: string;
  owner_display_name: string;
  greeting: string;
  message_count: number;
  post_count: number;
  activities: { type: string; summary: string; at: string }[];
  messages: TwinMessage[];
  voice_summary: string;
}

export interface RobotDashboard {
  twins: DigitalTwin[];
  recent_commands: { agent_id: string; command: string; safety_check: string; created_at: string }[];
  safety_channel_status: string;
  active_twin?: DigitalTwin | null;
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