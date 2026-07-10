export type UserMode = "kids" | "prime" | "professional";
export type SubscriptionTier = "free" | "premium" | "business";
export type PostSector = "personal" | "business_general" | "business_corporate";
/** @deprecated Use PostSector — 'professional' is normalized to business_general */
export type ViewContext = PostSector | "professional";
export type FeedType =
  | "global"
  | "connections"
  | "professional"
  | "business_general"
  | "business_corporate";
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
  context?: ViewContext | PostSector;
  org_id?: string | null;
  media_url?: string | null;
  post_type?: PostType;
  filter_preset?: string | null;
  is_twin_post?: boolean;
  twin_agent_id?: string | null;
  owner_display_name?: string | null;
  ai_assisted?: boolean;
  hide_ai_tag?: boolean;
  place_id?: string | null;
  place_name?: string | null;
  place_address?: string | null;
  place_lat?: number | null;
  place_lng?: number | null;
  location_label?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  is_live_session?: boolean;
}

export type PostType = "text" | "reel" | "photo" | "live";

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  mode: UserMode;
  context: PostSector;
  org_id?: string | null;
  org_name?: string | null;
  visibility: ContentVisibility;
  media_url?: string | null;
  moderation_status?: string;
  post_type?: PostType;
  filter_preset?: string | null;
  is_twin_post?: boolean;
  twin_agent_id?: string | null;
  is_ai_generated?: boolean;
  show_ai_tag?: boolean;
  place_id?: string | null;
  place_name?: string | null;
  place_address?: string | null;
  place_lat?: number | null;
  place_lng?: number | null;
  location_label?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  is_live_session?: boolean;
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

export interface BusinessToolsAccess {
  user_id: string;
  tools_allowed: boolean;
  status: string;
  trial_ends_at?: string | null;
  message: string;
}

export interface BusinessToolsStatus {
  user_id: string;
  tools_active: boolean;
  trial_active: boolean;
  trial_ends_at?: string | null;
  subscription_status: string;
  monthly_price_gbp: number;
}

export interface ProfessionalDashboard {
  profile: ProfessionalProfile;
  insights: { label: string; value: string; trend: string }[];
  connection_suggestions: string[];
  business_tools?: BusinessToolsAccess | null;
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

export interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  types?: string[];
  open_now?: boolean | null;
  source?: string;
  post_id?: string | null;
  promoted_by?: string | null;
}

export interface DirectionsResult {
  summary: string;
  distance: string;
  duration: string;
  steps: { instruction: string; distance: string }[];
  polyline?: string | null;
}

export interface ArticlePreview {
  title: string;
  content_html: string;
  source_url: string;
  publisher: string;
}

export interface HubDashboard {
  markets: MarketQuote[];
  trending: TrendingItem[];
  news: HubNewsItem[];
  events: MapEvent[];
  devices: DeviceStatus[];
  promoted_places?: PlaceResult[];
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
  viewContext: PostSector;
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

export type LocationSource = "app" | "login" | "live" | "find_me";

export interface LocationUpdateRequest {
  lat: number;
  lng: number;
  location_label: string;
  find_me_enabled?: boolean;
  share_with_followers?: boolean;
  show_live_tag?: boolean;
  is_live?: boolean;
  source?: LocationSource;
}

export interface UserLocation {
  user_id: string;
  display_name: string;
  lat: number;
  lng: number;
  location_label: string;
  find_me_enabled: boolean;
  share_with_followers: boolean;
  show_live_tag: boolean;
  is_live: boolean;
  last_login_label?: string | null;
  last_login_at?: string | null;
  live_since?: string | null;
  updated_at: string;
}

export interface MemberLocation {
  user_id: string;
  display_name: string;
  lat: number;
  lng: number;
  location_label: string;
  is_live: boolean;
  find_me_enabled: boolean;
  live_since?: string | null;
  updated_at: string;
}

export interface Wallet {
  user_id: string;
  balance: number;
  currency: string;
  bonus_coins: number;
  creator_balance?: number;
  stripe_connected: boolean;
  paypal_connected: boolean;
}

export interface WalletTransaction {
  id: string;
  type: string;
  label: string;
  amount: number;
  currency: string;
  order_id?: string | null;
  created_at: string;
}

export interface MarketplaceProduct {
  id: string;
  seller_id: string;
  seller_name: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  image_emoji: string;
  media_url?: string | null;
  media_type?: string | null;
  stock: number;
  status: string;
  is_digital: boolean;
  created_at: string;
}

export interface CreateProductRequest {
  title: string;
  description?: string;
  price: number;
  category?: string;
  image_emoji?: string;
  stock?: number;
  is_digital?: boolean;
  media_url?: string | null;
  media_type?: string | null;
  org_id?: string | null;
}

export interface MediaUploadResult {
  url: string;
  filename: string;
  original_name: string;
  mime_type: string;
  media_type: string;
  size_bytes: number;
  context: string;
  max_duration_sec?: number | null;
  aspect_hint?: string | null;
}

export interface CartItem {
  product_id: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  image_emoji: string;
  seller_name: string;
  line_total: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  currency: string;
  item_count: number;
}

export interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  status: string;
  total: number;
  currency: string;
  items: OrderItem[];
  created_at: string;
}

export interface CheckoutResult {
  orders: Order[];
  total_paid: number;
  currency: string;
}

export interface MarketplaceDashboard {
  active_listings: number;
  total_sales: number;
  orders_to_fulfill: number;
  currency: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface InboxSummary {
  unread_count: number;
  notifications: Notification[];
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  sector: string;
  member_count: number;
  created_at: string;
}

export interface TeamMember {
  user_id: string;
  display_name: string;
  role: string;
}

export interface Meeting {
  id: string;
  team_id: string | null;
  host_id: string;
  host_name: string;
  title: string;
  scheduled_at: string;
  duration_min: number;
  room_code: string;
  status: string;
  created_at: string;
}

export interface CallSession {
  id: string;
  caller_id: string;
  caller_name: string;
  callee_id: string;
  callee_name: string;
  call_type: "voice" | "video";
  status: string;
  room_code: string;
  started_at: string;
  ended_at?: string | null;
}

export interface StatusUpdate {
  id: string;
  user_id: string;
  display_name: string;
  text: string | null;
  media_url: string | null;
  media_type: string | null;
  expires_at: string;
  created_at: string;
}

export interface Contact {
  id: string;
  contact_user_id: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  source: string;
  created_at: string;
}

export interface PodcastEpisode {
  id: string;
  user_id: string;
  title: string;
  description: string;
  media_url: string | null;
  episode_type: "podcast" | "vlog" | "tv";
  published_at: string | null;
  created_at: string;
}

export interface ShareResult {
  shared_count: number;
  contact_ids: string[];
}

export interface GiftCatalogItem {
  id: string;
  emoji: string;
  name: string;
  coin_cost: number;
  creator_payout_gbp: number;
}

export interface CreatorEarning {
  id: string;
  source: string;
  amount: number;
  label: string;
  created_at: string;
}

export interface CreatorDashboard {
  nex_coins: number;
  creator_balance: number;
  qualified_views_month: number;
  rewards_estimate_gbp: number;
  gifts_earned_month_gbp: number;
  affiliate_earned_month_gbp: number;
  coin_packs: { id: string; coins: number; price_gbp: number }[];
  recent_earnings: CreatorEarning[];
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  category?: string | null;
  tagline?: string | null;
}

export interface CorporateSector {
  id: string;
  label: string;
  description: string;
  examples: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  sector_category?: string | null;
  size_band?: string | null;
  website?: string | null;
  description?: string | null;
  corporate_email?: string | null;
  email_domain?: string | null;
  email_verified?: boolean;
  credentials_verified?: boolean;
  can_serve_public?: boolean;
  verified: boolean;
  created_at?: string | null;
}

export interface CorporateComplianceStatus {
  org_id: string;
  corporate_email?: string | null;
  email_domain?: string | null;
  sector_category?: string | null;
  email_verified: boolean;
  credentials_verified: boolean;
  can_serve_public: boolean;
  networking_trial_active: boolean;
  networking_active: boolean;
  trial_ends_at?: string | null;
  subscription_status: string;
  monthly_price_gbp: number;
}

export interface OrgNetworkingAccess {
  org_id: string;
  networking_allowed: boolean;
  status: string;
  trial_ends_at?: string | null;
  message: string;
}

export interface CorporateServiceListing {
  id: string;
  org_id: string;
  org_name: string;
  sector_category: string;
  title: string;
  description: string;
  price_hint?: string | null;
  is_public: boolean;
  created_at?: string | null;
}

export interface OrgMembership {
  org_id: string;
  org_name: string;
  role: string;
  title?: string | null;
}

export interface CorporateDashboard {
  profile: UserProfile;
  memberships: OrgMembership[];
  insights: { label: string; value: string; trend?: string }[];
  hiring_posts: number;
  compliance?: CorporateComplianceStatus[];
  networking_access?: OrgNetworkingAccess[];
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string | null;
  start_year?: string | null;
  end_year?: string | null;
  is_current: boolean;
  description?: string | null;
  sector?: string | null;
}

export interface CareerProfile {
  user_id: string;
  display_name: string;
  headline?: string | null;
  summary?: string | null;
  skills?: string | null;
  cv_url?: string | null;
  cv_filename?: string | null;
  location?: string | null;
  sector_focus?: string | null;
  open_to_work: boolean;
  open_to_contract: boolean;
  profile_score: number;
  experiences: WorkExperience[];
}

export interface PeopleSearchResult {
  user_id: string;
  display_name: string;
  headline?: string | null;
  skills?: string | null;
  location?: string | null;
  sector_focus?: string | null;
  profile_score: number;
  open_to_work: boolean;
  open_to_contract: boolean;
}

export interface JobPosting {
  id: string;
  org_id: string;
  org_name: string;
  title: string;
  description: string;
  sector_category: string;
  location_type: string;
  employment_type: string;
  salary_range?: string | null;
  skills_required?: string | null;
  education_level?: string | null;
  status: string;
  created_at?: string | null;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  cover_note?: string | null;
  cv_url?: string | null;
  status: string;
  created_at?: string | null;
}