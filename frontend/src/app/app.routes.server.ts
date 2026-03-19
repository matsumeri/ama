import { RenderMode, ServerRoute } from '@angular/ssr';
import { META_API_MODULES } from './core/data/meta-api-catalog';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'api/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return META_API_MODULES.map((module) => ({ slug: module.slug }));
    }
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
