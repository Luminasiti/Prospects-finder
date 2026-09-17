import { NextRequest, NextResponse } from 'next/server';
import { Business, SavedLead } from '@/lib/types';

function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function formatStatus(status?: string): string {
  if (!status) return 'Not Contacted';
  switch (status) {
    case 'not_contacted': return 'Not Contacted';
    case 'contacted': return 'Contacted';
    case 'follow_up_needed': return 'Follow-Up Needed';
    case 'replied': return 'Replied';
    case 'meeting_booked': return 'Meeting Booked';
    case 'closed_deal': return 'Closed Deal';
    case 'lost': return 'Lost';
    default: return status;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { businesses, filename } = await req.json();

    if (!businesses || !Array.isArray(businesses)) {
      return NextResponse.json({ error: 'Businesses array is required' }, { status: 400 });
    }

    // Identify any custom field keys across all leads
    const customFieldKeysSet = new Set<string>();
    businesses.forEach((b: any) => {
      if (b.custom_fields && typeof b.custom_fields === 'object') {
        Object.keys(b.custom_fields).forEach(k => customFieldKeysSet.add(k));
      }
    });
    const customFieldKeys = Array.from(customFieldKeysSet);

    const baseHeaders = [
      'Business Name',
      'Outreach Status',
      'Follow-Up Date',
      'Phone Number',
      'Address',
      'Website URL',
      'Overall Audit Score',
      'Design Score',
      'Audit Grade',
      'Has SSL',
      'HTTP Status',
      'Mobile Score',
      'SEO Score',
      'LCP (Seconds)',
      'Detected Issues',
      'AI Design Era',
      'Notes',
      'AI Redesign Cold Pitch Script'
    ];

    const headers = [...baseHeaders, ...customFieldKeys.map(k => `Custom: ${k}`)];

    const rows = (businesses as (Business | SavedLead)[]).map(item => {
      const b = item as any;
      const audit = b.audit;
      const score = b.audit_score !== undefined ? b.audit_score : audit?.score;
      const designScore = b.design_score !== undefined ? b.design_score : audit?.ai_critique?.design_score;

      let grade = 'Not Audited';
      if (!b.website_url) {
        grade = 'Missing Website';
      } else if (score !== undefined && score !== null) {
        if (score >= 75) grade = 'Good (≥75)';
        else if (score >= 50) grade = 'Mediocre (50-74)';
        else grade = 'Needs Redesign (<50)';
      }

      const issuesString = audit?.issues_list ? audit.issues_list.join('; ') : '';
      const lcpSec = audit?.lcp_ms ? (audit.lcp_ms / 1000).toFixed(2) : '';

      const rowValues = [
        sanitizeCsvField(b.name),
        sanitizeCsvField(formatStatus(b.outreach_status)),
        sanitizeCsvField(b.follow_up_date || ''),
        sanitizeCsvField(b.phone),
        sanitizeCsvField(b.address),
        sanitizeCsvField(b.website_url || 'No Website'),
        sanitizeCsvField(score !== null && score !== undefined ? score : 'N/A'),
        sanitizeCsvField(designScore !== null && designScore !== undefined ? designScore : 'N/A'),
        sanitizeCsvField(grade),
        sanitizeCsvField(audit ? (audit.has_ssl ? 'Yes' : 'No') : 'N/A'),
        sanitizeCsvField(audit?.http_status || 'N/A'),
        sanitizeCsvField(audit?.mobile_score ?? 'N/A'),
        sanitizeCsvField(audit?.seo_score ?? 'N/A'),
        sanitizeCsvField(lcpSec ? `${lcpSec}s` : 'N/A'),
        sanitizeCsvField(issuesString),
        sanitizeCsvField(audit?.ai_critique?.era || 'N/A'),
        sanitizeCsvField(b.notes || ''),
        sanitizeCsvField(audit?.ai_critique?.redesign_pitch || 'N/A'),
      ];

      // Add custom fields
      customFieldKeys.forEach(k => {
        const val = b.custom_fields ? b.custom_fields[k] : '';
        rowValues.push(sanitizeCsvField(val || ''));
      });

      return rowValues.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename || 'prospects-crm-leads.csv'}"`,
      },
    });
  } catch (error: any) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export CSV' }, { status: 500 });
  }
}
