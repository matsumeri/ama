"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeObservabilityStore = initializeObservabilityStore;
exports.recordMetaRequest = recordMetaRequest;
exports.recordMetaRetry = recordMetaRetry;
exports.recordMetaError = recordMetaError;
exports.getObservabilitySnapshot = getObservabilitySnapshot;
exports.resetObservabilitySnapshot = resetObservabilitySnapshot;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const MAX_ERROR_SAMPLES = 20;
const SAVE_DELAY_MS = 400;
const metrics = {
    startedAt: new Date().toISOString(),
    totalMetaRequests: 0,
    totalMetaRetries: 0,
    totalMetaErrors: 0,
    retriesByStatus: {},
    errorsByCode: {},
    errorsByStatus: {},
    lastErrors: []
};
let initialized = false;
let saveTimer = null;
function increaseCounter(map, key) {
    map[key] = (map[key] ?? 0) + 1;
}
function applySnapshot(snapshot) {
    metrics.startedAt = snapshot.startedAt ?? metrics.startedAt;
    metrics.totalMetaRequests = Number(snapshot.totalMetaRequests ?? metrics.totalMetaRequests);
    metrics.totalMetaRetries = Number(snapshot.totalMetaRetries ?? metrics.totalMetaRetries);
    metrics.totalMetaErrors = Number(snapshot.totalMetaErrors ?? metrics.totalMetaErrors);
    metrics.retriesByStatus = { ...(snapshot.retriesByStatus ?? metrics.retriesByStatus) };
    metrics.errorsByCode = { ...(snapshot.errorsByCode ?? metrics.errorsByCode) };
    metrics.errorsByStatus = { ...(snapshot.errorsByStatus ?? metrics.errorsByStatus) };
    metrics.lastErrors = Array.isArray(snapshot.lastErrors)
        ? snapshot.lastErrors.slice(0, MAX_ERROR_SAMPLES)
        : metrics.lastErrors;
}
function resetInMemoryMetrics() {
    metrics.startedAt = new Date().toISOString();
    metrics.totalMetaRequests = 0;
    metrics.totalMetaRetries = 0;
    metrics.totalMetaErrors = 0;
    metrics.retriesByStatus = {};
    metrics.errorsByCode = {};
    metrics.errorsByStatus = {};
    metrics.lastErrors = [];
}
async function loadIfNeeded() {
    if (initialized) {
        return;
    }
    initialized = true;
    try {
        const content = await fs_1.promises.readFile(env_1.env.observabilityStorePath, 'utf8');
        const parsed = JSON.parse(content);
        applySnapshot(parsed);
    }
    catch {
        // File may not exist on first run; keep defaults.
    }
}
async function saveSnapshot() {
    const targetPath = env_1.env.observabilityStorePath;
    const dir = path_1.default.dirname(targetPath);
    await fs_1.promises.mkdir(dir, { recursive: true });
    await fs_1.promises.writeFile(targetPath, JSON.stringify(metrics, null, 2), 'utf8');
}
function scheduleSave() {
    if (saveTimer) {
        clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => {
        saveSnapshot().catch(() => {
            // Swallow persistence errors to avoid affecting request lifecycle.
        });
    }, SAVE_DELAY_MS);
}
async function initializeObservabilityStore() {
    await loadIfNeeded();
}
function recordMetaRequest() {
    metrics.totalMetaRequests += 1;
    scheduleSave();
}
function recordMetaRetry(status) {
    metrics.totalMetaRetries += 1;
    increaseCounter(metrics.retriesByStatus, String(status ?? 'network_or_unknown'));
    scheduleSave();
}
function recordMetaError(code, status, message) {
    metrics.totalMetaErrors += 1;
    increaseCounter(metrics.errorsByCode, String(code ?? 'unknown'));
    increaseCounter(metrics.errorsByStatus, String(status ?? 'unknown'));
    metrics.lastErrors.unshift({
        timestamp: new Date().toISOString(),
        code,
        status,
        message
    });
    if (metrics.lastErrors.length > MAX_ERROR_SAMPLES) {
        metrics.lastErrors.length = MAX_ERROR_SAMPLES;
    }
    scheduleSave();
}
function getObservabilitySnapshot() {
    return {
        startedAt: metrics.startedAt,
        totalMetaRequests: metrics.totalMetaRequests,
        totalMetaRetries: metrics.totalMetaRetries,
        totalMetaErrors: metrics.totalMetaErrors,
        retriesByStatus: { ...metrics.retriesByStatus },
        errorsByCode: { ...metrics.errorsByCode },
        errorsByStatus: { ...metrics.errorsByStatus },
        lastErrors: [...metrics.lastErrors]
    };
}
async function resetObservabilitySnapshot() {
    resetInMemoryMetrics();
    await saveSnapshot();
    return getObservabilitySnapshot();
}
