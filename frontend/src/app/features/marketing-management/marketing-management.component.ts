import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AdCreateRequest,
  AdSetCreateRequest,
  CampaignCreateRequest,
  EntityStatus,
  MarketingEntity,
  ObservabilitySnapshot
} from '../../core/models/meta-api.model';
import { MetaApiService } from '../../core/services/meta-api.service';

type EntityKind = 'campaigns' | 'adSets' | 'ads';
type StatusFilter = EntityStatus | 'ALL';
type SortField = 'name' | 'status' | 'id' | 'date';
type SortDirection = 'asc' | 'desc';

interface TableState {
  query: string;
  status: StatusFilter;
  dateFrom: string;
  dateTo: string;
  sortBy: SortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-marketing-management',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './marketing-management.component.html',
  styleUrl: './marketing-management.component.scss'
})
export class MarketingManagementComponent {
  readonly statusFilterOptions: StatusFilter[] = ['ALL', 'ACTIVE', 'PAUSED', 'ARCHIVED'];
  readonly sortFieldOptions: SortField[] = ['name', 'status', 'id', 'date'];

  adAccountId = signal('');
  accessToken = signal('');
  loading = signal(false);
  loadingObservability = signal(false);
  resettingObservability = signal(false);
  message = signal('');

  campaignForm = signal<CampaignCreateRequest>({
    adAccountId: '',
    name: '',
    objective: 'OUTCOME_TRAFFIC',
    status: 'PAUSED',
    accessToken: ''
  });

  adSetForm = signal<AdSetCreateRequest>({
    adAccountId: '',
    name: '',
    campaignId: '',
    dailyBudget: '',
    status: 'PAUSED',
    accessToken: ''
  });

  adForm = signal<AdCreateRequest>({
    adAccountId: '',
    name: '',
    adsetId: '',
    creative: { creative_id: '' },
    status: 'PAUSED',
    accessToken: ''
  });

  campaigns = signal<MarketingEntity[]>([]);
  adSets = signal<MarketingEntity[]>([]);
  ads = signal<MarketingEntity[]>([]);
  observability = signal<ObservabilitySnapshot | null>(null);

  campaignTable = signal<TableState>({
    query: '',
    status: 'ALL',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortDirection: 'desc',
    page: 1,
    pageSize: 6
  });

  adSetTable = signal<TableState>({
    query: '',
    status: 'ALL',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortDirection: 'desc',
    page: 1,
    pageSize: 6
  });

  adTable = signal<TableState>({
    query: '',
    status: 'ALL',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortDirection: 'desc',
    page: 1,
    pageSize: 6
  });

  constructor(private readonly metaApiService: MetaApiService) {}

  updateCampaignName(value: string): void {
    this.campaignForm.update((form) => ({ ...form, name: value }));
  }

  updateCampaignObjective(value: string): void {
    this.campaignForm.update((form) => ({ ...form, objective: value }));
  }

  updateAdSetName(value: string): void {
    this.adSetForm.update((form) => ({ ...form, name: value }));
  }

  updateAdSetCampaignId(value: string): void {
    this.adSetForm.update((form) => ({ ...form, campaignId: value }));
  }

  updateAdSetDailyBudget(value: string): void {
    this.adSetForm.update((form) => ({ ...form, dailyBudget: value }));
  }

  updateAdName(value: string): void {
    this.adForm.update((form) => ({ ...form, name: value }));
  }

  updateAdAdSetId(value: string): void {
    this.adForm.update((form) => ({ ...form, adsetId: value }));
  }

  updateAdCreativeId(value: string): void {
    this.adForm.update((form) => ({ ...form, creative: { creative_id: value } }));
  }

  setMessage(text: string): void {
    this.message.set(text);
    setTimeout(() => this.message.set(''), 3500);
  }

  updateScope(): void {
    const adAccountId = this.adAccountId().trim();
    const accessToken = this.accessToken().trim();

    this.campaignForm.update((form) => ({ ...form, adAccountId, accessToken }));
    this.adSetForm.update((form) => ({ ...form, adAccountId, accessToken }));
    this.adForm.update((form) => ({ ...form, adAccountId, accessToken }));
  }

  refreshAll(): void {
    this.updateScope();

    const adAccountId = this.adAccountId().trim();
    if (!adAccountId) {
      this.setMessage('Completa adAccountId para cargar entidades.');
      return;
    }

    this.loading.set(true);

    const accessToken = this.accessToken().trim();
    forkJoin({
      campaigns: this.metaApiService.listCampaigns({ adAccountId, accessToken }),
      adSets: this.metaApiService.listAdSets({ adAccountId, accessToken }),
      ads: this.metaApiService.listAds({ adAccountId, accessToken })
    }).subscribe({
      next: (response) => {
        this.campaigns.set(response.campaigns);
        this.adSets.set(response.adSets);
        this.ads.set(response.ads);
        this.resetPagination();
        this.refreshObservability();
      },
      error: () => {
        this.setMessage('No fue posible cargar entidades de marketing.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  refreshObservability(): void {
    this.loadingObservability.set(true);
    this.metaApiService.getObservability().subscribe({
      next: (snapshot) => {
        this.observability.set(snapshot);
      },
      complete: () => {
        this.loadingObservability.set(false);
      }
    });
  }

  resetObservability(): void {
    this.resettingObservability.set(true);
    this.metaApiService.resetObservability().subscribe({
      next: (ok) => {
        if (!ok) {
          this.setMessage('No fue posible resetear metricas.');
          return;
        }

        this.setMessage('Metricas de observabilidad reseteadas.');
        this.refreshObservability();
      },
      complete: () => {
        this.resettingObservability.set(false);
      }
    });
  }

  setQuery(kind: EntityKind, value: string): void {
    this.tableByKind(kind).update((table) => ({ ...table, query: value, page: 1 }));
  }

  setStatusFilter(kind: EntityKind, value: StatusFilter): void {
    this.tableByKind(kind).update((table) => ({ ...table, status: value, page: 1 }));
  }

  setPageSize(kind: EntityKind, value: number): void {
    const safeSize = Math.min(Math.max(value, 3), 50);
    this.tableByKind(kind).update((table) => ({ ...table, pageSize: safeSize, page: 1 }));
  }

  setDateFrom(kind: EntityKind, value: string): void {
    this.tableByKind(kind).update((table) => ({ ...table, dateFrom: value, page: 1 }));
  }

  setDateTo(kind: EntityKind, value: string): void {
    this.tableByKind(kind).update((table) => ({ ...table, dateTo: value, page: 1 }));
  }

  setSortBy(kind: EntityKind, value: SortField): void {
    this.tableByKind(kind).update((table) => ({ ...table, sortBy: value, page: 1 }));
  }

  setSortDirection(kind: EntityKind, value: SortDirection): void {
    this.tableByKind(kind).update((table) => ({ ...table, sortDirection: value, page: 1 }));
  }

  nextPage(kind: EntityKind): void {
    const total = this.totalPages(kind);
    this.tableByKind(kind).update((table) => ({
      ...table,
      page: Math.min(table.page + 1, total)
    }));
  }

  prevPage(kind: EntityKind): void {
    this.tableByKind(kind).update((table) => ({
      ...table,
      page: Math.max(table.page - 1, 1)
    }));
  }

  currentPage(kind: EntityKind): number {
    return this.tableByKind(kind)().page;
  }

  totalPages(kind: EntityKind): number {
    const table = this.tableByKind(kind)();
    const total = this.filteredByKind(kind).length;
    return Math.max(Math.ceil(total / table.pageSize), 1);
  }

  pagedByKind(kind: EntityKind): MarketingEntity[] {
    const table = this.tableByKind(kind)();
    const filtered = this.filteredByKind(kind);
    const start = (table.page - 1) * table.pageSize;
    return filtered.slice(start, start + table.pageSize);
  }

  totalFiltered(kind: EntityKind): number {
    return this.filteredByKind(kind).length;
  }

  canPrev(kind: EntityKind): boolean {
    return this.currentPage(kind) > 1;
  }

  canNext(kind: EntityKind): boolean {
    return this.currentPage(kind) < this.totalPages(kind);
  }

  formatCounterMap(values: Record<string, number> | undefined): Array<{ key: string; value: number }> {
    if (!values) {
      return [];
    }

    return Object.entries(values)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value);
  }

  createCampaign(): void {
    this.updateScope();
    const payload = this.campaignForm();

    if (!payload.adAccountId || !payload.name || !payload.objective) {
      this.setMessage('Para crear campana: adAccountId, name y objective son obligatorios.');
      return;
    }

    this.metaApiService.createCampaign(payload).subscribe({
      next: () => {
        this.setMessage('Campana creada correctamente.');
        this.campaignForm.update((form) => ({ ...form, name: '' }));
        this.refreshAll();
      },
      error: () => this.setMessage('No fue posible crear la campana.')
    });
  }

  createAdSet(): void {
    this.updateScope();
    const payload = this.adSetForm();

    if (!payload.adAccountId || !payload.name || !payload.campaignId) {
      this.setMessage('Para crear ad set: adAccountId, name y campaignId son obligatorios.');
      return;
    }

    this.metaApiService.createAdSet(payload).subscribe({
      next: () => {
        this.setMessage('Ad set creado correctamente.');
        this.adSetForm.update((form) => ({ ...form, name: '' }));
        this.refreshAll();
      },
      error: () => this.setMessage('No fue posible crear el ad set.')
    });
  }

  createAd(): void {
    this.updateScope();
    const payload = this.adForm();

    if (!payload.adAccountId || !payload.name || !payload.adsetId || !payload.creative.creative_id) {
      this.setMessage('Para crear ad: adAccountId, name, adsetId y creative_id son obligatorios.');
      return;
    }

    this.metaApiService.createAd(payload).subscribe({
      next: () => {
        this.setMessage('Ad creado correctamente.');
        this.adForm.update((form) => ({ ...form, name: '' }));
        this.refreshAll();
      },
      error: () => this.setMessage('No fue posible crear el ad.')
    });
  }

  pauseCampaign(id: string): void {
    this.metaApiService
      .updateCampaign({ campaignId: id, status: 'PAUSED', accessToken: this.accessToken().trim() })
      .subscribe({
        next: () => {
          this.setMessage('Campana pausada.');
          this.refreshAll();
        },
        error: () => this.setMessage('No fue posible pausar la campana.')
      });
  }

  pauseAdSet(id: string): void {
    this.metaApiService
      .updateAdSet({ adSetId: id, status: 'PAUSED', accessToken: this.accessToken().trim() })
      .subscribe({
        next: () => {
          this.setMessage('Ad set pausado.');
          this.refreshAll();
        },
        error: () => this.setMessage('No fue posible pausar el ad set.')
      });
  }

  pauseAd(id: string): void {
    this.metaApiService
      .updateAd({ adId: id, status: 'PAUSED', accessToken: this.accessToken().trim() })
      .subscribe({
        next: () => {
          this.setMessage('Ad pausado.');
          this.refreshAll();
        },
        error: () => this.setMessage('No fue posible pausar el ad.')
      });
  }

  private filteredByKind(kind: EntityKind): MarketingEntity[] {
    const table = this.tableByKind(kind)();
    const source = this.sourceByKind(kind)();
    const query = table.query.trim().toLowerCase();

    const filtered = source.filter((item) => {
      const status = item.status || item.effective_status || '';
      const matchesStatus = table.status === 'ALL' || status === table.status;
      const searchable = `${item.name ?? ''} ${item.id} ${status}`.toLowerCase();
      const matchesQuery = !query || searchable.includes(query);

      const entityDate = this.entityDate(item);
      const matchesFrom = !table.dateFrom || (entityDate !== null && entityDate >= table.dateFrom);
      const matchesTo = !table.dateTo || (entityDate !== null && entityDate <= table.dateTo);

      return matchesStatus && matchesQuery && matchesFrom && matchesTo;
    });

    return filtered.sort((a, b) => this.compareEntities(a, b, table.sortBy, table.sortDirection));
  }

  private compareEntities(
    left: MarketingEntity,
    right: MarketingEntity,
    sortBy: SortField,
    direction: SortDirection
  ): number {
    const order = direction === 'asc' ? 1 : -1;

    if (sortBy === 'date') {
      const leftDate = this.entityDate(left) ?? '';
      const rightDate = this.entityDate(right) ?? '';
      return leftDate.localeCompare(rightDate) * order;
    }

    const leftValue = this.sortValue(left, sortBy);
    const rightValue = this.sortValue(right, sortBy);
    return leftValue.localeCompare(rightValue) * order;
  }

  private sortValue(entity: MarketingEntity, sortBy: Exclude<SortField, 'date'>): string {
    if (sortBy === 'name') {
      return (entity.name ?? '').toLowerCase();
    }

    if (sortBy === 'status') {
      return (entity.status ?? entity.effective_status ?? '').toLowerCase();
    }

    return entity.id.toLowerCase();
  }

  private entityDate(entity: MarketingEntity): string | null {
    const rawDate = entity.created_time ?? entity.updated_time ?? entity.ad_creation_time ?? null;
    if (!rawDate) {
      return null;
    }

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString().slice(0, 10);
  }

  private sourceByKind(kind: EntityKind) {
    if (kind === 'campaigns') {
      return this.campaigns;
    }

    if (kind === 'adSets') {
      return this.adSets;
    }

    return this.ads;
  }

  private tableByKind(kind: EntityKind) {
    if (kind === 'campaigns') {
      return this.campaignTable;
    }

    if (kind === 'adSets') {
      return this.adSetTable;
    }

    return this.adTable;
  }

  private resetPagination(): void {
    this.campaignTable.update((table) => ({ ...table, page: 1 }));
    this.adSetTable.update((table) => ({ ...table, page: 1 }));
    this.adTable.update((table) => ({ ...table, page: 1 }));
  }
}
