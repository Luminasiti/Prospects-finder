import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Business, SearchBounds } from '@/lib/types';
import crypto from 'crypto';

// Ray-casting algorithm to test if point is inside polygon
function isPointInPolygon(lat: number, lng: number, polygon: { lat: number; lng: number }[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Calculate polygon centroid and bounding radius
function getPolygonCentroid(polygon: { lat: number; lng: number }[]) {
  let latSum = 0;
  let lngSum = 0;
  for (const p of polygon) {
    latSum += p.lat;
    lngSum += p.lng;
  }
  const center = { lat: latSum / polygon.length, lng: lngSum / polygon.length };
  let maxDist = 1000;
  for (const p of polygon) {
    const d = calculateDistance(center.lat, center.lng, p.lat, p.lng);
    if (d > maxDist) maxDist = d;
  }
  return { center, radius: Math.min(Math.round(maxDist), 50000) };
}

// Haversine distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate realistic simulated leads if API is offline or returns empty
function generateSimulatedLeads(category: string, bounds: SearchBounds): Business[] {
  let centerLat = 45.5855;
  let centerLng = 10.6500;
  let radiusMeters = 5000;

  if (bounds.type === 'radius' && bounds.center) {
    centerLat = bounds.center.lat;
    centerLng = bounds.center.lng;
    radiusMeters = bounds.radius || 3000;
  } else if (bounds.type === 'polygon' && bounds.polygon && bounds.polygon.length >= 3) {
    const calc = getPolygonCentroid(bounds.polygon);
    centerLat = calc.center.lat;
    centerLng = calc.center.lng;
    radiusMeters = calc.radius;
  }

  const categoryLabels: Record<string, { prefixes: string[]; suffixes: string[] }> = {
    plumber: {
      prefixes: ['Apex', 'Metro', 'ProFlow', 'Heritage', 'QuickFix', 'BlueStar', 'Precision', 'Eagle', 'All-City', 'Reliable', 'Express'],
      suffixes: ['Plumbing & Drain', 'Rooter Services', 'Plumbing Experts', 'Emergency Plumbers', 'Pipe & Water Co.', 'Mechanical & Plumbing']
    },
    dentist: {
      prefixes: ['SmileCraft', 'BrightWay', 'Gentle Care', 'Downtown', 'Family First', 'Modern', 'Premier', 'Apex Dental', 'Grand Avenue'],
      suffixes: ['Dental Studio', 'Family Dentistry', 'Orthodontics & Implants', 'Dental Care Center', 'Cosmetic Dentistry']
    },
    restaurant: {
      prefixes: ['The Rustic', 'Bistro', 'Bella', 'Golden', 'Corner', 'Artisan', 'Harbor', 'Chef', 'Green Garden', 'Urban'],
      suffixes: ['Kitchen & Bar', 'Trattoria', 'Grill & Lounge', 'Cafe & Bakery', 'Table', 'Diner', 'Eatery']
    },
    roofer: {
      prefixes: ['Summit', 'Apex', 'Solid Shield', 'ProGuard', 'Everest', 'Ironclad', 'Titan', 'Horizon'],
      suffixes: ['Roofing & Gutters', 'Roofing Solutions', 'Restoration Co.', 'Contractors', 'Roof Specialists']
    },
    default: {
      prefixes: ['Summit', 'Metro', 'Apex', 'Premier', 'Elite', 'Heritage', 'Prime', 'United', 'Vanguard', 'Precision', 'Pinnacle'],
      suffixes: ['Services', 'Group', 'Solutions', 'Associates', 'Specialists', 'Hub', 'Care', 'Pros', 'Works']
    }
  };

  const key = Object.keys(categoryLabels).find(k => category.toLowerCase().includes(k)) || 'default';
  const data = categoryLabels[key];

  const count = 10 + Math.floor(Math.random() * 6);
  const results: Business[] = [];

  const demoUrls = [
    'https://example.com',
    'http://httpforever.com',
    'https://wikipedia.org',
    'https://motherfuckingwebsite.com',
    'https://news.ycombinator.com',
    'http://info.cern.ch',
    'https://www.w3.org',
    'https://archive.org',
    'https://unreachable-domain-xyz-404.net',
    null,
    null
  ];

  for (let i = 0; i < count; i++) {
    const prefix = data.prefixes[i % data.prefixes.length];
    const suffix = data.suffixes[i % data.suffixes.length];
    const name = `${prefix} ${suffix}`;

    let lat = centerLat;
    let lng = centerLng;
    let found = false;
    let attempts = 0;

    while (!found && attempts < 30) {
      attempts++;
      const r = (radiusMeters * Math.sqrt(Math.random())) / 111320;
      const theta = Math.random() * 2 * Math.PI;
      const testLat = centerLat + r * Math.cos(theta);
      const testLng = centerLng + (r * Math.sin(theta)) / Math.cos((centerLat * Math.PI) / 180);

      if (bounds.type === 'polygon' && bounds.polygon && bounds.polygon.length >= 3) {
        if (isPointInPolygon(testLat, testLng, bounds.polygon)) {
          lat = testLat;
          lng = testLng;
          found = true;
        }
      } else {
        lat = testLat;
        lng = testLng;
        found = true;
      }
    }

    const assignedUrl = demoUrls[i % demoUrls.length];
    const streetNum = 100 + Math.floor(Math.random() * 899);
    const streetNames = ['Oak Ave', 'Main St', 'Broadway', 'Market St', 'Center Blvd', 'Highland Dr', 'Washington Ave'];
    const street = streetNames[i % streetNames.length];
    const phoneArea = 200 + Math.floor(Math.random() * 700);
    const phoneMid = 200 + Math.floor(Math.random() * 700);
    const phoneLast = 1000 + Math.floor(Math.random() * 8999);

    results.push({
      id: crypto.randomUUID(),
      place_id: `mock_place_${i}_${Date.now()}`,
      name,
      address: `${streetNum} ${street}`,
      phone: `(${phoneArea}) ${phoneMid}-${phoneLast}`,
      website_url: assignedUrl,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      status: 'pending_audit',
    });
  }

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, bounds } = body as { category: string; bounds: SearchBounds };

    if (!category || !bounds) {
      return NextResponse.json(
        { error: 'Category and search bounds are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    let businesses: Business[] = [];
    let dataSource = 'simulator';

    if (apiKey && apiKey.trim().length > 10) {
      try {
        let centerLat = 45.5855;
        let centerLng = 10.6500;
        let radius = 5000;

        if (bounds.type === 'radius' && bounds.center) {
          centerLat = bounds.center.lat;
          centerLng = bounds.center.lng;
          radius = bounds.radius || 3000;
        } else if (bounds.type === 'polygon' && bounds.polygon && bounds.polygon.length >= 3) {
          const calc = getPolygonCentroid(bounds.polygon);
          centerLat = calc.center.lat;
          centerLng = calc.center.lng;
          radius = calc.radius;
        }

        // Use Google Places API (New) Text Search / Nearby Search
        const newPlacesUrl = 'https://places.googleapis.com/v1/places:searchText';
        const response = await fetch(newPlacesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.location',
          },
          body: JSON.stringify({
            textQuery: `${category}`,
            maxResultCount: 15,
            locationBias: {
              circle: {
                center: { latitude: centerLat, longitude: centerLng },
                radius: Math.min(radius, 50000),
              },
            },
          }),
          signal: AbortSignal.timeout(9000),
        });

        const data = await response.json();

        if (data.places && Array.isArray(data.places) && data.places.length > 0) {
          dataSource = 'google_places';
          businesses = data.places.map((place: any) => ({
            id: crypto.randomUUID(),
            place_id: place.id,
            name: place.displayName?.text || 'Business Name',
            address: place.formattedAddress || 'Local Address',
            phone: place.nationalPhoneNumber || place.internationalPhoneNumber || 'No phone listed',
            website_url: place.websiteUri || null,
            latitude: place.location?.latitude || centerLat,
            longitude: place.location?.longitude || centerLng,
            status: 'pending_audit' as const,
          }));
        }
      } catch (googleError) {
        console.warn('Google Places API (New) query failed, falling back to simulator:', googleError);
      }
    }

    // Fallback if Google API wasn't configured or returned 0 results
    if (businesses.length === 0) {
      businesses = generateSimulatedLeads(category, bounds);
    }

    // Persist to Supabase if configured
    let scanId = crypto.randomUUID();
    const supabaseAdmin = getSupabaseAdmin();

    if (supabaseAdmin) {
      try {
        const { data: scanData, error: scanError } = await supabaseAdmin
          .from('scans')
          .insert({
            category,
            boundary_geojson: bounds,
            status: 'running',
          })
          .select('id')
          .single();

        if (!scanError && scanData) {
          scanId = scanData.id;
          const toInsert = businesses.map(b => ({
            id: b.id,
            scan_id: scanId,
            place_id: b.place_id,
            name: b.name,
            address: b.address,
            phone: b.phone,
            website_url: b.website_url,
            latitude: b.latitude,
            longitude: b.longitude,
          }));
          await supabaseAdmin.from('businesses').insert(toInsert);
        }
      } catch (dbErr) {
        console.warn('Database persistence failed, operating in memory:', dbErr);
      }
    }

    return NextResponse.json({
      scanId,
      businesses,
      dataSource,
      count: businesses.length,
    });
  } catch (error: any) {
    console.error('Lead search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing lead search' },
      { status: 500 }
    );
  }
}
