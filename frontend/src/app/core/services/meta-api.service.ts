import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import {
  AdCreateRequest,
  AdLibrarySearchRequest,
  AdLibrarySearchResult,
  AdSetCreateRequest,
  AdSetUpdateRequest,
  AdUpdateRequest,
  CampaignCreateRequest,
  CampaignUpdateRequest,
  MarketingEntity,
  MarketingListRequest,
  MetaApiModule,
  ObservabilitySnapshot
} from '../models/meta-api.model';
import { META_API_MODULES } from '../data/meta-api-catalog';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MetaApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/meta`;

  constructor(private readonly http: HttpClient) {}

  getCatalog(): Observable<MetaApiModule[]> {
    return this.http
      .get<{ modules: MetaApiModule[] }>(`${this.baseUrl}/catalog`, {
        headers: this.authHeaders()
      })
      .pipe(
        map((response) => response.modules),
        catchError(() => of(META_API_MODULES))
      );
  }

  searchAdLibrary(payload: AdLibrarySearchRequest): Observable<AdLibrarySearchResult[]> {
    return this.http
      .post<{ data: AdLibrarySearchResult[] }>(`${this.baseUrl}/ad-library/search`, payload, {
        headers: this.authHeaders()
      })
      .pipe(
        map((response) => response.data ?? []),
        catchError(() => of([]))
      );
  }

  listCampaigns(payload: MarketingListRequest): Observable<MarketingEntity[]> {
    return this.http
      .get<{ data: MarketingEntity[] }>(`${this.baseUrl}/marketing/campaigns`, {
        params: {
          adAccountId: payload.adAccountId,
          fields: payload.fields ?? 'id,name,status,objective,effective_status,created_time,updated_time',
          limit: String(payload.limit ?? 25),
          ...(payload.accessToken ? { accessToken: payload.accessToken } : {})
        },
        headers: this.authHeaders()
      })
      .pipe(
        map((response) => response.data ?? []),
        catchError(() => of([]))
      );
  }

  createCampaign(payload: CampaignCreateRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/marketing/campaigns`, payload, {
      headers: this.authHeaders()
    });
  }

  updateCampaign(payload: CampaignUpdateRequest): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/marketing/campaigns/${payload.campaignId}`, payload, {
      headers: this.authHeaders()
    });
  }

  listAdSets(payload: MarketingListRequest): Observable<MarketingEntity[]> {
    return this.http
      .get<{ data: MarketingEntity[] }>(`${this.baseUrl}/marketing/adsets`, {
        params: {
          adAccountId: payload.adAccountId,
          fields: payload.fields ?? 'id,name,status,campaign_id,effective_status,created_time,updated_time',
          limit: String(payload.limit ?? 25),
          ...(payload.accessToken ? { accessToken: payload.accessToken } : {})
        },
        headers: this.authHeaders()
      })
      .pipe(
        map((response) => response.data ?? []),
        catchError(() => of([]))
      );
  }

  createAdSet(payload: AdSetCreateRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/marketing/adsets`, payload, {
      headers: this.authHeaders()
    });
  }

  updateAdSet(payload: AdSetUpdateRequest): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/marketing/adsets/${payload.adSetId}`, payload, {
      headers: this.authHeaders()
    });
  }

  listAds(payload: MarketingListRequest): Observable<MarketingEntity[]> {
    return this.http
      .get<{ data: MarketingEntity[] }>(`${this.baseUrl}/marketing/ads`, {
        params: {
          adAccountId: payload.adAccountId,
          fields:
            payload.fields ??
            'id,name,status,adset_id,campaign_id,effective_status,created_time,updated_time,ad_creation_time',
          limit: String(payload.limit ?? 25),
          ...(payload.accessToken ? { accessToken: payload.accessToken } : {})
        },
        headers: this.authHeaders()
      })
      .pipe(
        map((response) => response.data ?? []),
        catchError(() => of([]))
      );
  }

  createAd(payload: AdCreateRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/marketing/ads`, payload, {
      headers: this.authHeaders()
    });
  }

  updateAd(payload: AdUpdateRequest): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/marketing/ads/${payload.adId}`, payload, {
      headers: this.authHeaders()
    });
  }

  getObservability(): Observable<ObservabilitySnapshot | null> {
    return this.http
      .get<ObservabilitySnapshot>(`${this.baseUrl}/observability`, {
        headers: this.authHeaders()
      })
      .pipe(catchError(() => of(null)));
  }

  resetObservability(): Observable<boolean> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/observability/reset`, {}, {
        headers: this.authHeaders()
      })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  private authHeaders(): Record<string, string> {
    return environment.apiKey ? { 'x-api-key': environment.apiKey } : {};
  }
}
