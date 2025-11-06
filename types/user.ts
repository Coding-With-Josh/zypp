// Profile types that match the database schema
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  last_seen: string;
  is_online: boolean;
  device_count: number;
  status: "active" | "inactive" | "suspended" | "pending_setup";
  role: "user" | "admin" | "moderator";
  preferences: {
    currency: string;
    language: string;
    theme: "light" | "dark" | "system";
    notifications: boolean;
  };
  metadata: Record<string, any>;
}

// App settings from database schema
export interface AppSettings {
  notifications: {
    transactions: boolean;
    promotions: boolean;
    security: boolean;
    p2p_discovery: boolean;
  };
  security: {
    auto_lock: number; // minutes
    biometrics: boolean;
    hide_balances: boolean;
    transaction_confirmation: boolean;
  };
  p2p: {
    auto_accept: boolean;
    discovery_range: "short" | "medium" | "long";
    preferred_transport: "bluetooth" | "wifi_direct" | "local_network";
  };
}

// Device settings from database schema
export interface DeviceSettings {
  p2p_enabled: boolean;
  transports_enabled: string[];
  auto_join_networks: boolean;
  battery_optimization: boolean;
}

// Combined user profile type for the app
export interface UserProfile extends Profile {
  settings?: AppSettings;
  deviceSettings?: DeviceSettings;
  wallets?: {
    primary_wallet?: string;
    addresses: string[];
  };
}

// Nearby user type for multipeer connectivity
export interface ZyppUser {
  id: string;
  username: string;
  displayName: string;
  avatar: any; // For both remote URLs and local images
  isOnline: boolean;
  isNearby?: boolean; // For multipeer discovery
  address: string; // Solana wallet address
  lastSeen?: Date;
  deviceId?: string; // For multipeer connectivity
  deviceSettings?: DeviceSettings;
  // P2P capabilities
  transport_capabilities?: (
    | "wifi_direct"
    | "bluetooth"
    | "multipeer"
    | "nfc"
    | "qr_code"
    | "local_network"
  )[];
  device_id?: string; // For P2P connectivity
  connection_strength?: number; // Signal strength for nearby connections
}
