"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCatalog = getCatalog;
exports.searchAdLibrary = searchAdLibrary;
exports.searchAdLibraryByText = searchAdLibraryByText;
exports.listCampaigns = listCampaigns;
exports.createCampaign = createCampaign;
exports.updateCampaign = updateCampaign;
exports.listAdSets = listAdSets;
exports.createAdSet = createAdSet;
exports.updateAdSet = updateAdSet;
exports.listAds = listAds;
exports.createAd = createAd;
exports.updateAd = updateAd;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const api_error_1 = require("../errors/api-error");
const metrics_1 = require("../observability/metrics");
const catalog = [
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
function getCatalog() {
    return catalog;
}
function resolveAccessToken(inputToken) {
    const token = inputToken || env_1.env.metaAccessToken;
    if (!token) {
        throw new api_error_1.ApiError(400, 'No access token available for Meta Graph API requests.');
    }
    return token;
}
function graphBaseUrl(path) {
    return `https://graph.facebook.com/${env_1.env.metaApiVersion}/${path}`;
}
function shouldRetryMetaRequest(error) {
    if (!axios_1.default.isAxiosError(error)) {
        return false;
    }
    const status = error.response?.status;
    if (!status) {
        return true;
    }
    return status === 429 || status >= 500;
}
function delayForAttempt(attempt) {
    const jitter = Math.floor(Math.random() * 75);
    return env_1.env.metaRetryBaseDelayMs * 2 ** attempt + jitter;
}
async function wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
async function withMetaRetry(requestFn) {
    let lastError;
    (0, metrics_1.recordMetaRequest)();
    for (let attempt = 0; attempt <= env_1.env.metaRetryAttempts; attempt += 1) {
        try {
            return await requestFn();
        }
        catch (error) {
            lastError = error;
            if (attempt === env_1.env.metaRetryAttempts || !shouldRetryMetaRequest(error)) {
                throw error;
            }
            const status = axios_1.default.isAxiosError(error) ? (error.response?.status ?? null) : null;
            (0, metrics_1.recordMetaRetry)(status);
            await wait(delayForAttempt(attempt));
        }
    }
    throw lastError;
}
async function graphGet(path, params) {
    const response = await withMetaRetry(() => axios_1.default.get(graphBaseUrl(path), { params }));
    return response.data;
}
async function graphPost(path, body) {
    const response = await withMetaRetry(() => axios_1.default.post(graphBaseUrl(path), null, { params: body }));
    return response.data;
}
async function searchAdLibrary(payload) {
    const token = resolveAccessToken(payload.accessToken);
    const data = await graphGet('ads_archive', {
        ad_reached_countries: payload.adReachedCountries,
        search_terms: payload.searchTerms,
        ad_type: payload.adType,
        limit: payload.limit,
        fields: 'id,page_id,page_name,ad_creation_time,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time,currency,impressions,spend',
        access_token: token
    });
    return Array.isArray(data.data) ? data.data : [];
}
function normalizeText(value) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}
async function searchAdLibraryByText(payload) {
    const keyword = payload.keyword.trim();
    if (!keyword) {
        throw new api_error_1.ApiError(400, 'keyword is required.');
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
        const row = item;
        const searchable = normalizeText([
            String(row.id ?? ''),
            String(row.page_name ?? ''),
            String(row.ad_snapshot_url ?? ''),
            JSON.stringify(row)
        ].join(' '));
        return searchable.includes(normalizedKeyword);
    });
}
async function listCampaigns(payload) {
    const token = resolveAccessToken(payload.accessToken);
    const data = await graphGet(`act_${payload.adAccountId}/campaigns`, {
        fields: payload.fields ?? 'id,name,status,objective,effective_status',
        limit: payload.limit ?? 25,
        access_token: token
    });
    return Array.isArray(data.data) ? data.data : [];
}
async function createCampaign(payload) {
    const token = resolveAccessToken(payload.accessToken);
    return graphPost(`act_${payload.adAccountId}/campaigns`, {
        name: payload.name,
        objective: payload.objective,
        status: payload.status ?? 'PAUSED',
        special_ad_categories: JSON.stringify(payload.specialAdCategories ?? []),
        access_token: token
    });
}
async function updateCampaign(payload) {
    const token = resolveAccessToken(payload.accessToken);
    return graphPost(payload.campaignId, {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        access_token: token
    });
}
async function listAdSets(payload) {
    const token = resolveAccessToken(payload.accessToken);
    const data = await graphGet(`act_${payload.adAccountId}/adsets`, {
        fields: payload.fields ?? 'id,name,status,campaign_id,daily_budget,optimization_goal',
        limit: payload.limit ?? 25,
        access_token: token
    });
    return Array.isArray(data.data) ? data.data : [];
}
async function createAdSet(payload) {
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
async function updateAdSet(payload) {
    const token = resolveAccessToken(payload.accessToken);
    return graphPost(payload.adSetId, {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        access_token: token
    });
}
async function listAds(payload) {
    const token = resolveAccessToken(payload.accessToken);
    const data = await graphGet(`act_${payload.adAccountId}/ads`, {
        fields: payload.fields ?? 'id,name,status,adset_id,campaign_id,effective_status',
        limit: payload.limit ?? 25,
        access_token: token
    });
    return Array.isArray(data.data) ? data.data : [];
}
async function createAd(payload) {
    const token = resolveAccessToken(payload.accessToken);
    return graphPost(`act_${payload.adAccountId}/ads`, {
        name: payload.name,
        adset_id: payload.adsetId,
        creative: JSON.stringify(payload.creative),
        status: payload.status ?? 'PAUSED',
        access_token: token
    });
}
async function updateAd(payload) {
    const token = resolveAccessToken(payload.accessToken);
    return graphPost(payload.adId, {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        access_token: token
    });
}
