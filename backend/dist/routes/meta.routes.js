"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaRouter = void 0;
const express_1 = require("express");
const meta_api_service_1 = require("../services/meta-api.service");
const async_handler_1 = require("../middleware/async-handler");
const api_error_1 = require("../errors/api-error");
const metrics_1 = require("../observability/metrics");
exports.metaRouter = (0, express_1.Router)();
exports.metaRouter.get('/catalog', (_req, res) => {
    res.json({ modules: (0, meta_api_service_1.getCatalog)() });
});
exports.metaRouter.post('/ad-library/search', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = req.body;
    if (!body.searchTerms || !body.adReachedCountries) {
        throw new api_error_1.ApiError(400, 'searchTerms and adReachedCountries are required.');
    }
    const data = await (0, meta_api_service_1.searchAdLibrary)({
        adReachedCountries: body.adReachedCountries,
        searchTerms: body.searchTerms,
        adType: body.adType ?? 'ALL',
        limit: Math.min(Math.max(Number(body.limit ?? 20), 1), 100),
        accessToken: body.accessToken
    });
    res.json({ data });
}));
exports.metaRouter.get('/ad-library/search-text', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const keyword = String(query.q ?? query.keyword ?? '').trim();
    if (!keyword) {
        throw new api_error_1.ApiError(400, 'q (keyword) is required.');
    }
    const data = await (0, meta_api_service_1.searchAdLibraryByText)({
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
exports.metaRouter.get('/marketing/campaigns', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    if (!query.adAccountId) {
        throw new api_error_1.ApiError(400, 'adAccountId is required.');
    }
    const data = await (0, meta_api_service_1.listCampaigns)({
        adAccountId: query.adAccountId,
        fields: query.fields,
        limit: Number(query.limit ?? 25),
        accessToken: query.accessToken
    });
    res.json({ data });
}));
exports.metaRouter.post('/marketing/campaigns', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = req.body;
    if (!body.adAccountId || !body.name || !body.objective) {
        throw new api_error_1.ApiError(400, 'adAccountId, name and objective are required.');
    }
    const data = await (0, meta_api_service_1.createCampaign)({
        adAccountId: body.adAccountId,
        name: body.name,
        objective: body.objective,
        status: body.status,
        specialAdCategories: body.specialAdCategories,
        accessToken: body.accessToken
    });
    res.status(201).json({ data });
}));
exports.metaRouter.patch('/marketing/campaigns/:campaignId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = req.body;
    const campaignId = String(req.params.campaignId ?? '');
    if (!campaignId) {
        throw new api_error_1.ApiError(400, 'campaignId is required.');
    }
    const data = await (0, meta_api_service_1.updateCampaign)({
        campaignId,
        name: body.name,
        status: body.status,
        accessToken: body.accessToken
    });
    res.json({ data });
}));
exports.metaRouter.get('/marketing/adsets', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    if (!query.adAccountId) {
        throw new api_error_1.ApiError(400, 'adAccountId is required.');
    }
    const data = await (0, meta_api_service_1.listAdSets)({
        adAccountId: query.adAccountId,
        fields: query.fields,
        limit: Number(query.limit ?? 25),
        accessToken: query.accessToken
    });
    res.json({ data });
}));
exports.metaRouter.post('/marketing/adsets', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = req.body;
    if (!body.adAccountId || !body.name || !body.campaignId) {
        throw new api_error_1.ApiError(400, 'adAccountId, name and campaignId are required.');
    }
    const data = await (0, meta_api_service_1.createAdSet)({
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
exports.metaRouter.patch('/marketing/adsets/:adSetId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = req.body;
    const adSetId = String(req.params.adSetId ?? '');
    if (!adSetId) {
        throw new api_error_1.ApiError(400, 'adSetId is required.');
    }
    const data = await (0, meta_api_service_1.updateAdSet)({
        adSetId,
        name: body.name,
        status: body.status,
        accessToken: body.accessToken
    });
    res.json({ data });
}));
exports.metaRouter.get('/marketing/ads', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    if (!query.adAccountId) {
        throw new api_error_1.ApiError(400, 'adAccountId is required.');
    }
    const data = await (0, meta_api_service_1.listAds)({
        adAccountId: query.adAccountId,
        fields: query.fields,
        limit: Number(query.limit ?? 25),
        accessToken: query.accessToken
    });
    res.json({ data });
}));
exports.metaRouter.post('/marketing/ads', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = req.body;
    if (!body.adAccountId || !body.name || !body.adsetId || !body.creative?.creative_id) {
        throw new api_error_1.ApiError(400, 'adAccountId, name, adsetId and creative.creative_id are required.');
    }
    const data = await (0, meta_api_service_1.createAd)({
        adAccountId: body.adAccountId,
        name: body.name,
        adsetId: body.adsetId,
        creative: body.creative,
        status: body.status,
        accessToken: body.accessToken
    });
    res.status(201).json({ data });
}));
exports.metaRouter.patch('/marketing/ads/:adId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = req.body;
    const adId = String(req.params.adId ?? '');
    if (!adId) {
        throw new api_error_1.ApiError(400, 'adId is required.');
    }
    const data = await (0, meta_api_service_1.updateAd)({
        adId,
        name: body.name,
        status: body.status,
        accessToken: body.accessToken
    });
    res.json({ data });
}));
exports.metaRouter.get('/module/:slug', (req, res) => {
    const moduleInfo = (0, meta_api_service_1.getCatalog)().find((item) => item.slug === req.params.slug);
    if (!moduleInfo) {
        return res.status(404).json({ error: 'Modulo no encontrado.' });
    }
    return res.json({
        module: moduleInfo,
        note: 'Endpoint base listo para extender con operaciones reales de Meta.'
    });
});
exports.metaRouter.get('/observability', (_req, res) => {
    res.json({
        health: {
            status: 'ok',
            uptimeSec: Math.round(process.uptime())
        },
        metrics: (0, metrics_1.getObservabilitySnapshot)()
    });
});
exports.metaRouter.post('/observability/reset', (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const snapshot = await (0, metrics_1.resetObservabilitySnapshot)();
    res.json({
        message: 'Observability metrics reset successfully.',
        metrics: snapshot
    });
}));
