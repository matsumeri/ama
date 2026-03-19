import axios from 'axios';
import { env } from '../config/env';
import {
  AdCreatePayload,
  AdLibrarySearchPayload,
  AdLibraryTextSearchPayload,
  AdSetCreatePayload,
  AdSetUpdatePayload,
  AdUpdatePayload,
  CampaignCreatePayload,
  CampaignUpdatePayload,
  MarketingListPayload,
  MetaApiModule
} from '../types/meta';
import { ApiError } from '../errors/api-error';
import { recordMetaRequest, recordMetaRetry } from '../observability/metrics';

const catalog: MetaApiModule[] = [
  {
    slug: 'marketing-management',
    title: 'Marketing Management API',
    summary: 'Gestion de campanas, ad sets y anuncios.',
    usage: 'Operaciones principales de media buying.',
    endpoints: ['Campaigns', 'Ad Sets', 'Ads', 'Ad Creatives'],
    status: 'partial'
  },
  {
    slug: 'insights-reporting',
    title: 'Insights & Reporting API',
    summary: 'Consulta metrica y reportes por nivel.',
    usage: 'Analitica y monitoreo de performance.',
    endpoints: ['Insights', 'Breakdowns', 'Attribution Windows'],
    status: 'partial'
  },
  {
    slug: 'audiences',
    title: 'Audiences API',
    summary: 'Gestion de audiencias personalizadas y lookalikes.',
    usage: 'Segmentacion avanzada y sincronizacion.',
    endpoints: ['Custom Audiences', 'Lookalike Audiences', 'Saved Audiences'],
    status: 'planned'
  },
  {
    slug: 'leads',
    title: 'Lead Ads API',
    summary: 'Extraccion de leads y eventos de formularios.',
    usage: 'Integracion con CRM.',
    endpoints: ['Leadgen Forms', 'Leads Retrieval', 'Webhook Events'],
    status: 'planned'
  },
  {
    slug: 'commerce-catalog',
    title: 'Commerce & Catalog API',
    summary: 'Catalogos y productos para anuncios dinamicos.',
    usage: 'Ecommerce y retail ads.',
    endpoints: ['Catalogs', 'Products', 'Product Sets'],
    status: 'planned'
  },
  {
    slug: 'pixel-conversions',
    title: 'Pixel & Conversions API',
    summary: 'Eventos de conversion web y server-side.',
    usage: 'Medicion y optimizacion.',
    endpoints: ['Pixels', 'Conversions API', 'Offline Conversions'],
    status: 'partial'
  },
  {
    slug: 'business-assets',
    title: 'Business Assets API',
    summary: 'Gestion de paginas, cuentas y permisos.',
    usage: 'Administracion de activos de negocio.',
    endpoints: ['Business Manager', 'Pages', 'Instagram Accounts'],
    status: 'planned'
  },
  {
    slug: 'ad-library',
    title: 'Meta Ad Library API',
    summary: 'Consulta publica de anuncios para research.',
    usage: 'Analisis competitivo y compliance.',
    endpoints: ['ads_archive search', 'ad snapshot data'],
    status: 'ready',
    focus: true
  }
];

export function getCatalog(): MetaApiModule[] {
  return catalog;
}

function resolveAccessToken(inputToken?: string): string {
  const token = inputToken || env.metaAccessToken;

  if (!token) {
    throw new ApiError(400, 'No access token available for Meta Graph API requests.');
  }

  return token;
}

function graphBaseUrl(path: string): string {
  return `https://graph.facebook.com/${env.metaApiVersion}/${path}`;
}

function shouldRetryMetaRequest(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  if (!status) {
    return true;
  }

  return status === 429 || status >= 500;
}

function delayForAttempt(attempt: number): number {
  const jitter = Math.floor(Math.random() * 75);
  return env.metaRetryBaseDelayMs * 2 ** attempt + jitter;
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withMetaRetry<T>(requestFn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  recordMetaRequest();

  for (let attempt = 0; attempt <= env.metaRetryAttempts; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      if (attempt === env.metaRetryAttempts || !shouldRetryMetaRequest(error)) {
        throw error;
      }

      const status = axios.isAxiosError(error) ? (error.response?.status ?? null) : null;
      recordMetaRetry(status);

      await wait(delayForAttempt(attempt));
    }
  }

  throw lastError;
}

async function graphGet(path: string, params: Record<string, unknown>): Promise<unknown> {
  const response = await withMetaRetry(() => axios.get(graphBaseUrl(path), { params }));
  return response.data;
}

async function graphPost(path: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await withMetaRetry(() => axios.post(graphBaseUrl(path), null, { params: body }));
  return response.data;
}

export async function searchAdLibrary(payload: AdLibrarySearchPayload): Promise<unknown[]> {
  const token = resolveAccessToken(payload.accessToken);
  const data = await graphGet('ads_archive', {
    ad_reached_countries: payload.adReachedCountries,
    search_terms: payload.searchTerms,
    ad_type: payload.adType,
    limit: payload.limit,
    fields:
      'id,page_id,page_name,ad_creation_time,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time,currency,impressions,spend',
    access_token: token
  });

  return Array.isArray((data as { data?: unknown[] }).data) ? (data as { data: unknown[] }).data : [];
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function searchAdLibraryByText(payload: AdLibraryTextSearchPayload): Promise<unknown[]> {
  const keyword = payload.keyword.trim();

  if (!keyword) {
    throw new ApiError(400, 'keyword is required.');
  }

  const rows = await searchAdLibrary({
    adReachedCountries: payload.adReachedCountries ?? 'US',
    searchTerms: keyword,
    adType: payload.adType ?? 'ALL',
    limit: Math.min(Math.max(Number(payload.limit ?? 25), 1), 100),
    accessToken: payload.accessToken
  });

  const normalizedKeyword = normalizeText(keyword);
  return rows.filter((item) => {
    const row = item as Record<string, unknown>;
    const searchable = normalizeText(
      [
        String(row.id ?? ''),
        String(row.page_name ?? ''),
        String(row.ad_snapshot_url ?? ''),
        JSON.stringify(row)
      ].join(' ')
    );

    return searchable.includes(normalizedKeyword);
  });
}

export async function listCampaigns(payload: MarketingListPayload): Promise<unknown[]> {
  const token = resolveAccessToken(payload.accessToken);
  const data = await graphGet(`act_${payload.adAccountId}/campaigns`, {
    fields: payload.fields ?? 'id,name,status,objective,effective_status',
    limit: payload.limit ?? 25,
    access_token: token
  });

  return Array.isArray((data as { data?: unknown[] }).data) ? (data as { data: unknown[] }).data : [];
}

export async function createCampaign(payload: CampaignCreatePayload): Promise<unknown> {
  const token = resolveAccessToken(payload.accessToken);
  return graphPost(`act_${payload.adAccountId}/campaigns`, {
    name: payload.name,
    objective: payload.objective,
    status: payload.status ?? 'PAUSED',
    special_ad_categories: JSON.stringify(payload.specialAdCategories ?? []),
    access_token: token
  });
}

export async function updateCampaign(payload: CampaignUpdatePayload): Promise<unknown> {
  const token = resolveAccessToken(payload.accessToken);
  return graphPost(payload.campaignId, {
    ...(payload.name ? { name: payload.name } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    access_token: token
  });
}

export async function listAdSets(payload: MarketingListPayload): Promise<unknown[]> {
  const token = resolveAccessToken(payload.accessToken);
  const data = await graphGet(`act_${payload.adAccountId}/adsets`, {
    fields: payload.fields ?? 'id,name,status,campaign_id,daily_budget,optimization_goal',
    limit: payload.limit ?? 25,
    access_token: token
  });

  return Array.isArray((data as { data?: unknown[] }).data) ? (data as { data: unknown[] }).data : [];
}

export async function createAdSet(payload: AdSetCreatePayload): Promise<unknown> {
  const token = resolveAccessToken(payload.accessToken);
  return graphPost(`act_${payload.adAccountId}/adsets`, {
    name: payload.name,
    campaign_id: payload.campaignId,
    ...(payload.dailyBudget ? { daily_budget: payload.dailyBudget } : {}),
    ...(payload.lifetimeBudget ? { lifetime_budget: payload.lifetimeBudget } : {}),
    ...(payload.billingEvent ? { billing_event: payload.billingEvent } : {}),
    ...(payload.optimizationGoal ? { optimization_goal: payload.optimizationGoal } : {}),
    status: payload.status ?? 'PAUSED',
    access_token: token
  });
}

export async function updateAdSet(payload: AdSetUpdatePayload): Promise<unknown> {
  const token = resolveAccessToken(payload.accessToken);
  return graphPost(payload.adSetId, {
    ...(payload.name ? { name: payload.name } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    access_token: token
  });
}

export async function listAds(payload: MarketingListPayload): Promise<unknown[]> {
  const token = resolveAccessToken(payload.accessToken);
  const data = await graphGet(`act_${payload.adAccountId}/ads`, {
    fields: payload.fields ?? 'id,name,status,adset_id,campaign_id,effective_status',
    limit: payload.limit ?? 25,
    access_token: token
  });

  return Array.isArray((data as { data?: unknown[] }).data) ? (data as { data: unknown[] }).data : [];
}

export async function createAd(payload: AdCreatePayload): Promise<unknown> {
  const token = resolveAccessToken(payload.accessToken);
  return graphPost(`act_${payload.adAccountId}/ads`, {
    name: payload.name,
    adset_id: payload.adsetId,
    creative: JSON.stringify(payload.creative),
    status: payload.status ?? 'PAUSED',
    access_token: token
  });
}

export async function updateAd(payload: AdUpdatePayload): Promise<unknown> {
  const token = resolveAccessToken(payload.accessToken);
  return graphPost(payload.adId, {
    ...(payload.name ? { name: payload.name } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    access_token: token
  });
}
