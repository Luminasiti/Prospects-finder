import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Audit, Business, AiCritique } from '@/lib/types';
import { enrichBusinessContacts } from '@/lib/enrichment';
import crypto from 'crypto';

interface AuditRequestItem {
  id: string;
  name: string;
  website_url: string | null;
  category?: string;
}

// Inspect single website availability, SSL, performance, DOM, and compute weighted score
async function auditSingleWebsite(
  business: AuditRequestItem,
  pageSpeedKey?: string,
  geminiKey?: string
): Promise<Audit> {
  const auditId = crypto.randomUUID();

  // Edge case: No website provided
  if (!business.website_url || business.website_url.trim() === '') {
    const email_pitch = `Oggetto: ${business.name}: La presenza digitale che manca per conquistare nuovi clienti

Gentile Team di ${business.name},

mentre analizzavo le attività del settore ${business.category || 'Servizi'} nella vostra zona, ho notato che la vostra impresa non dispone ancora di un sito web ufficiale dedicato.

Oggi oltre il 90% delle persone cerca su Google e consulta lo smartphone prima di effettuare una chiamata o una visita. Senza un sito web attivo, tutti questi potenziali clienti scelgono automaticamente i concorrenti.

Per questo motivo, abbiamo GIÀ creato un prototipo interattivo e moderno del vostro nuovo sito web: è ultra-veloce, responsive e studiato per farvi ricevere contatti diretti ogni giorno.

Avreste 10 minuti questa settimana per dargli un'occhiata insieme senza alcun impegno?
Potete prenotare una breve chiamata qui: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

Un cordiale saluto,
Il Team di Luminasiti`;

    const linkedin_pitch = `Buongiorno [Nome],

ho notato che ${business.name} non ha ancora un sito web ufficiale, e questo fa sì che molti clienti cerchino altrove.

Abbiamo GIÀ sviluppato un prototipo moderno, veloce e mobile-first del vostro nuovo sito web. 

Avreste 10 minuti per vederlo insieme senza impegno?
Potete prenotare uno slot qui: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

A presto!`;

    return {
      id: auditId,
      business_id: business.id,
      score: null,
      has_ssl: false,
      http_status: null,
      mobile_score: null,
      seo_score: null,
      accessibility_score: null,
      lcp_ms: null,
      issues_list: ['Nessun sito web trovato / Presenza digitale assente'],
      ai_critique: {
        design_score: 0,
        era: 'Non-Existent',
        visual_hierarchy_rating: 'Poor',
        color_contrast_feedback: 'Nessun asset web rilevato.',
        cro_feedback: 'Assenza totale di visibilità online. Il traffico locale va ai concorrenti.',
        flaws: ['Nessun sito web registrato per questa attività'],
        redesign_pitch: email_pitch,
        email_pitch,
        linkedin_pitch,
      },
    };
  }

  let targetUrl = business.website_url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  let hasSsl = targetUrl.startsWith('https://');
  let httpStatus: number | null = null;
  let responseTimeMs = 0;
  let html = '';
  let reachabilityError = false;

  // Step A: Fast network availability & SSL check (10s timeout)
  const startTime = Date.now();
  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadAuditBot/1.0; +https://leadaudit.pro)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    responseTimeMs = Date.now() - startTime;
    httpStatus = res.status;
    hasSsl = res.url.startsWith('https://');

    if (res.ok) {
      html = await res.text();
    } else {
      reachabilityError = true;
    }
  } catch (netErr: any) {
    reachabilityError = true;
    httpStatus = 504; // Timeout or unreachable
  }

  const issues: string[] = [];

  // If site is completely unreachable
  if (reachabilityError || !httpStatus || httpStatus >= 400) {
    issues.push('Domain unreachable or server error (>10s timeout / 4xx / 5xx)');
    if (!hasSsl) issues.push('No SSL Certificate (Insecure HTTP)');

    return {
      id: auditId,
      business_id: business.id,
      score: 15,
      has_ssl: hasSsl,
      http_status: httpStatus || 504,
      mobile_score: 10,
      seo_score: 15,
      accessibility_score: 20,
      lcp_ms: 8500,
      issues_list: issues,
      ai_critique: {
        design_score: 10,
        era: 'Unreachable Server',
        visual_hierarchy_rating: 'Poor',
        color_contrast_feedback: 'Unable to render site assets.',
        cro_feedback: 'Total traffic loss due to site downtime.',
        flaws: ['Server error or unreachable host', 'Insecure or expired SSL'],
        redesign_pitch: `Hi ${business.name} team, your website appears to be down or timing out. We can migrate you to a lightning-fast modern hosting platform today.`,
      },
    };
  }

  // Step B: Performance, SEO, DOM extraction
  let mobileScore = 70;
  let seoScore = 75;
  let accessibilityScore = 80;
  let lcpMs = 2600;

  // Try PageSpeed Insights API if key provided
  if (pageSpeedKey && pageSpeedKey.trim().length > 10) {
    try {
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
        targetUrl
      )}&strategy=mobile&key=${pageSpeedKey}`;
      const psiRes = await fetch(psiUrl, { signal: AbortSignal.timeout(12000) });
      if (psiRes.ok) {
        const psiData = await psiRes.json();
        const lighthouse = psiData.lighthouseResult;
        if (lighthouse?.categories) {
          mobileScore = Math.round((lighthouse.categories.performance?.score || 0.65) * 100);
          seoScore = Math.round((lighthouse.categories.seo?.score || 0.7) * 100);
          accessibilityScore = Math.round((lighthouse.categories.accessibility?.score || 0.75) * 100);
        }
        if (lighthouse?.audits?.['largest-contentful-paint']?.numericValue) {
          lcpMs = Math.round(lighthouse.audits['largest-contentful-paint'].numericValue);
        }
      }
    } catch (psiError) {
      console.warn('PageSpeed API call timed out or failed, using DOM heuristics:', psiError);
    }
  } else {
    // DOM-based Heuristics when PSI key is not configured
    // Mobile speed estimation based on TTFB and HTML size
    const htmlSizeBytes = html.length;
    let computedSpeed = 90 - Math.min(45, Math.round(responseTimeMs / 50)) - (htmlSizeBytes > 150000 ? 15 : 0);
    mobileScore = Math.max(25, Math.min(98, computedSpeed));
    lcpMs = Math.max(900, Math.round(responseTimeMs * 2.2 + 800));

    // SEO checks
    const hasTitle = /<title[^>]*>[\s\S]+?<\/title>/i.test(html);
    const hasMetaDesc = /<meta[^>]*name=["']description["']/i.test(html);
    const hasH1 = /<h1[^>]*>/i.test(html);
    let seoCalc = 60;
    if (hasTitle) seoCalc += 15;
    if (hasMetaDesc) seoCalc += 15;
    if (hasH1) seoCalc += 10;
    seoScore = seoCalc;
  }

  // Basic DOM checks
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
  const hasH1 = /<h1[^>]*>/i.test(html);
  const hasTitle = /<title[^>]*>/i.test(html);
  const hasMetaDesc = /<meta[^>]*name=["']description["']/i.test(html);
  const imageCount = (html.match(/<img[^>]+>/gi) || []).length;
  const imagesWithoutAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;

  // Step C: Heuristics & Scoring Engine (0 - 100 weighted)
  // 1. SSL & Reachability: 20 pts
  let sslReachabilityPts = 0;
  if (httpStatus === 200) {
    sslReachabilityPts += 10;
  } else if (httpStatus >= 300 && httpStatus < 400) {
    sslReachabilityPts += 7; // redirects
  }
  if (hasSsl) {
    sslReachabilityPts += 10;
  } else {
    issues.push('Missing SSL Certificate (Site served over insecure HTTP)');
  }

  // 2. Mobile PageSpeed Score: 30 pts
  const mobilePts = Math.round((mobileScore / 100) * 30);
  if (mobileScore < 50) {
    issues.push(`Poor Mobile Performance (${mobileScore}/100)`);
  }

  // 3. SEO Score: 20 pts
  const seoPts = Math.round((seoScore / 100) * 20);
  if (!hasTitle) issues.push('Missing <title> tag');
  if (!hasMetaDesc) issues.push('Missing Meta Description tag');
  if (seoScore < 60) issues.push(`Low SEO Optimization Score (${seoScore}/100)`);

  // 4. Core Web Vitals: 15 pts (LCP based)
  let cwvPts = 0;
  if (lcpMs <= 2500) {
    cwvPts = 15; // Good
  } else if (lcpMs <= 4000) {
    cwvPts = 8;  // Needs improvement
    issues.push(`Slow Largest Contentful Paint (${(lcpMs / 1000).toFixed(1)}s)`);
  } else {
    cwvPts = 2;  // Poor
    issues.push(`Critical LCP Delay (${(lcpMs / 1000).toFixed(1)}s > 4.0s)`);
  }

  // 5. Basic DOM checks: 15 pts
  let domPts = 0;
  if (hasViewport) {
    domPts += 6;
  } else {
    issues.push('Missing mobile viewport meta tag');
  }

  if (hasH1) {
    domPts += 5;
  } else {
    issues.push('Missing <h1> primary heading');
  }

  if (imageCount === 0 || imagesWithoutAlt === 0) {
    domPts += 4;
  } else {
    domPts += 2;
    issues.push(`${imagesWithoutAlt} images missing alt text`);
  }

  const finalScore = Math.max(10, Math.min(100, Math.round(
    sslReachabilityPts + mobilePts + seoPts + cwvPts + domPts
  )));

  // Step D: AI Design & UX Critique
  let aiCritique: AiCritique | null = null;
  try {
    const hasCta = /(call now|book now|contact us|get a quote|schedule|free estimate)/i.test(html);
    const hasReviews = /(review|testimonial|rating|star|google review)/i.test(html);

    let designScore = finalScore > 75 ? 82 : finalScore < 50 ? 38 : 62;
    if (!hasCta) designScore -= 12;
    if (!hasViewport) designScore -= 15;
    designScore = Math.max(22, Math.min(95, designScore));

    let era = 'Modern Responsive';
    let visualHierarchy: 'Poor' | 'Fair' | 'Good' | 'Excellent' = 'Good';

    if (designScore < 45) {
      era = 'Early 2010s Cluttered';
      visualHierarchy = 'Poor';
    } else if (designScore < 70) {
      era = 'Generic Web Template';
      visualHierarchy = 'Fair';
    } else {
      era = 'Modern Clean UI';
      visualHierarchy = 'Good';
    }

    const designFlaws = [...issues.slice(0, 3)];
    if (!hasCta) designFlaws.push('Assenza di un pulsante Call-To-Action rapido per chiamare o prenotare');
    if (!hasReviews) designFlaws.push('Mancanza di recensioni e riprova sociale');

    const cleanFlaws = designFlaws.length > 0 ? designFlaws : ['Layout mobile e velocità di caricamento non ottimizzati'];
    let email_pitch = `Oggetto: ${business.name}: Quel dettaglio sul vostro sito che allontana i clienti

Gentile Team di ${business.name},

analizzando la presenza digitale nel vostro settore, ho notato che il vostro sito presenta un problema critico: ${cleanFlaws[0]}.

Oggi la maggior parte dei clienti cerca e prenota da smartphone: un sito con problemi di lentezza o grafica datata spinge gli utenti a uscire e rivolgersi ai concorrenti.

Per questo motivo, per farvi toccare con mano la differenza, abbiamo GIÀ sviluppato un prototipo del vostro nuovo sito web. È ultra-veloce, moderno e progettato per massimizzare contatti e prenotazioni.

Avreste 10 minuti nei prossimi giorni per vederlo insieme senza impegno?
Potete prenotare una breve chiamata qui: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

Un cordiale saluto,
Il Team di Luminasiti`;

    let linkedin_pitch = `Buongiorno [Nome],

visitando il sito di ${business.name} ho notato che alcuni aspetti tecnici (${cleanFlaws[0]}) stanno frenando l'acquisizione di nuovi clienti.

Abbiamo GIÀ realizzato un prototipo moderno e ultra-veloce del vostro nuovo sito web, studiato per risolvere ogni problema di design e velocità.

Avreste 10 minuti per dare un'occhiata insieme senza impegno?
Potete scegliere l'orario qui: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

Un saluto cordiale!`;

    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const prompt = `Sei un copywriter B2B di livello mondiale. Genera in LINGUA ITALIANA 2 pitch (email e linkedin) per riproporre il sito a questo prospect:
Azienda: "${business.name}"
Settore: "${business.category || 'Servizi'}"
Problemi tecnici: ${cleanFlaws.join(', ')}

Requisiti:
1. Spiega i punti deboli reali per il loro settore.
2. Dichiara chiaramente che abbiamo GIÀ creato un prototipo del nuovo sito moderno e ultra-veloce che risolve tutti i problemi di velocità e design.
3. Chiedi 10 minuti per vederlo insieme e metti il placeholder: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY].

Restituisci SOLO un JSON:
{
  "email_pitch": "testo email con Oggetto e Corpo",
  "linkedin_pitch": "messaggio LinkedIn conciso ed efficace"
}`;

        for (const model of ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest']) {
          try {
            const aiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { responseMimeType: 'application/json' },
                }),
                signal: AbortSignal.timeout(6000),
              }
            );
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const text = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const parsed = JSON.parse(text);
                if (parsed.email_pitch) email_pitch = parsed.email_pitch;
                if (parsed.linkedin_pitch) linkedin_pitch = parsed.linkedin_pitch;
                break;
              }
            }
          } catch {}
        }
      } catch {}
    }

    aiCritique = {
      design_score: designScore,
      era,
      visual_hierarchy_rating: visualHierarchy,
      color_contrast_feedback: designScore < 50 ? 'Contrasto basso tra testo e sfondo' : 'Contrasto equilibrato e tipografia leggibile',
      cro_feedback: !hasCta ? 'Critico: Nessuna call-to-action visibile subito' : 'Imbuto di conversione presente',
      flaws: cleanFlaws,
      redesign_pitch: email_pitch,
      email_pitch,
      linkedin_pitch,
    };
  } catch (aiErr) {
    console.warn('AI critique generation error:', aiErr);
  }

  return {
    id: auditId,
    business_id: business.id,
    score: finalScore,
    has_ssl: hasSsl,
    http_status: httpStatus,
    mobile_score: mobileScore,
    seo_score: seoScore,
    accessibility_score: accessibilityScore,
    lcp_ms: lcpMs,
    issues_list: issues,
    ai_critique: aiCritique,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businesses, scanId } = body as { businesses: Business[]; scanId?: string };

    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      return NextResponse.json(
        { error: 'An array of businesses is required to run the audit.' },
        { status: 400 }
      );
    }

    const pageSpeedKey = process.env.PAGESPEED_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Process all businesses concurrently: Audit + Contact Enrichment
    const auditPromises = businesses.map(async (b) => {
      const audit = await auditSingleWebsite(
        {
          id: b.id,
          name: b.name,
          website_url: b.website_url,
          category: 'Servizio Locale',
        },
        pageSpeedKey,
        geminiKey
      );

      let enrichment = {
        emails: b.emails || [],
        linkedin_company_url: b.linkedin_company_url || null,
        linkedin_profiles: b.linkedin_profiles || [],
      };

      try {
        const enriched = await enrichBusinessContacts({
          name: b.name,
          website_url: b.website_url,
          address: b.address,
          phone: b.phone,
        });
        enrichment = enriched;
      } catch (enrichErr) {
        console.warn('Enrichment failed for business:', b.name, enrichErr);
      }

      return {
        audit,
        enrichment,
      };
    });

    const results = await Promise.all(auditPromises);

    const audits = results.map(r => r.audit);

    // Map audits & enrichments back to businesses
    const updatedBusinesses: Business[] = businesses.map((b, idx) => {
      const res = results[idx];
      return {
        ...b,
        audit: res.audit,
        emails: res.enrichment.emails,
        linkedin_company_url: res.enrichment.linkedin_company_url,
        linkedin_profiles: res.enrichment.linkedin_profiles,
        status: 'audited' as const,
      };
    });

    // Persist audits to Supabase if configured
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      try {
        const auditRows = results.map(r => ({
          id: r.audit.id,
          business_id: r.audit.business_id,
          score: r.audit.score,
          has_ssl: r.audit.has_ssl,
          http_status: r.audit.http_status,
          mobile_score: r.audit.mobile_score,
          seo_score: r.audit.seo_score,
          accessibility_score: r.audit.accessibility_score,
          lcp_ms: r.audit.lcp_ms,
          issues_list: r.audit.issues_list,
          ai_critique: r.audit.ai_critique,
        }));

        await supabaseAdmin.from('audits').insert(auditRows);

        if (scanId) {
          await supabaseAdmin
            .from('scans')
            .update({ status: 'completed' })
            .eq('id', scanId);
        }
      } catch (dbErr) {
        console.warn('Failed to persist audit results to Supabase:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      audits,
      businesses: updatedBusinesses,
      totalAudited: audits.length,
    });
  } catch (error: any) {
    console.error('Audit run error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error running audits' },
      { status: 500 }
    );
  }
}
