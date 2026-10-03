import { Business, PersonProfile } from '@/lib/types';

export interface EnrichmentResult {
  emails: string[];
  linkedin_company_url: string | null;
  linkedin_profiles: PersonProfile[];
}

const INVALID_EMAIL_SUFFIXES = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', 
  '.woff', '.woff2', '.ttf', '.js', '.css', '.ico'
];

const IGNORED_EMAIL_DOMAINS = [
  'wixpress.com', 'sentry.io', 'example.com', 'domain.com', 
  'schema.org', 'w3.org', 'wordpress.com', 'wix.com', 'cloudflare.com'
];

function cleanEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  
  if (normalized.length < 5 || normalized.length > 80) return null;
  if (!normalized.includes('@') || !normalized.includes('.')) return null;
  
  // Check extensions
  for (const ext of INVALID_EMAIL_SUFFIXES) {
    if (normalized.endsWith(ext) || normalized.includes(`@800x`) || normalized.includes(`@2x`)) {
      return null;
    }
  }

  // Check domains
  const domain = normalized.split('@')[1];
  if (!domain || IGNORED_EMAIL_DOMAINS.includes(domain)) {
    return null;
  }

  return normalized;
}

export async function enrichBusinessContacts(
  business: Pick<Business, 'name' | 'website_url' | 'address' | 'phone'>
): Promise<EnrichmentResult> {
  const discoveredEmails = new Set<string>();
  let linkedinCompanyUrl: string | null = null;
  const discoveredPeople = new Map<string, PersonProfile>();

  if (!business.website_url) {
    // If no website, create a direct LinkedIn company search URL
    const searchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(business.name)}`;
    return {
      emails: [],
      linkedin_company_url: null,
      linkedin_profiles: [
        {
          name: `${business.name} Team`,
          role: 'Titolare / Dipendenti',
          linkedin_search_url: searchUrl,
        }
      ],
    };
  }

  let baseUrl = business.website_url.trim();
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }

  let baseOrigin = '';
  try {
    const parsed = new URL(baseUrl);
    baseOrigin = parsed.origin;
  } catch {
    baseOrigin = baseUrl;
  }

  const pagesToScrape: string[] = [baseUrl];

  try {
    // Step 1: Fetch homepage
    const homeRes = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(7000),
    });

    if (homeRes.ok) {
      const homeHtml = await homeRes.text();
      extractFromHtml(homeHtml, baseUrl, discoveredEmails, (url) => { linkedinCompanyUrl = url; }, discoveredPeople, business.name);

      // Find subpage links (Contact, About, Team, Privacy Policy)
      const linkRegex = /href=["']([^"']+)["']/gi;
      let match;
      const subpageKeywords = ['contatt', 'contact', 'chi-siam', 'about', 'team', 'staff', 'medici', 'dottor', 'privacy-policy', 'note-legali'];

      while ((match = linkRegex.exec(homeHtml)) !== null) {
        const href = match[1];
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

        const isTargetSubpage = subpageKeywords.some(keyword => href.toLowerCase().includes(keyword));
        if (isTargetSubpage) {
          try {
            const resolved = new URL(href, baseOrigin).href;
            if (resolved.startsWith(baseOrigin) && !pagesToScrape.includes(resolved) && pagesToScrape.length < 4) {
              pagesToScrape.push(resolved);
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    // Continue even if homepage fails
  }

  // Step 2: Fetch subpages in parallel
  const subpages = pagesToScrape.slice(1);
  if (subpages.length > 0) {
    await Promise.allSettled(
      subpages.map(async (pageUrl) => {
        try {
          const res = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(6000),
          });
          if (res.ok) {
            const html = await res.text();
            extractFromHtml(html, pageUrl, discoveredEmails, (url) => { if (!linkedinCompanyUrl) linkedinCompanyUrl = url; }, discoveredPeople, business.name);
          }
        } catch {}
      })
    );
  }

  // If no people were found explicitly, add a 1-click LinkedIn Search link for the business founder/team
  if (discoveredPeople.size === 0) {
    const genericSearch = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(business.name)}`;
    discoveredPeople.set('Team', {
      name: `Team / Fondatore di ${business.name}`,
      role: 'Titolare & Collaboratori',
      linkedin_search_url: genericSearch,
    });
  }

  return {
    emails: Array.from(discoveredEmails),
    linkedin_company_url: linkedinCompanyUrl,
    linkedin_profiles: Array.from(discoveredPeople.values()),
  };
}

function extractFromHtml(
  html: string,
  _currentUrl: string,
  discoveredEmails: Set<string>,
  setLinkedinCompany: (url: string) => void,
  discoveredPeople: Map<string, PersonProfile>,
  businessName: string
) {
  // 1. Mailto links
  const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  let match;
  while ((match = mailtoRegex.exec(html)) !== null) {
    const valid = cleanEmail(match[1]);
    if (valid) discoveredEmails.add(valid);
  }

  // 2. Raw Email regex
  const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
  while ((match = emailRegex.exec(html)) !== null) {
    const valid = cleanEmail(match[0]);
    if (valid) discoveredEmails.add(valid);
  }

  // 3. LinkedIn Company URL
  const companyRegex = /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/company\/([a-zA-Z0-9_%-]+)\/?/gi;
  while ((match = companyRegex.exec(html)) !== null) {
    setLinkedinCompany(match[0].replace(/\/$/, ''));
  }

  // 4. LinkedIn Personal Profile URLs
  const personalRegex = /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([a-zA-Z0-9_%-]+)\/?/gi;
  while ((match = personalRegex.exec(html)) !== null) {
    const fullUrl = match[0].replace(/\/$/, '');
    const handle = match[1].replace(/[-_]/g, ' ');
    // Format handle to title case
    const formattedName = handle
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .slice(0, 3)
      .join(' ');

    if (!discoveredPeople.has(formattedName)) {
      discoveredPeople.set(formattedName, {
        name: formattedName,
        role: 'Profilo LinkedIn',
        linkedin_url: fullUrl,
        linkedin_search_url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(formattedName + ' ' + businessName)}`,
      });
    }
  }

  // 5. Detect Italian Titolare / Fondatore / Doctors in text
  const keyPeopleRegex = /(?:titolare del trattamento|titolare è|titolare:|fondatore|fondatrice|amministratore|direttore sanitario|dott\.ssa|dott\.?|dr\.ssa|dr\.?)\s*:?\s*([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+){1,2})/gi;
  while ((match = keyPeopleRegex.exec(html)) !== null) {
    const name = match[1].trim();
    if (name.length > 4 && !discoveredPeople.has(name) && !name.toLowerCase().includes('google') && !name.toLowerCase().includes('cookie')) {
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name + ' ' + businessName)}`;
      discoveredPeople.set(name, {
        name,
        role: 'Titolare / Referente',
        linkedin_search_url: searchUrl,
      });
    }
  }
}
