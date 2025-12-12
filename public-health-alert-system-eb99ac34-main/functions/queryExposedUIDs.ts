import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Secure Reverse Query Function
 * Hospital Admin Only - Retrieves UIDs within geofence during time window
 * SDAIA Compliant: Authority-only access, no PII exposure
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // SECURITY: Verify authenticated user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                error: 'Unauthorized - Authentication required' 
            }, { status: 401 });
        }

        // SECURITY: Verify user is hospital admin/authority
        if (user.role !== 'admin') {
            return Response.json({ 
                error: 'Forbidden - Hospital Admin access required' 
            }, { status: 403 });
        }

        // Parse query parameters
        const { 
            center_lat, 
            center_lng, 
            radius_meters, 
            time_window_start, 
            time_window_end 
        } = await req.json();

        // Validation
        if (!center_lat || !center_lng || !radius_meters || !time_window_start || !time_window_end) {
            return Response.json({ 
                error: 'Missing required parameters: center_lat, center_lng, radius_meters, time_window_start, time_window_end' 
            }, { status: 400 });
        }

        // Fetch all location records (service role for admin query)
        const allLocations = await base44.asServiceRole.entities.LocationTracking.list('-timestamp', 10000);

        // GPS Clustering/Filtering Algorithm
        // Filter 1: Time Window
        const timeFiltered = allLocations.filter(loc => {
            const locTime = new Date(loc.timestamp);
            const startTime = new Date(time_window_start);
            const endTime = new Date(time_window_end);
            return locTime >= startTime && locTime <= endTime;
        });

        // Filter 2: Geofence (Distance calculation using Haversine formula)
        const exposedLocations = timeFiltered.filter(loc => {
            const distance = calculateDistance(
                center_lat, 
                center_lng, 
                loc.gps_lat, 
                loc.gps_lng
            );
            return distance <= radius_meters;
        });

        // Extract unique UIDs (surgically precise list)
        const uniqueUIDs = [...new Set(exposedLocations.map(loc => loc.uid))];

        // SECURITY: Return only UIDs, never expose location history
        return Response.json({ 
            success: true,
            query_metadata: {
                center: { lat: center_lat, lng: center_lng },
                radius_meters: radius_meters,
                time_window: { start: time_window_start, end: time_window_end },
                total_locations_scanned: allLocations.length,
                time_filtered_count: timeFiltered.length,
                geofence_filtered_count: exposedLocations.length,
                queried_by: user.email,
                queried_at: new Date().toISOString()
            },
            exposed_uids: uniqueUIDs,
            count: uniqueUIDs.length
        });

    } catch (error) {
        return Response.json({ 
            error: 'Query execution failed',
            details: error.message 
        }, { status: 500 });
    }
});

/**
 * Haversine formula for GPS distance calculation
 * Returns distance in meters between two GPS coordinates
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}