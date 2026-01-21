export interface UserAttribute {
  name: string;
  value: string;
}

export interface UserInfo {
  sam_account_name: string;
  display_name: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  department?: string;
  groups: string[];
  password_last_set?: string;
  password_expires?: string;
  last_logon?: string;
  last_logon_timestamp?: string;
  when_created?: string;
  when_changed?: string;
  account_enabled: boolean;
  account_disabled: boolean;
  attributes: UserAttribute[];
}

export interface GroupInfo {
  name: string;
  distinguished_name: string;
  member_count: number;
}

export interface PasswordResetRequest {
  new_password: string;
  must_change: boolean;
}

export interface AccountStatusRequest {
  enabled: boolean;
}

export interface GroupMembershipRequest {
  group_name: string;
}

export interface GroupMemberInfo {
  sam_account_name: string;
  display_name: string;
  email?: string;
  distinguished_name: string;
}

export interface GroupMemberRequest {
  sam_account_name: string;
}

export interface ComputerInfo {
  sam_account_name: string;
  name: string;
  dns_host_name?: string;
  operating_system?: string;
  operating_system_version?: string;
  operating_system_service_pack?: string;
  last_logon?: string;
  last_logon_timestamp?: string;
  last_logged_on_user?: string;
  distinguished_name: string;
  organizational_unit?: string;
  location?: string;
  when_created?: string;
  when_changed?: string;
  groups: string[];
  account_enabled: boolean;
  account_disabled: boolean;
  description?: string;
  managed_by?: string;
  ip_address?: string;
  mac_address?: string;
  attributes: UserAttribute[];
}

export interface ComputerStatusRequest {
  enabled: boolean;
}

export interface ComputerMoveRequest {
  target_ou_dn: string;
}

export interface OUInfo {
  name: string;
  distinguished_name: string;
  description?: string;
  path: string;
}

export interface GroupCreateRequest {
  name: string;
  description?: string;
  ou_path?: string;
}

export interface PaginatedResponse<T> {
  [key: string]: T[] | number | boolean;
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UserPaginatedResponse extends PaginatedResponse<UserInfo> {
  users: UserInfo[];
}

export interface ComputerPaginatedResponse extends PaginatedResponse<ComputerInfo> {
  computers: ComputerInfo[];
}

export interface ConnectionSettings {
  server: string;
  domain: string;
  username: string;
  password: string;
  base_dn: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  timestamp: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_users: number;
  active_users: number;
  disabled_users: number;
  total_computers: number;
  active_computers: number;
  disabled_computers: number;
  total_groups: number;
  users_by_department: Record<string, number>;
  computers_by_os: Record<string, number>;
  recent_logins: Array<{
    sam_account_name: string;
    display_name: string;
    last_logon: string;
  }>;
  expiring_passwords: Array<{
    sam_account_name: string;
    display_name: string;
    days_left: number;
  }>;
}

// Audit Log Types
export type AuditActionType =
  | 'password_reset'
  | 'account_enable'
  | 'account_disable'
  | 'group_add'
  | 'group_remove'
  | 'computer_enable'
  | 'computer_disable'
  | 'computer_group_add'
  | 'computer_group_remove'
  | 'member_add'
  | 'member_remove'
  | 'group_create'
  | 'group_delete'
  | 'computer_move'
  | 'ad_change_detected';

export type AuditSource = 'web_app' | 'ad_detected';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action_type: AuditActionType;
  source: AuditSource;
  performed_by: string;
  target_object: string;
  target_type: string;
  details: Record<string, unknown>;
  success: boolean;
  error_message?: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface AuditStatistics {
  total_actions: number;
  actions_by_type: Record<string, number>;
  actions_by_source: Record<string, number>;
  actions_by_user: Record<string, number>;
  success_rate: number;
  recent_activity: AuditLogEntry[];
}

// AD Changes
export interface ADChange {
  object_type: 'user' | 'computer' | 'group';
  sam_account_name: string;
  display_name: string;
  when_changed: string;
  when_created: string;
  change_type: 'created' | 'modified';
}

export interface ADChangesResponse {
  changes: ADChange[];
  total_count: number;
  hours: number;
}

// Reports
export interface PasswordExpiryReport {
  users: Array<{
    sam_account_name: string;
    display_name: string;
    days_left: number;
  }>;
  total_count: number;
  days_threshold: number;
}

export interface InactiveComputersReport {
  computers: Array<{
    name: string;
    sam_account_name: string;
    last_logon: string;
    operating_system?: string;
    organizational_unit?: string;
  }>;
  total_count: number;
  days_threshold: number;
}

export interface ComputerInventoryReport {
  inventory: Record<string, {
    count: number;
    computers: string[];
  }>;
  total_count: number;
}
