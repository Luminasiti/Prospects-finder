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

function generateItalianPitches(businessName: string, category: string, flaws: string[]) {
  const mainFlaw = flaws[0] || 'lentezza nei caricamenti da smartphone e grafica non ottimizzata per i dispositivi mobili';
  
  const email_pitch = `Oggetto: ${businessName}: Quel dettaglio sul vostro sito che sta allontanando i clienti

Gentile Team di ${businessName},

analizzando la presenza digitale delle migliori realtà nel settore ${category}, ho notato che il vostro attuale sito web presenta alcuni colli di bottiglia critici: nello specifico ${mainFlaw}.

Nel vostro settore, la maggior parte delle persone cerca e decide direttamente da smartphone in meno di 5 secondi: se il sito è lento, datato o difficile da navigare, gli utenti escono immediatamente e contattano il concorrente più vicino.

Per questo motivo, per dimostrarvi concretamente cosa è possibile fare, abbiamo GIÀ realizzato un prototipo moderno del nuovo sito web per ${businessName}. È ultra-veloce (caricamento sotto il secondo), sicuro, curato in ogni dettaglio grafico e progettato appositamente per trasformare i visitatori in clienti e prenotazioni dirette.

Avreste 10 minuti questa settimana per dare un'occhiata all'anteprima che abbiamo creato per voi?

Potete scegliere comodamente data e ora per una breve videochiamata senza impegno qui:
[LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

Un cordiale saluto,
Il Team di Luminasiti`;

  const linkedin_pitch = `Buongiorno [Nome],

visitando il sito di ${businessName} ho notato che alcuni aspetti tecnici—in particolare ${mainFlaw}—stanno rallentando l'acquisizione di nuovi contatti per il vostro settore ${category}.

Abbiamo preso l'iniziativa: abbiamo GIÀ creato un'anteprima/prototipo del vostro nuovo sito web, moderno, ultra-veloce e progettato appositamente per risolvere ogni problema di design e velocità.

Avreste 10 minuti questa settimana per vederlo insieme senza alcun impegno?
Potete fissare un momento comodo qui: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

Un saluto cordiale!`;

  return { email_pitch, linkedin_pitch };
}

function generateHeuristicCritique(
  businessName: string,
  category: string,
  features: ReturnType<typeof extractDomFeatures>
): AiCritique {
  let designScore = 80;
  const flaws: string[] = [];

  if (!features.hasViewport) {
    designScore -= 25;
    flaws.push('Manca la viewport mobile (il sito non è responsive su smartphone).');
  }

  if (features.h1Count === 0) {
    designScore -= 10;
    flaws.push('Manca un titolo principale <h1> chiaro per spiegare subito la proposta di valore.');
  } else if (features.h1Count > 2) {
    designScore -= 8;
    flaws.push('Troppi tag <h1> in conflitto che frammentano la gerarchia visiva.');
  }

  if (!features.hasCta) {
    designScore -= 18;
    flaws.push('Assenza di pulsanti Call-To-Action (CTA) evidenti per chiamare o prenotare al volo.');
  }

  if (features.hasTablesForLayout || features.hasInlineStyles) {
    designScore -= 15;
    flaws.push('Layout datato con stili rigidi invece del moderno CSS flessibile e responsive.');
  }

  if (!features.hasReviews) {
    designScore -= 10;
    flaws.push('Mancanza di recensioni visibili o riprova sociale nella sezione principale.');
  }

  if (features.imagesWithoutAlt > 2) {
    designScore -= 5;
    flaws.push(`${features.imagesWithoutAlt} immagini senza attributo alt, penalizzando accessibilità e SEO.`);
  }

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
    ? 'Contrasto cromatico insufficiente tra testo e sfondo su pulsanti e navigazione.'
    : 'Palette colori bilanciata con leggibilità ottimale dei testi.';

  const croFeedback = !features.hasCta
    ? 'Falla Critica di Conversione: I visitatori non trovano un pulsante rapido per prenotare o chiamare.'
    : 'Percorso di conversione presente ma migliorabile con pulsante sticky per smartphone.';

  const cleanFlaws = flaws.length > 0 ? flaws : ['Necessita di ottimizzazioni per la navigazione da smartphone'];
  const { email_pitch, linkedin_pitch } = generateItalianPitches(businessName, category, cleanFlaws);

  return {
    design_score: designScore,
    era,
    visual_hierarchy_rating: visualHierarchy,
    color_contrast_feedback: contrastFeedback,
    cro_feedback: croFeedback,
    flaws: cleanFlaws,
    redesign_pitch: email_pitch,
    email_pitch,
    linkedin_pitch,
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
      // If website unreachable, return low design score critique in Italian
      const { email_pitch, linkedin_pitch } = generateItalianPitches(businessName || 'Business', category || 'Servizi', ['Sito web irraggiungibile o server in timeout continuo']);
      return NextResponse.json({
        critique: {
          design_score: 15,
          era: 'Broken / Unreachable Server',
          visual_hierarchy_rating: 'Poor' as const,
          color_contrast_feedback: 'Impossibile visualizzare le risorse a causa del blocco del server.',
          cro_feedback: 'Il sito non risponde, causando una perdita del 100% dei visitatori.',
          flaws: ['Sito web offline o tempo di caricamento superiore a 10s', 'Mancata risposta server'],
          redesign_pitch: email_pitch,
          email_pitch,
          linkedin_pitch,
        },
      });
    }

    const features = extractDomFeatures(htmlContent);
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const prompt = `Sei un copywriter di livello mondiale e Design Director B2B specializzato in riprogettazione siti web.
Genera una valutazione UX e DUE pitch di outreach ad altissima conversione in LINGUA ITALIANA per questo prospect:
- Nome Azienda: "${businessName}"
- Settore/Niche: "${category}"
- URL: "${url}"
- Titolo Pagina: "${features.title}"
- Descrizione: "${features.metaDesc}"
- Titolo H1: "${features.h1Text || 'Nessuno'}"
- Mobile Viewport: ${features.hasViewport}
- Call to Action presente: ${features.hasCta}
- Recensioni visibili: ${features.hasReviews}

REQUISITI TASSATIVI PER I PITCH:
1. Punti deboli specifici: spiega l'impatto negativo reale sul loro business (es. clienti o pazienti persi a favore dei concorrenti per colpa di lentezza, sito datato o mancata ottimizzazione mobile).
2. Dichiara chiaramente che abbiamo GIÀ sviluppato un prototipo/anteprima del nuovo sito web moderno, ultra-veloce e mobile-first che risolve ogni problema di design e velocità.
3. Chiedi se hanno 10 minuti per dare un'occhiata insieme e inserisci il placeholder del link di prenotazione: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY].
4. Scrivi in un italiano perfetto, intrigante, persuasivo e professionale.

Restituisci SOLO un JSON valido con questa struttura:
{
  "design_score": number (0-100),
  "era": string (es. "Early 2010s Cluttered", "Modern Clean UI", ecc.),
  "visual_hierarchy_rating": "Poor" | "Fair" | "Good" | "Excellent",
  "color_contrast_feedback": string (in italiano),
  "cro_feedback": string (in italiano),
  "flaws": string[] (in italiano),
  "email_pitch": string (testo completo email con Oggetto e Corpo ben impaginato),
  "linkedin_pitch": string (messaggio LinkedIn diretto, intrigante e professionale),
  "redesign_pitch": string (uguale a email_pitch)
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
                signal: AbortSignal.timeout(9000),
              }
            );

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                const parsed = JSON.parse(rawText) as AiCritique;
                if (!parsed.redesign_pitch && parsed.email_pitch) {
                  parsed.redesign_pitch = parsed.email_pitch;
                }
                return NextResponse.json({ critique: parsed, source: `gemini-${model}` });
              }
            }
          } catch (modelErr) {
            // Try next model
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API critique failed, falling back to heuristic critique:', geminiErr);
      }
    }

    // Heuristic fallback in Italian
    const critique = generateHeuristicCritique(businessName || 'Business', category || 'Servizi', features);
    return NextResponse.json({ critique, source: 'heuristic' });
  } catch (error: any) {
    console.error('AI Critique Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete AI design critique' },
      { status: 500 }
    );
  }
}
