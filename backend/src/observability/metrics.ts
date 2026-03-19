import { promises as fs } from 'fs';
import path from 'path';
import { env } from '../config/env';

interface CounterMap {
  [key: string]: number;
}

interface ErrorSample {
  timestamp: string;
  code: number | null;
  status: number | null;
  message: string;
}

interface InternalMetrics {
  startedAt: string;
  totalMetaRequests: number;
  totalMetaRetries: number;
  totalMetaErrors: number;
  retriesByStatus: CounterMap;
  errorsByCode: CounterMap;
  errorsByStatus: CounterMap;
  lastErrors: ErrorSample[];
}

const MAX_ERROR_SAMPLES = 20;
const SAVE_DELAY_MS = 400;

const metrics: InternalMetrics = {
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
let saveTimer: NodeJS.Timeout | null = null;

function increaseCounter(map: CounterMap, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function applySnapshot(snapshot: Partial<InternalMetrics>): void {
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

function resetInMemoryMetrics(): void {
  metrics.startedAt = new Date().toISOString();
  metrics.totalMetaRequests = 0;
  metrics.totalMetaRetries = 0;
  metrics.totalMetaErrors = 0;
  metrics.retriesByStatus = {};
  metrics.errorsByCode = {};
  metrics.errorsByStatus = {};
  metrics.lastErrors = [];
}

async function loadIfNeeded(): Promise<void> {
  if (initialized) {
    return;
  }

  initialized = true;

  try {
    const content = await fs.readFile(env.observabilityStorePath, 'utf8');
    const parsed = JSON.parse(content) as Partial<InternalMetrics>;
    applySnapshot(parsed);
  } catch {
    // File may not exist on first run; keep defaults.
  }
}

async function saveSnapshot(): Promise<void> {
  const targetPath = env.observabilityStorePath;
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(targetPath, JSON.stringify(metrics, null, 2), 'utf8');
}

function scheduleSave(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    saveSnapshot().catch(() => {
      // Swallow persistence errors to avoid affecting request lifecycle.
    });
  }, SAVE_DELAY_MS);
}

export async function initializeObservabilityStore(): Promise<void> {
  await loadIfNeeded();
}

export function recordMetaRequest(): void {
  metrics.totalMetaRequests += 1;
  scheduleSave();
}

export function recordMetaRetry(status: number | null): void {
  metrics.totalMetaRetries += 1;
  increaseCounter(metrics.retriesByStatus, String(status ?? 'network_or_unknown'));
  scheduleSave();
}

export function recordMetaError(code: number | null, status: number | null, message: string): void {
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

export function getObservabilitySnapshot(): InternalMetrics {
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

export async function resetObservabilitySnapshot(): Promise<InternalMetrics> {
  resetInMemoryMetrics();
  await saveSnapshot();
  return getObservabilitySnapshot();
}
