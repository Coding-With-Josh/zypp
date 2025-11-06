import { ProfileRow, SessionRow } from "../lib/supabase/types";

// =============================================
// 🎯 CORE TYPES
// =============================================

export type NetworkType = "online" | "offline" | "connecting";
export type Platform = "ios" | "android" | "web";
export type Environment = "development" | "staging" | "production";
export type Currency = "usd" | "eur" | "gbp" | "jpy" | "cny";

// =============================================
// 🔐 AUTH & USER TYPES
// =============================================

export type UserProfile = ProfileRow & {
  metadata?: Record<string, any>;
};

export type UserSession = SessionRow;

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: UserSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface Web3Signature {
  message: string;
  signature: string;
  publicKey: string;
  signedAt: string;
}

// =============================================
// 💰 WALLET & CRYPTO TYPES
// =============================================

export type WalletType = "custodial" | "external" | "hardware";

export interface SolanaWallet {
  id: string;
  user_id: string;
  public_key: string;
  encrypted_private_key: string;
  key_encryption_version: number;
  derivation_path?: string;
  wallet_type: WalletType;
  is_primary: boolean;
  created_at: string;
  last_used: string;
}

export interface WalletBalance {
  id: string;
  wallet_id: string;
  sol_balance: number;
  usd_value: number;
  token_count: number;
  nft_count: number;
  last_updated: string;
  token_balances?: {
    [key: string]: {
      amount: number;
      usd_value?: number;
      mint: string;
      decimals: number;
    };
  };
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: number;
  usd_value: number;
  logo_uri?: string;
}

export interface NFTBalance {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  image: string;
  description?: string;
  attributes?: NFTAttribute[];
  collection?: {
    name: string;
    family: string;
  };
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface KeypairEncrypted {
  publicKey: string;
  encryptedSecret: string;
  encryption: {
    algorithm: "aes-256-gcm";
    version: number;
    salt: string;
    iv: string;
    authTag: string;
  };
}

// =============================================
// 📊 TRANSACTION TYPES
// =============================================

export type TransactionType =
  | "transfer"
  | "token_transfer"
  | "nft_transfer"
  | "swap"
  | "airdrop"
  | "receive"
  | "stake"
  | "unstake";

export type TransactionStatus =
  | "draft"
  | "signed_offline"
  | "queued"
  | "pending"
  | "confirmed"
  | "failed"
  | "expired";

export type ConfirmationStatus = "processed" | "confirmed" | "finalized";

export interface BaseTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  signature?: string;
  from_address: string;
  to_address: string;
  amount: number;
  token_mint?: string;
  symbol: string;
  usd_value?: number;
  fee: number;
  nonce: string;
  durable_nonce_account?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  failed_at?: string;
  error_message?: string;
  blockhash?: string;
  last_valid_block_height?: number;
}

export interface OfflineTransaction extends BaseTransaction {
  envelope: string;
  signed_data: string;
  p2p_metadata: P2PMetadata;
  is_offline: true;
  sync_attempts: number;
  last_sync_attempt?: string;
  retry_count: number;
  next_retry_at?: string;
  sync_priority: number;
  offline_version: number;
  offline_metadata: {
    local_signed_at?: string;
    original_created_at: string;
    device_id: string;
    network_status: string;
    error_details?: {
      code: string;
      message: string;
      retry_strategy: string;
    };
  };
}

export interface OnlineTransaction extends BaseTransaction {
  is_offline: false;
  slot?: number;
  confirmation_status?: ConfirmationStatus;
}

export type Transaction = OfflineTransaction | OnlineTransaction;

export interface TransactionEnvelope {
  version: number;
  transaction_data: string;
  signatures: string[];
  nonce: string;
  metadata: {
    created_at: string;
    expires_at: string;
    network: "mainnet-beta" | "devnet" | "testnet";
  };
}

export interface TransactionSummary {
  total_count: number;
  pending_count: number;
  failed_count: number;
  total_sent: number;
  total_received: number;
  last_transaction_date: string | null;
}

// =============================================
// 📡 P2P & OFFLINE TYPES
// =============================================

export type P2PTransport =
  | "wifi_direct"
  | "bluetooth"
  | "multipeer"
  | "nfc"
  | "qr_code"
  | "local_network";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface P2PMetadata {
  transport: P2PTransport;
  sender_device_id: string;
  receiver_device_id?: string;
  hop_count: number;
  discovered_at: string;
  received_at: string;
  rssi?: number;
  channel_id?: string;
}

export interface PeerDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  platform: Platform;
  app_version: string;
  last_seen: string;
  is_online: boolean;
  transport_capabilities: P2PTransport[];
  public_key: string;
  connection_strength?: number;
}

export interface P2PConnection {
  id: string;
  local_device_id: string;
  peer_device_id: string;
  transport: P2PTransport;
  status: ConnectionStatus;
  established_at: string;
  last_activity: string;
  metadata: {
    channel?: string;
    service_uuid?: string;
    session_id?: string;
  };
}

export interface DiscoverySession {
  id: string;
  user_id: string;
  device_id: string;
  transport: P2PTransport;
  is_advertising: boolean;
  is_browsing: boolean;
  started_at: string;
  ended_at?: string;
  discovered_peers: string[];
}

export type MessageType =
  | "transaction"
  | "handshake"
  | "ping"
  | "contact_request";

export interface P2PMessage {
  id: string;
  type: MessageType;
  from_device_id: string;
  to_device_id: string;
  payload: string;
  encryption: {
    algorithm: "x25519-xsalsa20-poly1305";
    sender_public_key: string;
    nonce: string;
  };
  transport: P2PTransport;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  hop_path: string[];
}

// =============================================
// 💬 MESSAGE & NOTIFICATION TYPES
// =============================================

export type NotificationType =
  | "transaction_received"
  | "transaction_confirmed"
  | "contact_joined"
  | "airdrop_received"
  | "security_alert";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

// =============================================
// 👥 CONTACTS & SOCIAL TYPES
// =============================================

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  contact_username: string;
  contact_public_key: string;
  nickname?: string;
  tags: string[];
  is_favorite: boolean;
  last_interaction: string;
  transaction_count: number;
  created_at: string;
}

export type ContactRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface ContactRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_username: string;
  to_username: string;
  status: ContactRequestStatus;
  message?: string;
  created_at: string;
  responded_at?: string;
}

// =============================================
// 🔧 CONFIGURATION & SETTINGS TYPES
// =============================================

export interface NotificationSettings {
  transactions: boolean;
  promotions: boolean;
  security: boolean;
  p2p_discovery: boolean;
}

export interface SecuritySettings {
  auto_lock: number;
  biometrics: boolean;
  hide_balances: boolean;
  transaction_confirmation: boolean;
}

export interface P2PSettings {
  auto_accept: boolean;
  discovery_range: "near" | "medium" | "far";
  preferred_transport: P2PTransport;
}

export interface AppSettings {
  id: string;
  user_id: string;
  currency: Currency;
  language: string;
  appearance: "light" | "dark" | "auto";
  notifications: NotificationSettings;
  security: SecuritySettings;
  p2p: P2PSettings;
  created_at: string;
  updated_at: string;
}

export interface DeviceSettings {
  id: string;
  user_id: string;
  device_id: string;
  p2p_enabled: boolean;
  transports_enabled: P2PTransport[];
  auto_join_networks: boolean;
  battery_optimization: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// 🗄️ DATABASE & STORAGE TYPES
// =============================================

export interface DatabaseSchema {
  profiles: UserProfile;
  sessions: UserSession;
  wallets: SolanaWallet;
  wallet_balances: WalletBalance;
  transactions: Transaction;
  p2p_messages: P2PMessage;
  peer_devices: PeerDevice;
  p2p_connections: P2PConnection;
  discovery_sessions: DiscoverySession;
  contacts: Contact;
  contact_requests: ContactRequest;
  notifications: Notification;
  app_settings: AppSettings;
  device_settings: DeviceSettings;
  encrypted_backups: EncryptedBackup;
  security_events: SecurityEvent;
  error_logs: ErrorLog;
}

export interface LocalStorageSchema {
  auth: {
    session: UserSession | null;
    pinHash: string;
    biometricEnabled: boolean;
  };
  wallet: {
    encryptedKeypair: KeypairEncrypted;
    balances: WalletBalance;
    recentTransactions: Transaction[];
    contacts: Contact[];
  };
  p2p: {
    recentPeers: PeerDevice[];
    pendingTransactions: OfflineTransaction[];
    discoverySessions: DiscoverySession[];
  };
  app: {
    settings: AppSettings;
    lastSync: string;
    offlineQueue: any[];
  };
}

// =============================================
// 🔄 SYNC & BACKUP TYPES
// =============================================

export interface SyncState {
  last_sync: string;
  pending_transactions: number;
  pending_messages: number;
  is_syncing: boolean;
  error_count: number;
}

export interface SyncResult {
  success: boolean;
  pulled: {
    transactions: number;
    contacts: number;
    peers: number;
  };
  pushed: {
    transactions: number;
    contacts: number;
    peers: number;
  };
  conflicts: number;
  errors: string[];
}

export type BackupType = "full" | "wallet_only" | "settings";

export interface EncryptedBackup {
  id: string;
  user_id: string;
  backup_type: BackupType;
  encrypted_data: string;
  encryption_key_hash: string;
  version: number;
  created_at: string;
  device_id: string;
  size_bytes: number;
}

export interface BackupMetadata {
  wallet_count: number;
  transaction_count: number;
  contact_count: number;
  settings_count: number;
  total_size: number;
  created_at: string;
}

// =============================================
// ⚠️ ERROR & LOGGING TYPES
// =============================================

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export interface AppError {
  code: string;
  message: string;
  context?: any;
  timestamp: string;
  stack?: string;
  user_id?: string;
  device_id: string;
}

export interface ErrorLog {
  id: string;
  error_code: string;
  severity: ErrorSeverity;
  message: string;
  context: any;
  user_id?: string;
  device_id: string;
  app_version: string;
  os_version: string;
  created_at: string;
}

// =============================================
// 🛡️ SECURITY & COMPLIANCE TYPES
// =============================================

export type SecurityEventType =
  | "login"
  | "logout"
  | "pin_change"
  | "wallet_export"
  | "backup_created"
  | "suspicious_activity";

export type SecuritySeverity = "info" | "warning" | "alert";

export interface SecurityEvent {
  id: string;
  user_id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  ip_address?: string;
  device_id: string;
  location?: string;
  created_at: string;
}

export interface ComplianceData {
  country_code: string;
  tax_id?: string;
  kyc_status: "none" | "pending" | "verified" | "rejected";
  aml_check: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// 📊 ANALYTICS & METRICS TYPES
// =============================================

export interface AnalyticsEvent {
  name: string;
  properties: any;
  user_id?: string;
  device_id: string;
  session_id: string;
  timestamp: string;
  app_version: string;
  platform: Platform;
}

export interface PerformanceMetrics {
  app_start_time: number;
  transaction_sign_time: number;
  p2p_connection_time: number;
  sync_duration: number;
  memory_usage: number;
  battery_impact: number;
  timestamp: string;
}

// =============================================
// 🎛️ API & SERVICE TYPES
// =============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    has_more?: boolean;
  };
}

export interface SolanaRPCResponse {
  jsonrpc: string;
  result: any;
  id: number;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// =============================================
// 🎨 UI & NAVIGATION TYPES
// =============================================

export type OnboardingStep =
  | "username"
  | "wallet"
  | "pin"
  | "setup"
  | "complete";

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: string[];
  data: {
    username?: string;
    walletAddress?: string;
    pinHash?: string;
  };
  isResuming: boolean;
}

export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  params: any;
  history: string[];
}

// =============================================
// 🔄 EVENT & OBSERVABLE TYPES
// =============================================

export interface AppEvent {
  type: string;
  payload: any;
  timestamp: string;
  source: string;
}

export type EventType =
  | "transaction:created"
  | "transaction:signed"
  | "transaction:confirmed"
  | "transaction:failed"
  | "p2p:peer_discovered"
  | "p2p:peer_lost"
  | "p2p:message_received"
  | "p2p:connection_changed"
  | "wallet:balance_updated"
  | "auth:session_expired"
  | "sync:started"
  | "sync:completed"
  | "sync:failed"
  | "backup:created"
  | "backup:restored"
  | "error:occurred";

// =============================================
// 🔄 NONCE ACCOUNT TYPES
// =============================================

export interface NonceAccountInfo {
  publicKey: string;
  authority: string;
  nonce: string;
  balance: number;
  feeCalculator: {
    lamportsPerSignature: number;
  };
  created_at: string;
  last_used: string | null;
  is_active: boolean;
  network: "mainnet-beta" | "devnet" | "testnet";
  purpose?: "offline_tx" | "airdrop" | "general";
}

export interface DurableNonceConfig {
  nonceAccount: string;
  nonceValue: string;
  authority: string;
  reserved_at: string;
  expires_at: string;
  is_used: boolean;
  used_at?: string;
  transaction_id?: string;
}

export interface NonceTransaction {
  nonce: string;
  nonceAccount: string;
  instruction: any; // Solana Instruction
  signature?: string;
  status: "reserved" | "signed" | "broadcast" | "confirmed" | "expired";
}

// =============================================
// 🎯 UTILITY TYPES
// =============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Require<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// =============================================
// 📊 DATABASE VIEW TYPES
// =============================================

export interface UserActivitySummary {
  user_id: string;
  username: string;
  joined_at: string;
  last_seen: string;
  is_online: boolean;
  wallet_count: number;
  transaction_count: number;
  contact_count: number;
  device_count: number;
  total_volume: number;
}

export interface PlatformStats {
  platform: Platform;
  user_count: number;
  device_count: number;
  avg_hours_since_seen: number;
  online_devices: number;
}

export interface TransactionAnalytics {
  transaction_date: string;
  type: TransactionType;
  status: TransactionStatus;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
  offline_count: number;
}

export interface P2PNetworkActivity {
  transport: P2PTransport;
  connection_count: number;
  unique_devices: number;
  avg_connection_duration_seconds: number;
  most_recent_activity: string;
}
