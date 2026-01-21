import axios from 'axios';
import type {
  UserInfo, GroupInfo, GroupMemberInfo, ComputerInfo,
  PasswordResetRequest, AccountStatusRequest, ComputerStatusRequest,
  GroupMembershipRequest, GroupMemberRequest, ConnectionSettings, ConnectionTestResult,
  DashboardStats, AuditLogsResponse, AuditStatistics, ADChangesResponse,
  PasswordExpiryReport, InactiveComputersReport, ComputerInventoryReport,
  UserPaginatedResponse, ComputerPaginatedResponse, OUInfo,
  GroupCreateRequest, ComputerMoveRequest
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userApi = {
  getUsers: async (group?: string, search?: string): Promise<UserInfo[]> => {
    const params = new URLSearchParams();
    if (group) params.append('group', group);
    if (search) params.append('search', search);

    const response = await api.get<UserInfo[]>('/users', { params });
    return response.data;
  },

  getUsersPaginated: async (params: { page?: number; page_size?: number; group?: string; search?: string }): Promise<UserPaginatedResponse> => {
    const response = await api.get<UserPaginatedResponse>('/users/paginated', { params });
    return response.data;
  },

  getUser: async (samAccountName: string): Promise<UserInfo> => {
    const response = await api.get<UserInfo>(`/users/${samAccountName}`);
    return response.data;
  },

  resetPassword: async (samAccountName: string, request: PasswordResetRequest): Promise<void> => {
    await api.post(`/users/${samAccountName}/reset-password`, request);
  },

  setAccountStatus: async (samAccountName: string, request: AccountStatusRequest): Promise<void> => {
    await api.post(`/users/${samAccountName}/account-status`, request);
  },

  addUserToGroup: async (samAccountName: string, request: GroupMembershipRequest): Promise<void> => {
    await api.post(`/users/${samAccountName}/groups/add`, request);
  },

  removeUserFromGroup: async (samAccountName: string, request: GroupMembershipRequest): Promise<void> => {
    await api.post(`/users/${samAccountName}/groups/remove`, request);
  },
};

export const groupApi = {
  getGroups: async (): Promise<GroupInfo[]> => {
    const response = await api.get<GroupInfo[]>('/groups');
    return response.data;
  },

  getGroup: async (groupName: string): Promise<GroupInfo> => {
    const response = await api.get<GroupInfo>(`/groups/${groupName}`);
    return response.data;
  },

  getGroupMembers: async (groupName: string): Promise<GroupMemberInfo[]> => {
    const response = await api.get<GroupMemberInfo[]>(`/groups/${groupName}/members`);
    return response.data;
  },

  addMemberToGroup: async (groupName: string, request: GroupMemberRequest): Promise<void> => {
    await api.post(`/groups/${groupName}/members/add`, request);
  },

  removeMemberFromGroup: async (groupName: string, request: GroupMemberRequest): Promise<void> => {
    await api.post(`/groups/${groupName}/members/remove`, request);
  },

  createGroup: async (request: GroupCreateRequest): Promise<void> => {
    await api.post('/groups', request);
  },

  deleteGroup: async (groupName: string): Promise<void> => {
    await api.delete(`/groups/${groupName}`);
  },
};

export const computerApi = {
  getComputers: async (search?: string, ou?: string): Promise<ComputerInfo[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (ou) params.append('ou', ou);

    const response = await api.get<ComputerInfo[]>('/computers', { params });
    return response.data;
  },

  getComputersPaginated: async (params: { page?: number; page_size?: number; search?: string; ou?: string }): Promise<ComputerPaginatedResponse> => {
    const response = await api.get<ComputerPaginatedResponse>('/computers/paginated', { params });
    return response.data;
  },

  getComputer: async (samAccountName: string): Promise<ComputerInfo> => {
    const response = await api.get<ComputerInfo>(`/computers/${samAccountName}`);
    return response.data;
  },

  setComputerStatus: async (samAccountName: string, request: ComputerStatusRequest): Promise<void> => {
    await api.post(`/computers/${samAccountName}/account-status`, request);
  },

  addComputerToGroup: async (samAccountName: string, request: GroupMembershipRequest): Promise<void> => {
    await api.post(`/computers/${samAccountName}/groups/add`, request);
  },

  removeComputerFromGroup: async (samAccountName: string, request: GroupMembershipRequest): Promise<void> => {
    await api.post(`/computers/${samAccountName}/groups/remove`, request);
  },

  moveComputer: async (samAccountName: string, request: ComputerMoveRequest): Promise<void> => {
    await api.post(`/computers/${samAccountName}/move`, request);
  },

  getOUs: async (): Promise<OUInfo[]> => {
    const response = await api.get<OUInfo[]>('/ous');
    return response.data;
  },
};

export const settingsApi = {
  testConnection: async (settings: ConnectionSettings): Promise<ConnectionTestResult> => {
    const response = await api.post<ConnectionTestResult>('/test-connection', settings);
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};

// Audit Log API
export const auditApi = {
  getLogs: async (params?: {
    limit?: number;
    offset?: number;
    action_type?: string;
    target_object?: string;
    target_type?: string;
    performed_by?: string;
    source?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<AuditLogsResponse> => {
    const response = await api.get<AuditLogsResponse>('/audit/logs', { params });
    return response.data;
  },

  getStatistics: async (): Promise<AuditStatistics> => {
    const response = await api.get<AuditStatistics>('/audit/statistics');
    return response.data;
  },
};

// AD Changes API
export const changesApi = {
  getRecentChanges: async (hours?: number, objectType?: string): Promise<ADChangesResponse> => {
    const params = new URLSearchParams();
    if (hours) params.append('hours', hours.toString());
    if (objectType) params.append('object_type', objectType);

    const response = await api.get<ADChangesResponse>('/changes/recent', { params });
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  getPasswordExpiryReport: async (days?: number): Promise<PasswordExpiryReport> => {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());

    const response = await api.get<PasswordExpiryReport>('/reports/password-expiry', { params });
    return response.data;
  },

  getInactiveComputersReport: async (days?: number): Promise<InactiveComputersReport> => {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());

    const response = await api.get<InactiveComputersReport>('/reports/inactive-computers', { params });
    return response.data;
  },

  getComputerInventory: async (): Promise<ComputerInventoryReport> => {
    const response = await api.get<ComputerInventoryReport>('/reports/computer-inventory');
    return response.data;
  },
};

export default api;
