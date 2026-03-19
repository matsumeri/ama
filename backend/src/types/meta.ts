export interface MetaApiModule {
  slug: string;
  title: string;
  summary: string;
  usage: string;
  endpoints: string[];
  status: 'ready' | 'partial' | 'planned';
  focus?: boolean;
}

export interface AdLibrarySearchPayload {
  adReachedCountries: string;
  searchTerms: string;
  adType: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  limit: number;
  accessToken?: string;
}

export interface AdLibraryTextSearchPayload {
  keyword: string;
  adReachedCountries?: string;
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  limit?: number;
  accessToken?: string;
}

export interface MarketingListPayload {
  adAccountId: string;
  fields?: string;
  limit?: number;
  accessToken?: string;
}

export interface CampaignCreatePayload {
  adAccountId: string;
  name: string;
  objective: string;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  specialAdCategories?: string[];
  accessToken?: string;
}

export interface CampaignUpdatePayload {
  campaignId: string;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  name?: string;
  accessToken?: string;
}

export interface AdSetCreatePayload {
  adAccountId: string;
  name: string;
  campaignId: string;
  dailyBudget?: string;
  lifetimeBudget?: string;
  billingEvent?: string;
  optimizationGoal?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  accessToken?: string;
}

export interface AdSetUpdatePayload {
  adSetId: string;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  name?: string;
  accessToken?: string;
}

export interface AdCreatePayload {
  adAccountId: string;
  name: string;
  adsetId: string;
  creative: {
    creative_id: string;
  };
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  accessToken?: string;
}

export interface AdUpdatePayload {
  adId: string;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  name?: string;
  accessToken?: string;
}
