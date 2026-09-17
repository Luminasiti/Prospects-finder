export interface SearchBounds {
  type: 'radius' | 'polygon';
  center?: { lat: number; lng: number };
  radius?: number; // meters
  polygon?: { lat: number; lng: number }[];
}

export interface Business {
  id: string;
  scan_id?: string;
  place_id?: string;
  name: string;
  address: string;
  phone: string;
  website_url: string | null;
  latitude: number;
  longitude: number;
  audit?: Audit;
  status?: 'pending_audit' | 'auditing' | 'audited' | 'failed';
}

export interface AiCritique {
  design_score: number; // 0 - 100
  era: string; // e.g. "Early 2010s Cluttered", "Modern Responsive", "Web 2.0 Antiquated"
  visual_hierarchy_rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  color_contrast_feedback: string;
  cro_feedback: string; // conversion rate optimization notes
  flaws: string[];
  redesign_pitch: string; // Cold pitch snippet tailored to owner
}

export interface Audit {
  id: string;
  business_id: string;
  score: number | null; // 0 - 100
  has_ssl: boolean;
  http_status: number | null;
  mobile_score: number | null;
  seo_score: number | null;
  accessibility_score: number | null;
  lcp_ms: number | null;
  issues_list: string[];
  ai_critique?: AiCritique | null;
  created_at?: string;
}

export interface Scan {
  id: string;
  category: string;
  boundary_geojson: any;
  status: 'running' | 'completed' | 'failed';
  created_at: string;
}

export type FilterType = 'all' | 'redesign' | 'no_ssl' | 'missing_website' | 'poor_ai_design' | 'high_performing';

export type OutreachStatus =
  | 'not_contacted'
  | 'contacted'
  | 'follow_up_needed'
  | 'replied'
  | 'meeting_booked'
  | 'closed_deal'
  | 'lost';

export interface SavedLead {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  address: string;
  website_url: string | null;
  audit_score: number | null;
  design_score?: number | null;
  outreach_status: OutreachStatus;
  list_name?: string; // Name of the list the lead belongs to (e.g., 'Default', 'High Priority', etc.)
  follow_up_date?: string | null;
  notes?: string;
  custom_fields: Record<string, string>;
  saved_at: string;
  updated_at?: string;
  audit?: Audit;
}
