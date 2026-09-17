import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { SavedLead } from '@/lib/types';
import crypto from 'crypto';

// GET all saved leads
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ leads: [], source: 'memory' });
    }

    const { data, error } = await supabaseAdmin
      .from('saved_leads')
      .select('*')
      .order('saved_at', { ascending: false });

    if (error) {
      console.warn('Error fetching saved leads from Supabase:', error);
      return NextResponse.json({ leads: [], source: 'memory' });
    }

    const leads: SavedLead[] = (data || []).map((row: any) => ({
      id: row.id,
      business_id: row.business_id,
      name: row.name,
      phone: row.phone,
      address: row.address,
      website_url: row.website_url,
      audit_score: row.audit_score,
      design_score: row.design_score,
      outreach_status: row.outreach_status || 'not_contacted',
      list_name: row.list_name || row.custom_fields?.list_name || 'General Leads',
      follow_up_date: row.follow_up_date || null,
      notes: row.notes || '',
      custom_fields: row.custom_fields || {},
      saved_at: row.saved_at || row.created_at,
      updated_at: row.updated_at,
      audit: row.audit_data || undefined,
    }));

    return NextResponse.json({ leads, source: 'supabase' });
  } catch (error: any) {
    console.error('Failed to get saved leads:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Save or Update Lead(s)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead, leads } = body as { lead?: SavedLead; leads?: SavedLead[] };

    const itemsToSave: SavedLead[] = leads || (lead ? [lead] : []);

    if (itemsToSave.length === 0) {
      return NextResponse.json({ error: 'No lead(s) provided to save' }, { status: 400 });
    }

    const processedLeads: SavedLead[] = itemsToSave.map(l => ({
      ...l,
      id: l.id || crypto.randomUUID(),
      outreach_status: l.outreach_status || 'not_contacted',
      list_name: l.list_name || l.custom_fields?.list_name || 'General Leads',
      notes: l.notes || '',
      custom_fields: {
        ...(l.custom_fields || {}),
        list_name: l.list_name || l.custom_fields?.list_name || 'General Leads',
      },
      saved_at: l.saved_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      try {
        const rows = processedLeads.map(l => ({
          id: l.id,
          business_id: l.business_id,
          name: l.name,
          phone: l.phone,
          address: l.address,
          website_url: l.website_url,
          audit_score: l.audit_score,
          design_score: l.design_score,
          outreach_status: l.outreach_status,
          follow_up_date: l.follow_up_date || null,
          notes: l.notes,
          custom_fields: l.custom_fields,
          audit_data: l.audit || null,
          updated_at: new Date().toISOString(),
        }));

        await supabaseAdmin.from('saved_leads').upsert(rows, { onConflict: 'id' });
      } catch (dbErr) {
        console.warn('Failed to upsert saved leads to Supabase:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      savedCount: processedLeads.length,
      leads: processedLeads,
    });
  } catch (error: any) {
    console.error('Failed to save leads:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a saved lead
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      await supabaseAdmin.from('saved_leads').delete().eq('id', id);
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete saved lead:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
