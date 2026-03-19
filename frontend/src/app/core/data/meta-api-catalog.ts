import { MetaApiModule } from '../models/meta-api.model';

export const META_API_MODULES: MetaApiModule[] = [
  {
    slug: 'marketing-management',
    title: 'Marketing Management API',
    summary: 'Gestion de campanas, ad sets y anuncios desde una capa simplificada.',
    usage: 'Operaciones de creacion, actualizacion, pausado y automatizacion de estructura publicitaria.',
    endpoints: ['Campaigns', 'Ad Sets', 'Ads', 'Ad Creatives'],
    status: 'partial'
  },
  {
    slug: 'insights-reporting',
    title: 'Insights & Reporting API',
    summary: 'Consulta metrica por cuenta, campana, conjunto y anuncio.',
    usage: 'Dashboards, reporte diario, alertas de rendimiento y analisis de costos.',
    endpoints: ['Insights', 'Breakdowns', 'Attribution Windows'],
    status: 'partial'
  },
  {
    slug: 'audiences',
    title: 'Audiences API',
    summary: 'Administracion de audiencias personalizadas, lookalikes y segmentos.',
    usage: 'Segmentacion y sincronizacion de datos first-party.',
    endpoints: ['Custom Audiences', 'Lookalike Audiences', 'Saved Audiences'],
    status: 'planned'
  },
  {
    slug: 'leads',
    title: 'Lead Ads API',
    summary: 'Extraccion y procesamiento de leads capturados en formularios.',
    usage: 'Integracion con CRM, scoring y automatizaciones de seguimiento.',
    endpoints: ['Leadgen Forms', 'Leads Retrieval', 'Webhook Events'],
    status: 'planned'
  },
  {
    slug: 'commerce-catalog',
    title: 'Commerce & Catalog API',
    summary: 'Gestion de catalogos, productos y sincronizacion para anuncios dinamicos.',
    usage: 'Ecommerce feed management y vinculacion con campañas de ventas.',
    endpoints: ['Catalogs', 'Products', 'Product Sets'],
    status: 'planned'
  },
  {
    slug: 'pixel-conversions',
    title: 'Pixel & Conversions API',
    summary: 'Eventos de conversion y medicion server-side para optimizacion.',
    usage: 'Eventos web y offline, deduplicacion, y atribucion avanzada.',
    endpoints: ['Pixels', 'Conversions API', 'Offline Conversions'],
    status: 'partial'
  },
  {
    slug: 'business-assets',
    title: 'Business Assets API',
    summary: 'Gestion de activos de negocio, paginas, instagram y permisos.',
    usage: 'Administracion de cuentas y relacion entre business managers.',
    endpoints: ['Business Manager', 'Pages', 'Instagram Accounts'],
    status: 'planned'
  },
  {
    slug: 'ad-library',
    title: 'Meta Ad Library API',
    summary: 'Consulta publica de anuncios activos y politicos por terminos y pais.',
    usage: 'Research competitivo, cumplimiento y analisis creativo.',
    endpoints: ['ads_archive search', 'ad snapshot data'],
    status: 'ready',
    focus: true
  }
];
