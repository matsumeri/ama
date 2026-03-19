import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { META_API_MODULES } from '../../core/data/meta-api-catalog';
import { MetaApiModule } from '../../core/models/meta-api.model';

@Component({
  selector: 'app-api-category',
  imports: [CommonModule, RouterLink],
  templateUrl: './api-category.component.html',
  styleUrl: './api-category.component.scss'
})
export class ApiCategoryComponent implements OnInit, OnDestroy {
  module = signal<MetaApiModule | undefined>(undefined);
  private routeSubscription?: Subscription;

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      this.module.set(META_API_MODULES.find((item) => item.slug === slug));
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }
}
