import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdLibrarySearchRequest,
  AdLibrarySearchResult
} from '../../core/models/meta-api.model';
import { MetaApiService } from '../../core/services/meta-api.service';

@Component({
  selector: 'app-ad-library',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ad-library.component.html',
  styleUrl: './ad-library.component.scss'
})
export class AdLibraryComponent {
  form = signal<AdLibrarySearchRequest>({
    adReachedCountries: 'US',
    searchTerms: 'fitness',
    adType: 'ALL',
    limit: 20,
    accessToken: ''
  });

  loading = signal(false);
  results = signal<AdLibrarySearchResult[]>([]);

  constructor(private readonly metaApiService: MetaApiService) {}

  updateField<K extends keyof AdLibrarySearchRequest>(key: K, value: AdLibrarySearchRequest[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  runSearch(): void {
    this.loading.set(true);
    this.metaApiService.searchAdLibrary(this.form()).subscribe((rows) => {
      this.results.set(rows);
      this.loading.set(false);
    });
  }
}
