import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ApiCategoryComponent } from './features/api-category/api-category.component';
import { AdLibraryComponent } from './features/ad-library/ad-library.component';
import { MarketingManagementComponent } from './features/marketing-management/marketing-management.component';

export const routes: Routes = [
	{
		path: '',
		component: DashboardComponent,
		title: 'AMA | Meta API Hub'
	},
	{
		path: 'marketing-management',
		component: MarketingManagementComponent,
		title: 'AMA | Marketing Management'
	},
	{
		path: 'api/:slug',
		component: ApiCategoryComponent,
		title: 'AMA | API Module'
	},
	{
		path: 'biblioteca-anuncios',
		component: AdLibraryComponent,
		title: 'AMA | Ad Library'
	},
	{
		path: '**',
		redirectTo: ''
	}
];
