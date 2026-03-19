export type ModuleStatus = 'ready' | 'partial' | 'planned';

export interface MetaApiModule {
  slug: string;
  title: string;
  summary: string;
  usage: string;
  endpoints: string[];
  status: ModuleStatus;
  focus?: boolean;
}

export interface AdLibrarySearchRequest {
  adReachedCountries: string;
  searchTerms: string;
  adType: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  limit: number;
  accessToken?: string;
}

export interface AdLibrarySearchResult {
  id: string;
  page_id?: string;
  page_name?: string;
  ad_creation_time?: string;
  ad_snapshot_url?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  currency?: string;
  impressions?: {
    lower_bound?: string;
    upper_bound?: string;
  };
  spend?: {
    lower_bound?: string;
    upper_bound?: string;
  };
}

export type EntityStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface MarketingEntity {
  id: string;
  name?: string;
  status?: EntityStatus;
  campaign_id?: string;
  adset_id?: string;
  objective?: string;
  effective_status?: string;
  created_time?: string;
  updated_time?: string;
  ad_creation_time?: string;
}

export interface MarketingListRequest {
  adAccountId: string;
  fields?: string;
  limit?: number;
  accessToken?: string;
}

export interface CampaignCreateRequest {
  adAccountId: string;
  name: string;
  objective: string;
  status?: EntityStatus;
  accessToken?: string;
}

export interface CampaignUpdateRequest {
  campaignId: string;
  status?: EntityStatus;
  name?: string;
  accessToken?: string;
}

export interface AdSetCreateRequest {
  adAccountId: string;
  name: string;
  campaignId: string;
  dailyBudget?: string;
  status?: EntityStatus;
  accessToken?: string;
}

export interface AdSetUpdateRequest {
  adSetId: string;
  status?: EntityStatus;
  name?: string;
  accessToken?: string;
}

export interface AdCreateRequest {
  adAccountId: string;
  name: string;
  adsetId: string;
  creative: {
    creative_id: string;
  };
  status?: EntityStatus;
  accessToken?: string;
}

export interface AdUpdateRequest {
  adId: string;
  status?: EntityStatus;
  name?: string;
  accessToken?: string;
}

export interface ObservabilityErrorSample {
  timestamp: string;
  code: number | null;
  status: number | null;
  message: string;
}

export interface ObservabilityMetrics {
  startedAt: string;
  totalMetaRequests: number;
  totalMetaRetries: number;
  totalMetaErrors: number;
  retriesByStatus: Record<string, number>;
  errorsByCode: Record<string, number>;
  errorsByStatus: Record<string, number>;
  lastErrors: ObservabilityErrorSample[];
}

export interface ObservabilitySnapshot {
  health: {
    status: string;
    uptimeSec: number;
  };
  metrics: ObservabilityMetrics;
}
