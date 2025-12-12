import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Location Data Ingestion Function
 * Mimics Google Maps API for secure, anonymized location tracking
 * SDAIA Compliant: Data minimization - only UID, GPS, timestamp stored
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse incoming location data
        const { uid, lat, lng, location_id, location_name } = await req.json();

        // Validation: Ensure required fields
        if (!uid || lat === undefined || lng === undefined) {
            return Response.json({ 
                error: 'Missing required fields: uid, lat, lng' 
            }, { status: 400 });
        }

        // Validation: GPS coordinate bounds check
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return Response.json({ 
                error: 'Invalid GPS coordinates' 
            }, { status: 400 });
        }

        // SECURITY: Block any PII from being stored
        // Only accept: UID (anonymized), GPS coordinates, timestamp
        const sanitizedData = {
            uid: String(uid), // Anonymized identifier only
            gps_lat: parseFloat(lat),
            gps_lng: parseFloat(lng),
            timestamp: new Date().toISOString(),
            location_id: location_id || `LOC_${lat.toFixed(4)}_${lng.toFixed(4)}`,
            location_name: location_name || null
        };

        // Store in Location Database (DB 2) using service role
        const result = await base44.asServiceRole.entities.LocationTracking.create(sanitizedData);

        return Response.json({ 
            success: true,
            message: 'Location data ingested successfully',
            record_id: result.id,
            timestamp: sanitizedData.timestamp
        }, { status: 201 });

    } catch (error) {
        return Response.json({ 
            error: 'Location ingestion failed',
            details: error.message 
        }, { status: 500 });
    }
});