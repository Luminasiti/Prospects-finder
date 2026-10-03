import { Audit } from './types';

export interface PitchArgument {
  id: string;
  label: string;
  shortTag: string;
  description: string;
  category: 'AI & Visibilità' | 'Conversioni & Vendite' | 'Tecnico & Performance' | 'Fiducia & Brand';
  icon: string;
  isRecommended: (audit?: Audit | null, category?: string, address?: string) => boolean;
}

export const PITCH_ARGUMENTS: PitchArgument[] = [
  {
    id: 'ai_seo',
    label: 'SEO per AI (ChatGPT, Perplexity & Google AI Overviews)',
    shortTag: 'SEO per AI',
    description: 'Il sito non è strutturato per essere citato e raccomandato quando gli utenti chiedono consigli agli assistenti AI.',
    category: 'AI & Visibilità',
    icon: 'Bot',
    isRecommended: () => true, // Sempre consigliato per creare curiosità e innovazione
  },
  {
    id: 'booking_system',
    label: 'Sistema di Prenotazione Online Automatico 24/7',
    shortTag: 'Prenotazioni Online',
    description: 'Permette a clienti e pazienti di prenotare appuntamenti, tavoli o servizi direttamente dal sito senza telefonate.',
    category: 'Conversioni & Vendite',
    icon: 'Calendar',
    isRecommended: (_audit, cat) => {
      const lower = (cat || '').toLowerCase();
      return ['dentist', 'restaurant', 'ristorante', 'pizzeria', 'hotel', 'agriturismo', 'salon', 'barber', 'parrucchiere', 'medico', 'clinic', 'fisioterap', 'beauty', 'estetica', 'meccanico', 'auto repair'].some(k => lower.includes(k));
    },
  },
  {
    id: 'google_maps',
    label: 'Dominio Locale su Google Maps (Local Pack Top 3)',
    shortTag: 'Google Maps Top 3',
    description: 'Superare i concorrenti di zona nei primi 3 risultati di Google Maps per chi cerca con "vicino a me".',
    category: 'AI & Visibilità',
    icon: 'MapPin',
    isRecommended: (audit) => (audit?.seo_score !== null && audit?.seo_score !== undefined && audit.seo_score < 75),
  },
  {
    id: 'mobile_speed',
    label: 'Velocità Ultra-Rapida su Smartphone (< 1 Secondo)',
    shortTag: 'Velocità < 1s',
    description: 'Il 53% degli utenti abbandona il sito se impiega più di 3 secondi su rete mobile per andare dal concorrente.',
    category: 'Tecnico & Performance',
    icon: 'Zap',
    isRecommended: (audit) => Boolean(audit && ((audit.mobile_score !== null && audit.mobile_score < 65) || (audit.lcp_ms !== null && audit.lcp_ms > 2800))),
  },
  {
    id: 'modern_design',
    label: 'Restyling Grafico Moderno, Pulito & Mobile-First',
    shortTag: 'Design Moderno',
    description: 'Sostituire la grafica datata con un\'interfaccia elegante e moderna che trasmette immediatamente prestigio e affidabilità.',
    category: 'Fiducia & Brand',
    icon: 'Palette',
    isRecommended: (audit) => Boolean(audit?.ai_critique && audit.ai_critique.design_score < 70),
  },
  {
    id: 'ssl_security',
    label: 'Risoluzione Avviso di Sicurezza (Certificato SSL)',
    shortTag: 'Sicurezza SSL',
    description: 'Eliminare la schermata di allarme di Chrome "Sito non sicuro" che spaventa i clienti e azzera le conversioni.',
    category: 'Tecnico & Performance',
    icon: 'ShieldAlert',
    isRecommended: (audit) => Boolean(audit && audit.has_ssl === false),
  },
  {
    id: 'whatsapp_leads',
    label: 'Tasto Diretto WhatsApp per Contatto Istantaneo',
    shortTag: 'Tasto WhatsApp',
    description: 'Catturare clienti che preferiscono chattare subito su WhatsApp invece di compilare moduli o inviare email lente.',
    category: 'Conversioni & Vendite',
    icon: 'MessageSquare',
    isRecommended: (_audit, cat) => {
      const lower = (cat || '').toLowerCase();
      return ['idraulico', 'plumber', 'elettricista', 'electrician', 'fabbro', 'carrozzeria', 'meccanico', 'auto repair', 'roofer', 'pulizie', 'condizionat'].some(k => lower.includes(k));
    },
  },
  {
    id: 'social_proof',
    label: 'Riprova Sociale & Recensioni a 5 Stelle in Evidenza',
    shortTag: 'Recensioni 5 Stelle',
    description: 'Mostrare le migliori recensioni verificate direttamente nella prima schermata per raddoppiare la fiducia dei visitatori.',
    category: 'Fiducia & Brand',
    icon: 'Star',
    isRecommended: (audit) => Boolean(audit?.issues_list?.some(i => i.toLowerCase().includes('review') || i.toLowerCase().includes('recension'))),
  },
  {
    id: 'conversion_cta',
    label: 'Pulsanti Chiamata Rapida & Ottimizzazione Conversioni (CRO)',
    shortTag: 'Pulsanti Chiama Ora',
    description: 'Pulsante sticky "Chiama Ora" e percorsi chiari per guidare il visitatore a telefonare o richiedere subito il servizio.',
    category: 'Conversioni & Vendite',
    icon: 'MousePointerClick',
    isRecommended: (audit) => Boolean(audit?.ai_critique?.cro_feedback?.toLowerCase().includes('falla') || audit?.issues_list?.some(i => i.toLowerCase().includes('cta'))),
  },
  {
    id: 'local_seo_keywords',
    label: 'Posizionamento in Prima Pagina per Parole Chiave di Zona',
    shortTag: 'SEO Prima Pagina',
    description: 'Intercettare chi cerca attivamente i servizi più redditizi nella città e nei comuni della provincia.',
    category: 'AI & Visibilità',
    icon: 'TrendingUp',
    isRecommended: (audit) => Boolean(audit && (audit.seo_score === null || audit.seo_score < 70)),
  },
  {
    id: 'quote_calculator',
    label: 'Calcolatore Preventivo / Richiesta Interattiva Online',
    shortTag: 'Preventivatore Online',
    description: 'Configuratore guidato in 3 passaggi che qualifica il contatto e gli fa richiedere una stima economica in autonomia.',
    category: 'Conversioni & Vendite',
    icon: 'Calculator',
    isRecommended: (_audit, cat) => {
      const lower = (cat || '').toLowerCase();
      return ['edile', 'contractor', 'serramenti', 'infissi', 'fotovoltaic', 'solar', 'ristrutturaz', 'falegname', 'commercialista', 'avvocato'].some(k => lower.includes(k));
    },
  },
  {
    id: 'brand_authority',
    label: 'Differenziazione Esclusiva rispetto ai Concorrenti Locali',
    shortTag: 'Brand Autorevole',
    description: 'Distaccarsi dai siti copia-e-incolla dei competitor per giustificare prezzi più alti e trasmettere eccellenza.',
    category: 'Fiducia & Brand',
    icon: 'Crown',
    isRecommended: () => false,
  },
  {
    id: 'multilingual',
    label: 'Versione Multilingua per Clienti e Turisti Stranieri',
    shortTag: 'Multilingua (EN/DE)',
    description: 'Indispensabile per attrarre turisti tedeschi, inglesi e internazionali che visitano il territorio.',
    category: 'AI & Visibilità',
    icon: 'Globe',
    isRecommended: (_audit, _cat, addr) => {
      const lower = (addr || '').toLowerCase();
      return ['garda', 'sirmione', 'desenzano', 'bardolino', 'peschiera', 'riva', 'lazise', 'salò', 'malcesine', 'limone', 'como', 'maggiore', 'venezia', 'firenze', 'roma'].some(k => lower.includes(k));
    },
  },
  {
    id: 'gdpr_cookie',
    label: 'Conformità Legale Privacy, Cookie Banner & GDPR',
    shortTag: 'GDPR & Privacy',
    description: 'Adeguamento a norma di legge per evitare sanzioni e garantire la massima trasparenza ai visitatori.',
    category: 'Tecnico & Performance',
    icon: 'FileCheck',
    isRecommended: () => false,
  },
];

export function getRecommendedArgumentIds(
  audit?: Audit | null,
  category?: string,
  address?: string
): string[] {
  const recommended = PITCH_ARGUMENTS.filter(arg => arg.isRecommended(audit, category, address)).map(a => a.id);
  // Ensure at least 3-4 strong default arguments if none or few match
  const fallbackDefaults = ['ai_seo', 'booking_system', 'mobile_speed', 'google_maps'];
  const merged = Array.from(new Set([...recommended, ...fallbackDefaults]));
  return merged.slice(0, 5);
}
