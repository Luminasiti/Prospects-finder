import { NextRequest, NextResponse } from 'next/server';
import { PITCH_ARGUMENTS } from '@/lib/pitchArguments';

export async function POST(req: NextRequest) {
  try {
    const { 
      businessName, 
      category, 
      websiteUrl, 
      selectedArgumentIds, 
      audit 
    } = await req.json();

    const cleanName = businessName?.trim() || 'Azienda';
    const cleanCategory = category?.trim() || 'Servizi Locali';
    const cleanUrl = websiteUrl?.trim() || 'online';

    // Map selected IDs to actual pitch arguments
    const validArgIds: string[] = Array.isArray(selectedArgumentIds) && selectedArgumentIds.length > 0
      ? selectedArgumentIds
      : ['ai_seo', 'booking_system', 'mobile_speed'];

    const chosenArguments = PITCH_ARGUMENTS.filter(arg => validArgIds.includes(arg.id));
    const argumentBullets = chosenArguments.map(a => `• ${a.label}: ${a.description}`).join('\n');

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey.trim().length > 10) {
      const prompt = `Sei un Senior Copywriter e Web Design Strategist B2B di livello mondiale, esperto nel mercato italiano.
Devi scrivere DUE script di outreach a freddo (Email e LinkedIn) altamente persuasivi, intriganti e NON generici in LINGUA ITALIANA per questo prospect:
- Nome Attività: "${cleanName}"
- Settore/Nicchia: "${cleanCategory}"
- Sito Web: "${cleanUrl}"
- Punteggio Audit Attuale: ${audit?.score ?? 'Non specificato'}/100

L'UTENTE HA SELEZIONATO SPECIFICATAMENTE QUESTI ARGOMENTI CHIAVE DA AFFRONTARE NEL MESSAGGIO:
${argumentBullets}

REQUISITI TASSATIVI DI SCRITTURA:
1. Niente frasi fatte o generiche: concentrati DIRETTAMENTE sugli argomenti selezionati sopra, spiegando in modo pratico l'impatto economico negativo per un'attività nel settore "${cleanCategory}" (es. clienti che cercano con ChatGPT e non li trovano, appuntamenti persi perché manca la prenotazione 24/7, visitatori da smartphone che escono per la lentezza, ecc.).
2. IL GANCIO FONDAMENTALE (PROTOTIPO GIÀ PRONTO): Dichiara con entusiasmo e sicurezza che per dimostrare concretamente la soluzione, abbiamo GIÀ sviluppato un prototipo funzionante del loro nuovo sito web, moderno, ultra-veloce e con questi problemi già risolti.
3. CALL TO ACTION DI 10 MINUTI: Chiedi con garbo se hanno 10 minuti questa settimana per dargli un'occhiata insieme senza impegno, e inserisci il segnaposto esatto:
[LINK PER PRENOTARE LA CHIAMATA / CALENDLY]
4. Tono: Professionale, brillante, autorevole ma caldo e rispettoso (stile agenzia digitale di alto livello).

Restituisci SOLO un JSON valido con questa struttura:
{
  "email_pitch": "Oggetto: ...\\n\\nGentile Team di ...\\n...",
  "linkedin_pitch": "Buongiorno [Nome],\\n\\n..."
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
              signal: AbortSignal.timeout(10000),
            }
          );

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);
              if (parsed.email_pitch && parsed.linkedin_pitch) {
                return NextResponse.json({
                  email_pitch: parsed.email_pitch,
                  linkedin_pitch: parsed.linkedin_pitch,
                  selectedArguments: chosenArguments.map(a => a.shortTag),
                  source: `gemini-${model}`,
                });
              }
            }
          }
        } catch (e) {
          // Try next model
        }
      }
    }

    // Heuristic Fallback in Italian if API is unavailable or rate-limited
    const heuristicPitches = generateHeuristicPitchesFromArguments(cleanName, cleanCategory, chosenArguments);
    return NextResponse.json({
      email_pitch: heuristicPitches.email_pitch,
      linkedin_pitch: heuristicPitches.linkedin_pitch,
      selectedArguments: chosenArguments.map(a => a.shortTag),
      source: 'heuristic',
    });

  } catch (error: any) {
    console.error('Error generating custom pitch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate tailored pitch' },
      { status: 500 }
    );
  }
}

function generateHeuristicPitchesFromArguments(
  businessName: string,
  category: string,
  argumentsList: typeof PITCH_ARGUMENTS
) {
  const argumentPoints = argumentsList.map(a => `- ${a.label}: ${a.description}`).join('\n');
  const mainArgumentsSummary = argumentsList.slice(0, 3).map(a => a.shortTag.toLowerCase()).join(', ');

  const email_pitch = `Oggetto: ${businessName}: Quel dettaglio sul vostro sito che vi costa clienti ogni settimana

Gentile Team di ${businessName},

analizzando la presenza digitale delle realtà nel settore ${category}, ho notato che il vostro attuale sito web (${businessName}) presenta alcuni colli di bottiglia decisivi rispetto all'evoluzione del mercato:

${argumentPoints}

Nel vostro settore, i clienti oggi si muovono rapidamente: cercano con l'intelligenza artificiale, vogliono prenotare al volo dal cellulare e se il sito è lento o poco intuitivo, passano al concorrente successivo in pochi secondi.

Per dimostrarvi concretamente cosa è possibile ottenere, abbiamo preso l'iniziativa: abbiamo GIÀ realizzato un prototipo moderno, veloce ed elegante del nuovo sito web per ${businessName}, che integra esattamente queste soluzioni.

Avreste 10 minuti questa settimana per dargli un'occhiata insieme senza alcun impegno?

Potete fissare direttamente qui un momento comodo per una breve panoramica:
[LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

Un cordiale saluto,
Il Team di Luminasiti`;

  const linkedin_pitch = `Buongiorno [Nome],

visitando il sito di ${businessName} ho notato che alcuni aspetti chiave—in particolare riguardo a ${mainArgumentsSummary}—stanno frenando la conversione di nuovi clienti per il vostro settore ${category}.

Abbiamo preso l'iniziativa: abbiamo GIÀ creato un prototipo moderno e ultra-veloce del vostro nuovo sito web che risolve tutti questi punti ed è pensato per trasformare ogni visita in un contatto diretto.

Avreste 10 minuti per vederlo insieme senza impegno?
Potete scegliere un orario comodo qui: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

A presto!`;

  return { email_pitch, linkedin_pitch };
}
