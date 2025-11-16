export interface AppPreferences {
  currency: string;
  language: string;
  theme: "light" | "dark" | "system";
  notifications: boolean;
  analytics: boolean;
}

export interface SecuritySettings {
  auto_lock: number;
  biometrics: boolean;
  hide_balances: boolean;
  transaction_confirmation: boolean;
}

export interface NotificationSettings {
  transactions: boolean;
  promotions: boolean;
  security: boolean;
  p2p_discovery: boolean;
}

export interface P2PSettings {
  auto_accept: boolean;
  discovery_range: "short" | "medium" | "long";
  preferred_transport: "bluetooth" | "wifi_direct" | "local_network";
}

export interface AppSettings {
  notifications: NotificationSettings;
  security: SecuritySettings;
  p2p: P2PSettings;
}

// Types for settings items in the UI
export interface SettingsOption {
  label: string;
  value: string | number | boolean;
}

interface BaseSettingsItem {
  icon: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
}

export interface ToggleSettingsItem extends BaseSettingsItem {
  type: "toggle";
  value: boolean;
  onToggle: (value: boolean) => void;
}

export interface SelectSettingsItem extends BaseSettingsItem {
  type: "select";
  value: string | number;
  options: SettingsOption[];
  onChange: (value: any) => void;
}

export interface LinkSettingsItem extends BaseSettingsItem {
  type: "link";
  route: string;
}

export type SettingsItem =
  | ToggleSettingsItem
  | SelectSettingsItem
  | LinkSettingsItem;

export interface SettingsSection {
  title: string;
  items: SettingsItem[];
}
