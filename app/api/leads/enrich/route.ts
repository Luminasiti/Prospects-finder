import { NextRequest, NextResponse } from 'next/server';
import { enrichBusinessContacts } from '@/lib/enrichment';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Business } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { business } = (await req.json()) as { business: Business };

    if (!business || !business.name) {
      return NextResponse.json({ error: 'Business data is required' }, { status: 400 });
    }

    const enrichment = await enrichBusinessContacts(business);

    // If Supabase admin available and lead ID provided, sync to database
    const supabase = getSupabaseAdmin();
    if (supabase && business.id) {
      try {
        await supabase
          .from('saved_leads')
          .update({
            custom_fields: {
              emails: enrichment.emails,
              linkedin_company_url: enrichment.linkedin_company_url,
              linkedin_profiles: enrichment.linkedin_profiles,
            }
          })
          .eq('business_id', business.id);
      } catch (err) {
        console.warn('Enrichment DB sync error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      ...enrichment,
    });
  } catch (error: any) {
    console.error('Enrichment route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich business contacts' },
      { status: 500 }
    );
  }
}
