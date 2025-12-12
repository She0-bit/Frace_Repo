import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Notification Dispatch Function
 * Sends alerts to exposed UIDs via secure integration layer
 * SDAIA Compliant: End-to-end anonymity, no location history exposure
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

        // Parse notification parameters
        const { 
            exposed_uids, 
            case_id, 
            message, 
            severity_level,
            case_type 
        } = await req.json();

        // Validation
        if (!exposed_uids || !Array.isArray(exposed_uids) || exposed_uids.length === 0) {
            return Response.json({ 
                error: 'Missing or invalid exposed_uids array' 
            }, { status: 400 });
        }

        if (!case_id || !message) {
            return Response.json({ 
                error: 'Missing required parameters: case_id, message' 
            }, { status: 400 });
        }

        const dispatchResults = [];
        const dispatchTime = new Date().toISOString();

        // Dispatch notification to each exposed UID
        for (const uid of exposed_uids) {
            try {
                // SECURITY: Create notification log without exposing location history
                // Only log: UID, message, timestamp - no GPS coordinates
                const notificationRecord = await base44.asServiceRole.entities.AlertLog.create({
                    case_id: case_id,
                    alert_type: 'user_notification',
                    target: uid,
                    target_type: 'user',
                    message: message,
                    status: 'sent',
                    case_type: case_type || 'exposure_alert',
                    severity_level: severity_level || 'medium'
                });

                // Simulate integration with national app (Sehaty/Tawakkalna API)
                // In production: await sendToNationalAppAPI(uid, message)
                
                dispatchResults.push({
                    uid: uid,
                    status: 'sent',
                    record_id: notificationRecord.id,
                    timestamp: dispatchTime
                });

            } catch (uidError) {
                dispatchResults.push({
                    uid: uid,
                    status: 'failed',
                    error: uidError.message,
                    timestamp: dispatchTime
                });
            }
        }

        // Summary statistics
        const successCount = dispatchResults.filter(r => r.status === 'sent').length;
        const failCount = dispatchResults.filter(r => r.status === 'failed').length;

        return Response.json({ 
            success: true,
            message: 'Notification dispatch completed',
            summary: {
                total_uids: exposed_uids.length,
                successful_dispatches: successCount,
                failed_dispatches: failCount,
                dispatched_by: user.email,
                dispatched_at: dispatchTime
            },
            results: dispatchResults
        });

    } catch (error) {
        return Response.json({ 
            error: 'Notification dispatch failed',
            details: error.message 
        }, { status: 500 });
    }
});