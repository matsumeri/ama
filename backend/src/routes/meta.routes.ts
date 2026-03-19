import { Router } from 'express';
import {
  createAd,
  createAdSet,
  createCampaign,
  getCatalog,
  listAds,
  listAdSets,
  listCampaigns,
  searchAdLibrary,
  searchAdLibraryByText,
  updateAd,
  updateAdSet,
  updateCampaign
} from '../services/meta-api.service';
import {
  AdCreatePayload,
  AdLibrarySearchPayload,
  AdLibraryTextSearchPayload,
  AdSetCreatePayload,
  AdSetUpdatePayload,
  AdUpdatePayload,
  CampaignCreatePayload,
  CampaignUpdatePayload,
  MarketingListPayload
} from '../types/meta';
import { asyncHandler } from '../middleware/async-handler';
import { ApiError } from '../errors/api-error';
import { getObservabilitySnapshot, resetObservabilitySnapshot } from '../observability/metrics';

export const metaRouter = Router();

metaRouter.get('/catalog', (_req, res) => {
  res.json({ modules: getCatalog() });
});

metaRouter.post('/ad-library/search', asyncHandler(async (req, res) => {
  const body = req.body as Partial<AdLibrarySearchPayload>;

  if (!body.searchTerms || !body.adReachedCountries) {
    throw new ApiError(400, 'searchTerms and adReachedCountries are required.');
  }

  const data = await searchAdLibrary({
    adReachedCountries: body.adReachedCountries,
    searchTerms: body.searchTerms,
    adType: body.adType ?? 'ALL',
    limit: Math.min(Math.max(Number(body.limit ?? 20), 1), 100),
    accessToken: body.accessToken
  });

  res.json({ data });
}));

metaRouter.get('/ad-library/search-text', asyncHandler(async (req, res) => {
  const query = req.query as Partial<AdLibraryTextSearchPayload> & { q?: string };
  const keyword = String(query.q ?? query.keyword ?? '').trim();

  if (!keyword) {
    throw new ApiError(400, 'q (keyword) is required.');
  }

  const data = await searchAdLibraryByText({
    keyword,
    adReachedCountries: query.adReachedCountries,
    adType: query.adType,
    limit: Number(query.limit ?? 25),
    accessToken: query.accessToken
  });

  res.json({
    keyword,
    totalMatches: data.length,
    data
  });
}));

metaRouter.get('/marketing/campaigns', asyncHandler(async (req, res) => {
  const query = req.query as Partial<MarketingListPayload>;

  if (!query.adAccountId) {
    throw new ApiError(400, 'adAccountId is required.');
  }

  const data = await listCampaigns({
    adAccountId: query.adAccountId,
    fields: query.fields,
    limit: Number(query.limit ?? 25),
    accessToken: query.accessToken
  });

  res.json({ data });
}));

metaRouter.post('/marketing/campaigns', asyncHandler(async (req, res) => {
  const body = req.body as Partial<CampaignCreatePayload>;

  if (!body.adAccountId || !body.name || !body.objective) {
    throw new ApiError(400, 'adAccountId, name and objective are required.');
  }

  const data = await createCampaign({
    adAccountId: body.adAccountId,
    name: body.name,
    objective: body.objective,
    status: body.status,
    specialAdCategories: body.specialAdCategories,
    accessToken: body.accessToken
  });

  res.status(201).json({ data });
}));

metaRouter.patch('/marketing/campaigns/:campaignId', asyncHandler(async (req, res) => {
  const body = req.body as Partial<CampaignUpdatePayload>;
  const campaignId = String(req.params.campaignId ?? '');

  if (!campaignId) {
    throw new ApiError(400, 'campaignId is required.');
  }

  const data = await updateCampaign({
    campaignId,
    name: body.name,
    status: body.status,
    accessToken: body.accessToken
  });

  res.json({ data });
}));

metaRouter.get('/marketing/adsets', asyncHandler(async (req, res) => {
  const query = req.query as Partial<MarketingListPayload>;

  if (!query.adAccountId) {
    throw new ApiError(400, 'adAccountId is required.');
  }

  const data = await listAdSets({
    adAccountId: query.adAccountId,
    fields: query.fields,
    limit: Number(query.limit ?? 25),
    accessToken: query.accessToken
  });

  res.json({ data });
}));

metaRouter.post('/marketing/adsets', asyncHandler(async (req, res) => {
  const body = req.body as Partial<AdSetCreatePayload>;

  if (!body.adAccountId || !body.name || !body.campaignId) {
    throw new ApiError(400, 'adAccountId, name and campaignId are required.');
  }

  const data = await createAdSet({
    adAccountId: body.adAccountId,
    name: body.name,
    campaignId: body.campaignId,
    dailyBudget: body.dailyBudget,
    lifetimeBudget: body.lifetimeBudget,
    billingEvent: body.billingEvent,
    optimizationGoal: body.optimizationGoal,
    status: body.status,
    accessToken: body.accessToken
  });

  res.status(201).json({ data });
}));

metaRouter.patch('/marketing/adsets/:adSetId', asyncHandler(async (req, res) => {
  const body = req.body as Partial<AdSetUpdatePayload>;
  const adSetId = String(req.params.adSetId ?? '');

  if (!adSetId) {
    throw new ApiError(400, 'adSetId is required.');
  }

  const data = await updateAdSet({
    adSetId,
    name: body.name,
    status: body.status,
    accessToken: body.accessToken
  });

  res.json({ data });
}));

metaRouter.get('/marketing/ads', asyncHandler(async (req, res) => {
  const query = req.query as Partial<MarketingListPayload>;

  if (!query.adAccountId) {
    throw new ApiError(400, 'adAccountId is required.');
  }

  const data = await listAds({
    adAccountId: query.adAccountId,
    fields: query.fields,
    limit: Number(query.limit ?? 25),
    accessToken: query.accessToken
  });

  res.json({ data });
}));

metaRouter.post('/marketing/ads', asyncHandler(async (req, res) => {
  const body = req.body as Partial<AdCreatePayload>;

  if (!body.adAccountId || !body.name || !body.adsetId || !body.creative?.creative_id) {
    throw new ApiError(400, 'adAccountId, name, adsetId and creative.creative_id are required.');
  }

  const data = await createAd({
    adAccountId: body.adAccountId,
    name: body.name,
    adsetId: body.adsetId,
    creative: body.creative,
    status: body.status,
    accessToken: body.accessToken
  });

  res.status(201).json({ data });
}));

metaRouter.patch('/marketing/ads/:adId', asyncHandler(async (req, res) => {
  const body = req.body as Partial<AdUpdatePayload>;
  const adId = String(req.params.adId ?? '');

  if (!adId) {
    throw new ApiError(400, 'adId is required.');
  }

  const data = await updateAd({
    adId,
    name: body.name,
    status: body.status,
    accessToken: body.accessToken
  });

  res.json({ data });
}));

metaRouter.get('/module/:slug', (req, res) => {
  const moduleInfo = getCatalog().find((item) => item.slug === req.params.slug);

  if (!moduleInfo) {
    return res.status(404).json({ error: 'Modulo no encontrado.' });
  }

  return res.json({
    module: moduleInfo,
    note: 'Endpoint base listo para extender con operaciones reales de Meta.'
  });
});

metaRouter.get('/observability', (_req, res) => {
  res.json({
    health: {
      status: 'ok',
      uptimeSec: Math.round(process.uptime())
    },
    metrics: getObservabilitySnapshot()
  });
});

metaRouter.post('/observability/reset', asyncHandler(async (_req, res) => {
  const snapshot = await resetObservabilitySnapshot();

  res.json({
    message: 'Observability metrics reset successfully.',
    metrics: snapshot
  });
}));
