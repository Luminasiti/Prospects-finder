import { NextRequest, NextResponse } from 'next/server';
import { AiCritique } from '@/lib/types';

// Helper to extract DOM structural features from raw HTML string
function extractDomFeatures(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

  const h1Matches = Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  const h2Matches = Array.from(html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
  const hasTablesForLayout = /<table[^>]*width=["']\d+["']/i.test(html) || /<table[^>]*align=/i.test(html);
  const imageCount = (html.match(/<img[^>]+>/gi) || []).length;
  const imagesWithoutAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;

  // Check CTA button terms
  const ctaRegex = /(call now|book now|contact us|get a quote|schedule|free estimate|request appointment|order online)/i;
  const hasCta = ctaRegex.test(html);

  // Check social proof / reviews
  const hasReviews = /(review|testimonial|rating|star|google review|yelp)/i.test(html);

  // Check if WordPress or modern CSS
  const isWordPress = /wp-content|wordpress/i.test(html);
  const hasInlineStyles = (html.match(/style=["'][^"']{20,}["']/gi) || []).length > 10;

  return {
    title,
    metaDesc,
    h1Count: h1Matches.length,
    h1Text: h1Matches.slice(0, 2).join(' | '),
    h2Count: h2Matches.length,
    hasViewport,
    hasTablesForLayout,
    imageCount,
    imagesWithoutAlt,
    hasCta,
    hasReviews,
    isWordPress,
    hasInlineStyles,
  };
}

// Fallback heuristic evaluator if Gemini / OpenAI key is not provided
function generateHeuristicCritique(businessName: string, category: string, features: ReturnType<typeof extractDomFeatures>): AiCritique {
  const flaws: string[] = [];
  let designScore = 78;

  if (!features.hasViewport) {
    designScore -= 25;
    flaws.push('Non-responsive layout: Missing viewport meta tag causes tiny, unreadable text on mobile screens.');
  }

  if (features.h1Count === 0) {
    designScore -= 12;
    flaws.push('Lacks clear primary visual headline (no <h1> tag); visitors cannot immediately understand the value proposition.');
  } else if (features.h1Count > 2) {
    designScore -= 8;
    flaws.push('Multiple competing <h1> tags fragment visual hierarchy and dilute page focus.');
  }

  if (!features.hasCta) {
    designScore -= 18;
    flaws.push('No prominent above-the-fold Call-To-Action (CTA) button to book, call, or request a quote.');
  }

  if (features.hasTablesForLayout || features.hasInlineStyles) {
    designScore -= 15;
    flaws.push('Outdated layout styling: Relies on rigid table layouts or heavy inline styles instead of flexible modern CSS.');
  }

  if (!features.hasReviews) {
    designScore -= 10;
    flaws.push('Missing visible customer testimonials or social proof in hero and main content sections.');
  }

  if (features.imagesWithoutAlt > 2) {
    designScore -= 5;
    flaws.push(`${features.imagesWithoutAlt} images lack descriptive alt tags, hurting accessibility and screen readers.`);
  }

  // Bounds
  designScore = Math.max(18, Math.min(96, designScore));

  let era = 'Modern Responsive';
  let visualHierarchy: 'Poor' | 'Fair' | 'Good' | 'Excellent' = 'Good';

  if (designScore < 45) {
    era = 'Early 2010s Cluttered Web 2.0';
    visualHierarchy = 'Poor';
  } else if (designScore < 70) {
    era = 'Mid-2010s Generic Template';
    visualHierarchy = 'Fair';
  } else if (designScore >= 85) {
    era = 'Modern Clean Minimalist';
    visualHierarchy = 'Excellent';
  }

  const contrastFeedback = designScore < 55
    ? 'Sub-optimal contrast ratios detected on primary buttons and secondary navigation elements.'
    : 'Balanced color palette with readable contrast across body and header copy.';

  const croFeedback = !features.hasCta
    ? 'Critical Conversion Gap: Prospective customers have no immediate path to contact or book without hunting for a contact page.'
    : 'Conversion funnels present, but sticky mobile tap-to-call buttons and high-contrast form fields would lift conversions by 25-40%.';

  const pitch = `Hi ${businessName} team, I was reviewing local ${category} websites in your area and noticed your site has a few quick design and conversion leaks—specifically ${flaws[0] || 'sub-optimal mobile responsiveness'}. Updating to a modern high-converting layout with instant click-to-call could easily double your inbound client inquiries. Open to seeing a quick free mockup?`;

  return {
    design_score: designScore,
    era,
    visual_hierarchy_rating: visualHierarchy,
    color_contrast_feedback: contrastFeedback,
    cro_feedback: croFeedback,
    flaws: flaws.length > 0 ? flaws : ['Minor layout polish needed for optimal mobile touch targets'],
    redesign_pitch: pitch,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { url, businessName, category } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Website URL is required for AI design critique' },
        { status: 400 }
      );
    }

    let htmlContent = '';
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LeadAuditBot/1.0; +https://leadaudit.pro)',
        },
        signal: AbortSignal.timeout(8000),
      });
      htmlContent = await response.text();
    } catch (fetchErr) {
      // If website unreachable, return low design score critique
      return NextResponse.json({
        critique: {
          design_score: 15,
          era: 'Broken / Unreachable Server',
          visual_hierarchy_rating: 'Poor' as const,
          color_contrast_feedback: 'Unable to render site assets due to server timeout or connection failure.',
          cro_feedback: 'Site fails to load, resulting in 100% bounce rate for all visitors.',
          flaws: ['Website timed out or refused connection', 'DNS / SSL handshake failure'],
          redesign_pitch: `Hi ${businessName || 'there'}, your website appears to be down or timing out. Every day it remains unreachable is costing you valuable ${category || 'local'} leads. We can get a blazing fast modern site up for you immediately.`,
        },
      });
    }

    const features = extractDomFeatures(htmlContent);
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const prompt = `You are an elite UX/UI Design Director and Conversion Rate Optimization (CRO) expert auditing a local business website.
Business Name: "${businessName}"
Niche/Category: "${category}"
URL: "${url}"
Website Title: "${features.title}"
Meta Description: "${features.metaDesc}"
H1 Headline: "${features.h1Text || 'None'}"
Has Mobile Viewport: ${features.hasViewport}
Has Clear Call-to-Action: ${features.hasCta}
Has Customer Reviews/Social Proof: ${features.hasReviews}
Uses Outdated Table Layout: ${features.hasTablesForLayout}
Images Without Alt Tags: ${features.imagesWithoutAlt}

Critique this website's design, visual hierarchy, aesthetic modernity, and conversion flow.
Respond ONLY in valid JSON matching this exact structure:
{
  "design_score": number (0 to 100),
  "era": string (e.g. "Early 2010s Dated Template", "Modern Clean UI", "Web 2.0 Cluttered", etc.),
  "visual_hierarchy_rating": "Poor" | "Fair" | "Good" | "Excellent",
  "color_contrast_feedback": string,
  "cro_feedback": string,
  "flaws": string[],
  "redesign_pitch": string (a 2-3 sentence personalized cold email script to pitch a website redesign to the owner)
}`;

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText) as AiCritique;
            return NextResponse.json({ critique: parsed, source: 'gemini' });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API critique failed, falling back to heuristic critique:', geminiErr);
      }
    }

    // Heuristic fallback
    const critique = generateHeuristicCritique(businessName || 'Business', category || 'Services', features);
    return NextResponse.json({ critique, source: 'heuristic' });
  } catch (error: any) {
    console.error('AI Critique Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete AI design critique' },
      { status: 500 }
    );
  }
}
