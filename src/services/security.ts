// Security / Privacy / Compliance Service Interface and Implementation
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  riskScore: number;
  status: string;
  createdAt: Date;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  version: string;
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
}

export interface PrivacySetting {
  id: string;
  userId: string;
  settingKey: string;
  settingValue: Record<string, any>;
  category?: string;
  updatedAt: Date;
}

export interface CreateConsentRecordRequest {
  userId: string;
  consentType: string;
  version: string;
  granted: boolean;
  metadata?: Record<string, any>;
}

export interface UpdatePrivacySettingsRequest {
  settings: Record<string, Record<string, any>>;
}

export interface GetAuditLogsQuery {
  userId?: string;
  action?: string;
  resourceType?: string;
  status?: string;
  minRiskScore?: number;
  maxRiskScore?: number;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SecurityDashboard {
  totalEvents: number;
  highRiskEvents: number;
  failedLogins: number;
  suspiciousIps: number;
  dataAccessRequests: number;
  consentGrants: number;
  consentRevocations: number;
  recentEvents: Array<{
    timestamp: string;
    eventType: string;
    description: string;
    riskScore: number;
  }>;
  privacyMetrics: {
    dataProcessingConsents: number;
    analyticsOptIns: number;
    thirdPartySharingConsents: number;
    dataRetentionCompliance: string;
  };
}

export interface SecurityService {
  // Audit logging
  getAuditLogs: (query?: GetAuditLogsQuery) => Promise<AuditLog[]>;
  
  // Consent management
  createConsentRecord: (request: CreateConsentRecordRequest) => Promise<ConsentRecord>;
  getUserConsents: (userId: string) => Promise<ConsentRecord[]>;
  
  // Privacy settings
  updatePrivacySettings: (userId: string, request: UpdatePrivacySettingsRequest) => Promise<PrivacySetting[]>;
  getUserPrivacySettings: (userId: string) => Promise<PrivacySetting[]>;
  
  // Security dashboard
  getSecurityDashboard: () => Promise<SecurityDashboard>;
}

class SecurityServiceImpl implements SecurityService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getAuditLogs(query?: GetAuditLogsQuery): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (query?.userId) params.append('user_id', query.userId);
    if (query?.action) params.append('action', query.action);
    if (query?.resourceType) params.append('resource_type', query.resourceType);
    if (query?.status) params.append('status', query.status);
    if (query?.minRiskScore !== undefined) params.append('min_risk_score', query.minRiskScore.toString());
    if (query?.maxRiskScore !== undefined) params.append('max_risk_score', query.maxRiskScore.toString());
    if (query?.fromDate) params.append('from_date', query.fromDate.toISOString());
    if (query?.toDate) params.append('to_date', query.toDate.toISOString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/security/audit-logs?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    return response.json();
  }

  async createConsentRecord(request: CreateConsentRecordRequest): Promise<ConsentRecord> {
    const response = await fetch(`${this.baseUrl}/api/security/consents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create consent record: ${response.statusText}`);
    return response.json();
  }

  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    const response = await fetch(`${this.baseUrl}/api/security/users/${userId}/consents`);
    if (!response.ok) throw new Error(`Failed to fetch user consents: ${response.statusText}`);
    return response.json();
  }

  async updatePrivacySettings(userId: string, request: UpdatePrivacySettingsRequest): Promise<PrivacySetting[]> {
    const response = await fetch(`${this.baseUrl}/api/security/users/${userId}/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update privacy settings: ${response.statusText}`);
    return response.json();
  }

  async getUserPrivacySettings(userId: string): Promise<PrivacySetting[]> {
    const response = await fetch(`${this.baseUrl}/api/security/users/${userId}/privacy`);
    if (!response.ok) throw new Error(`Failed to fetch user privacy settings: ${response.statusText}`);
    return response.json();
  }

  async getSecurityDashboard(): Promise<SecurityDashboard> {
    const response = await fetch(`${this.baseUrl}/api/security/dashboard`);
    if (!response.ok) throw new Error(`Failed to fetch security dashboard: ${response.statusText}`);
    return response.json();
  }
}

// Singleton instance
export const securityService = new SecurityServiceImpl();

// React hook
export const useSecurityService = (): SecurityService => {
  return securityService;
};

// Privacy helpers
export function getDefaultPrivacySettings(): Record<string, Record<string, any>> {
  return {
    'data_collection': {
      'analytics': false,
      'crash_reports': true,
      'usage_statistics': false,
    },
    'sharing': {
      'profile_visibility': 'private',
      'activity_sharing': false,
      'third_party_sharing': false,
    },
    'analytics': {
      'personalized_ads': false,
      'behavioral_tracking': false,
      'performance_metrics': true,
    },
    'security': {
      'two_factor_auth': false,
      'login_notifications': true,
      'session_timeout': 24, // hours
    },
  };
}

export function getConsentTypes(): Array<{
  type: string;
  title: string;
  description: string;
  required: boolean;
  category: string;
}> {
  return [
    {
      type: 'data_processing',
      title: 'Data Processing',
      description: 'Allow processing of your personal data for service functionality',
      required: true,
      category: 'essential',
    },
    {
      type: 'analytics',
      title: 'Analytics',
      description: 'Help us improve the service by sharing usage analytics',
      required: false,
      category: 'optional',
    },
    {
      type: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive updates about new features and promotions',
      required: false,
      category: 'optional',
    },
    {
      type: 'third_party_sharing',
      title: 'Third-Party Sharing',
      description: 'Share your data with trusted third-party services',
      required: false,
      category: 'optional',
    },
  ];
}

export function getPrivacySettingCategories(): Array<{
  key: string;
  title: string;
  description: string;
}> {
  return [
    {
      key: 'data_collection',
      title: 'Data Collection',
      description: 'Control what data we collect about your usage',
    },
    {
      key: 'sharing',
      title: 'Data Sharing',
      description: 'Manage how your data is shared with others',
    },
    {
      key: 'analytics',
      title: 'Analytics & Tracking',
      description: 'Control analytics and tracking technologies',
    },
    {
      key: 'security',
      title: 'Security',
      description: 'Manage security and authentication settings',
    },
  ];
}

// Risk assessment helpers
export function calculateActionRiskScore(action: string, resourceType?: string): number {
  const riskScores: Record<string, number> = {
    'GET_api_files': 10,
    'POST_api_files': 20,
    'DELETE_api_files': 40,
    'PUT_api_files': 30,
    'GET_api_ai_generate': 15,
    'POST_api_ai_generate': 25,
    'GET_api_proxy': 10,
    'POST_api_proxy': 30,
    'DELETE_api_proxy': 50,
    'GET_api_plugins': 20,
    'POST_api_plugins': 40,
    'PUT_api_plugins': 35,
    'DELETE_api_plugins': 60,
    'GET_admin': 80,
    'POST_admin': 90,
    'PUT_admin': 85,
    'DELETE_admin': 95,
  };

  return riskScores[action] || 5;
}

export function assessLoginRisk(attempts: number, timeWindowMinutes: number, ipAddress?: string): {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  shouldBlock: boolean;
} {
  let riskScore = 0;

  // Too many attempts
  if (attempts > 5) {
    riskScore += (attempts - 5) * 15;
  }

  // Short time window
  if (timeWindowMinutes < 5) {
    riskScore += 25;
  } else if (timeWindowMinutes < 15) {
    riskScore += 10;
  }

  // Suspicious IP (in production, check against threat intelligence)
  if (ipAddress && (ipAddress.startsWith('10.') || ipAddress.startsWith('192.168.'))) {
    // Private IP - lower risk
    riskScore -= 5;
  }

  const riskLevel = 
    riskScore >= 80 ? 'critical' :
    riskScore >= 60 ? 'high' :
    riskScore >= 30 ? 'medium' : 'low';

  return {
    riskScore,
    riskLevel,
    shouldBlock: riskScore >= 90,
  };
}

// Data retention helpers
export function getDataRetentionPolicy(): Record<string, { days: number; autoDelete: boolean }> {
  return {
    'audit_logs': { days: 90, autoDelete: true },
    'user_sessions': { days: 30, autoDelete: true },
    'error_logs': { days: 60, autoDelete: true },
    'analytics_data': { days: 365, autoDelete: false },
    'consent_records': { days: -1, autoDelete: false }, // Never delete
    'user_data': { days: -1, autoDelete: false }, // Never delete
    'temp_files': { days: 7, autoDelete: true },
    'cache_data': { days: 1, autoDelete: true },
  };
}

export function shouldRetainData(dataType: string, createdAt: Date): boolean {
  const policy = getDataRetentionPolicy();
  const retentionPolicy = policy[dataType];
  
  if (!retentionPolicy) return true;
  
  if (retentionPolicy.days === -1) return true; // Never delete
  
  const retentionDate = new Date(createdAt);
  retentionDate.setDate(retentionDate.getDate() + retentionPolicy.days);
  
  return new Date() < retentionDate;
}

// Export helpers
export function exportUserData(userId: string): Promise<{
  personalData: Record<string, any>;
  consentRecords: ConsentRecord[];
  auditLogs: AuditLog[];
  privacySettings: PrivacySetting[];
}> {
  // This would gather all user data for GDPR export
  return Promise.resolve({
    personalData: {},
    consentRecords: [],
    auditLogs: [],
    privacySettings: [],
  });
}

export function deleteUserData(userId: string): Promise<void> {
  // This would handle GDPR right to be forgotten
  return Promise.resolve();
}