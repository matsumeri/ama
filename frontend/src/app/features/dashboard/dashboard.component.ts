import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetaApiService } from '../../core/services/meta-api.service';
import { MetaApiModule } from '../../core/models/meta-api.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  modules = signal<MetaApiModule[]>([]);

  constructor(private readonly metaApiService: MetaApiService) {}

  ngOnInit(): void {
    this.metaApiService.getCatalog().subscribe((modules) => this.modules.set(modules));
  }

  badgeLabel(status: MetaApiModule['status']): string {
    if (status === 'ready') {
      return 'Listo';
    }

    if (status === 'partial') {
      return 'Parcial';
    }

    return 'Planeado';
  }
}
