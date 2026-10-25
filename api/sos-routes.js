export function registerSosRoutes(app, deps) {
  const { auth, rolesOnly, q, one, uuid, body, error, audit, notifyOfficers, placeholders, todaRouteAreaSql, validUuid, sosCoordinates, enabled } = deps;

  app.post("/sos/devices", auth, rolesOnly("STUDENT"), async (req, res, next) => {
    try {
      if (!enabled()) error(503, "Emergency SOS is not enabled by the system administrator yet.");
      const data = body(req);
      if (!validUuid(data.deviceId)) error(400, "A valid Android device registration ID is required.");
      const student = await one("SELECT student_id AS \"studentId\" FROM students WHERE user_id=$1", [req.user.id]);
      if (!student?.studentId) error(409, "This account has no verified student ID to register for SOS.");
      const existing = await one("SELECT user_id AS \"userId\" FROM sos_devices WHERE id=$1", [data.deviceId]);
      if (existing && existing.userId !== req.user.id) error(409, "This phone is registered to another account. Contact an administrator to change its registration.");
      await q("INSERT INTO sos_devices (id,user_id,device_label,registered_at,last_seen_at,revoked_at) VALUES ($1,$2,$3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,NULL) ON CONFLICT (id) DO UPDATE SET device_label=EXCLUDED.device_label,last_seen_at=CURRENT_TIMESTAMP,revoked_at=NULL WHERE sos_devices.user_id=EXCLUDED.user_id", [data.deviceId, req.user.id, String(data.deviceLabel || "Android phone").slice(0, 120)]);
      await audit(req.user.id, "SOS_DEVICE_REGISTERED", "sos_devices", data.deviceId);
      res.json({ deviceId: data.deviceId, userId: req.user.id, studentId: student.studentId, fullName: req.user.full_name, contactNumber: req.user.contact_number || "", registeredAt: new Date().toISOString() });
    } catch (e) { next(e); }
  });

  app.delete("/sos/devices/:deviceId", auth, rolesOnly("STUDENT"), async (req, res, next) => {
    try {
      if (!enabled()) error(503, "Emergency SOS is not enabled by the system administrator yet.");
      if (!validUuid(req.params.deviceId)) error(400, "The SOS device ID is invalid.");
      const updated = await q("UPDATE sos_devices SET revoked_at=CURRENT_TIMESTAMP WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING id", [req.params.deviceId, req.user.id]);
      if (!updated.length) error(404, "Registered SOS phone not found.");
      await audit(req.user.id, "SOS_DEVICE_REVOKED", "sos_devices", req.params.deviceId);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.post("/sos", auth, rolesOnly("STUDENT"), async (req, res, next) => {
    try {
      if (!enabled()) error(503, "Emergency SOS is not enabled by the system administrator yet.");
      const data = body(req);
      if (!validUuid(data.clientAlertId)) error(400, "A unique SOS alert ID is required.");
      const { latitude, longitude, accuracy } = sosCoordinates(data);
      const existing = await one("SELECT id,status,source,delivery_status AS \"deliveryStatus\",started_at AS \"startedAt\" FROM sos_alerts WHERE student_user_id=$1 AND client_alert_id=$2", [req.user.id, data.clientAlertId]);
      if (existing) return res.status(200).json({ alert: existing, duplicate: true });
      if (await one("SELECT id FROM sos_alerts WHERE student_user_id=$1 AND status='ACTIVE' LIMIT 1", [req.user.id])) error(409, "You already have an active SOS alert.");
      let deviceId = null;
      if (data.deviceId) {
        if (!validUuid(data.deviceId)) error(400, "The registered SOS phone ID is invalid.");
        const device = await one("SELECT id FROM sos_devices WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL", [data.deviceId, req.user.id]);
        if (!device) error(403, "This phone is not registered to your student account. Register it while online first.");
        deviceId = device.id;
      }
      const driverId = data.driverId === undefined || data.driverId === null || data.driverId === "" ? null : Number(data.driverId);
      if (driverId !== null && (!Number.isInteger(driverId) || !(await one("SELECT id FROM drivers WHERE id=$1 AND is_active=1", [driverId])))) error(400, "The selected driver is not available.");
      const id = uuid();
      await q("INSERT INTO sos_alerts (id,client_alert_id,student_user_id,device_id,driver_id,status,source,delivery_status,latitude,longitude,location_accuracy_meters,started_at,last_seen_at,received_at) VALUES ($1,$2,$3,$4,$5,'ACTIVE','ONLINE','DELIVERED',$6,$7,$8,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)", [id, data.clientAlertId, req.user.id, deviceId, driverId, latitude, longitude, accuracy]);
      const alert = await one("SELECT s.id,s.status,s.source,s.delivery_status AS \"deliveryStatus\",s.latitude,s.longitude,s.location_accuracy_meters AS \"locationAccuracyMeters\",s.started_at AS \"startedAt\",u.full_name AS \"studentName\",st.student_id AS \"studentId\",u.contact_number AS \"contactNumber\",d.full_name AS \"driverName\",d.driver_code AS \"driverCode\",d.plate_number AS \"plateNumber\",d.tricycle_identifier AS \"tricycleIdentifier\" FROM sos_alerts s JOIN users u ON u.id=s.student_user_id LEFT JOIN students st ON st.user_id=u.id LEFT JOIN drivers d ON d.id=s.driver_id WHERE s.id=$1", [id]);
      await audit(req.user.id, "SOS_STARTED", "sos_alerts", id, { clientAlertId: data.clientAlertId, hasLocation: latitude !== null, source: "ONLINE" });
      await notifyOfficers("EMERGENCY_SOS", `Emergency SOS from ${req.user.full_name}${alert.studentId ? ` (${alert.studentId})` : ""}.`, null);
      res.status(201).json({ alert });
    } catch (e) { next(e); }
  });

  app.post("/sos/offline-sync", auth, rolesOnly("STUDENT"), async (req, res, next) => {
    try {
      if (!enabled()) error(503, "Emergency SOS is not enabled by the system administrator yet.");
      const data = body(req);
      if (!validUuid(data.clientAlertId) || !validUuid(data.deviceId)) error(400, "A registered phone and unique alert ID are required.");
      if (data.smsConfirmed !== true) error(400, "Confirm that you sent the prepared SOS text before reporting this delayed alert.");
      const device = await one("SELECT id FROM sos_devices WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL", [data.deviceId, req.user.id]);
      if (!device) error(403, "This phone is not registered to your student account.");
      const existing = await one("SELECT id,status,source,delivery_status AS \"deliveryStatus\",started_at AS \"startedAt\" FROM sos_alerts WHERE student_user_id=$1 AND client_alert_id=$2", [req.user.id, data.clientAlertId]);
      if (existing) return res.status(200).json({ alert: existing, duplicate: true });
      if (await one("SELECT id FROM sos_alerts WHERE student_user_id=$1 AND status='ACTIVE' LIMIT 1", [req.user.id])) error(409, "You already have an active SOS alert.");
      const { latitude, longitude, accuracy } = sosCoordinates(data);
      const driverId = data.driverId === undefined || data.driverId === null || data.driverId === "" ? null : Number(data.driverId);
      if (driverId !== null && (!Number.isInteger(driverId) || !(await one("SELECT id FROM drivers WHERE id=$1 AND is_active=1", [driverId])))) error(400, "The selected driver is not available.");
      const parsedTime = Date.parse(String(data.createdAt || ""));
      const startedAt = Number.isFinite(parsedTime) && parsedTime <= Date.now() + 60_000 ? new Date(parsedTime).toISOString() : new Date().toISOString();
      const id = uuid();
      await q("INSERT INTO sos_alerts (id,client_alert_id,student_user_id,device_id,driver_id,status,source,delivery_status,latitude,longitude,location_accuracy_meters,started_at,last_seen_at,received_at) VALUES ($1,$2,$3,$4,$5,'ACTIVE','OFFLINE_SMS_REPORTED','DELAYED_REPORTED',$6,$7,$8,$9,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)", [id, data.clientAlertId, req.user.id, device.id, driverId, latitude, longitude, accuracy, startedAt]);
      const alert = await one("SELECT s.id,s.status,s.source,s.delivery_status AS \"deliveryStatus\",s.latitude,s.longitude,s.location_accuracy_meters AS \"locationAccuracyMeters\",s.started_at AS \"startedAt\",s.received_at AS \"receivedAt\",u.full_name AS \"studentName\",st.student_id AS \"studentId\",u.contact_number AS \"contactNumber\",d.full_name AS \"driverName\",d.tricycle_identifier AS \"tricycleIdentifier\" FROM sos_alerts s JOIN users u ON u.id=s.student_user_id LEFT JOIN students st ON st.user_id=u.id LEFT JOIN drivers d ON d.id=s.driver_id WHERE s.id=$1", [id]);
      await audit(req.user.id, "SOS_OFFLINE_REPORTED", "sos_alerts", id, { clientAlertId: data.clientAlertId, hasLocation: latitude !== null });
      await notifyOfficers("EMERGENCY_SOS_DELAYED", `Delayed SOS report from ${req.user.full_name}. The student reports that an offline SMS was sent.`, null);
      res.status(201).json({ alert });
    } catch (e) { next(e); }
  });

  app.get("/sos/active", auth, rolesOnly("TODA_PRESIDENT", "AUTHORIZED_PERSONNEL", "SUPERADMIN", "PNP"), async (req, res, next) => {
    try {
      if (!enabled()) error(503, "Emergency SOS is not enabled by the system administrator yet.");
      let scope = "";
      let params = [];
      if (req.user.role === "TODA_PRESIDENT") {
        const ids = await q("SELECT id FROM todas WHERE president_user_id=$1 AND is_active=1 ORDER BY id", [req.user.id]);
        const todaIds = ids.map((item) => item.id);
        if (!todaIds.length) return res.json({ alerts: [] });
        scope = ` AND d.toda_id IN (${placeholders(todaIds)})`;
        params = todaIds;
      }
      const alerts = await q(`SELECT s.id,s.status,s.source,s.delivery_status AS "deliveryStatus",s.latitude,s.longitude,s.location_accuracy_meters AS "locationAccuracyMeters",s.started_at AS "startedAt",s.last_seen_at AS "lastSeenAt",s.received_at AS "receivedAt",s.acknowledged_at AS "acknowledgedAt",s.acknowledged_by AS "acknowledgedBy",u.full_name AS "studentName",st.student_id AS "studentId",u.contact_number AS "studentContactNumber",d.full_name AS "driverName",d.driver_code AS "driverCode",d.plate_number AS "plateNumber",d.tricycle_identifier AS "tricycleIdentifier",t.name AS "todaName",${todaRouteAreaSql("t")} AS "routeArea",d.contact_number AS "driverContactNumber" FROM sos_alerts s JOIN users u ON u.id=s.student_user_id LEFT JOIN students st ON st.user_id=u.id LEFT JOIN drivers d ON d.id=s.driver_id LEFT JOIN todas t ON t.id=d.toda_id WHERE s.status='ACTIVE'${scope} ORDER BY s.started_at ASC`, params);
      res.json({ alerts });
    } catch (e) { next(e); }
  });

  app.get("/sos/mine", auth, rolesOnly("STUDENT"), async (req, res, next) => {
    try {
      if (!enabled()) error(503, "Emergency SOS is not enabled by the system administrator yet.");
      const alert = await one("SELECT id,status,source,delivery_status AS \"deliveryStatus\",started_at AS \"startedAt\" FROM sos_alerts WHERE student_user_id=$1 AND status='ACTIVE' ORDER BY started_at DESC LIMIT 1", [req.user.id]);
      res.json({ alert: alert || null });
    } catch (e) { next(e); }
  });

  app.patch("/sos/:id/location", auth, rolesOnly("STUDENT"), async (req, res, next) => {
    try {
      if (!enabled()) error(503, "Emergency SOS is not enabled by the system administrator yet.");
      const { latitude, longitude, accuracy } = sosCoordinates(body(req));
      if (latitude === null) error(400, "A current location is required for a location update.");
      const updated = await q("UPDATE sos_alerts SET latitude=$1,longitude=$2,location_accuracy_meters=$3,last_seen_at=CURRENT_TIMESTAMP WHERE id=$4 AND student_user_id=$5 AND status='ACTIVE' RETURNING id", [latitude, longitude, accuracy, req.params.id, req.user.id]);
      if (!updated.length) error(404, "Active SOS alert not found.");
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.post("/sos/:id/acknowledge", auth, rolesOnly("TODA_PRESIDENT", "AUTHORIZED_PERSONNEL", "SUPERADMIN", "PNP"), async (req, res, next) => {
    try {
      if (!enabled()) error(503, "Emergency SOS is not enabled by the system administrator yet.");
      if (req.user.role === "TODA_PRESIDENT" && !await one("SELECT s.id FROM sos_alerts s JOIN drivers d ON d.id=s.driver_id JOIN todas t ON t.id=d.toda_id WHERE s.id=$1 AND t.president_user_id=$2 AND t.is_active=1", [req.params.id, req.user.id])) error(404, "Active SOS alert not found.");
      const updated = await q("UPDATE sos_alerts SET acknowledged_at=COALESCE(acknowledged_at,CURRENT_TIMESTAMP),acknowledged_by=COALESCE(acknowledged_by,$1) WHERE id=$2 AND status='ACTIVE' RETURNING acknowledged_at AS \"acknowledgedAt\"", [req.user.id, req.params.id]);
      if (!updated.length) error(404, "Active SOS alert not found.");
      await audit(req.user.id, "SOS_ACKNOWLEDGED", "sos_alerts", req.params.id);
      res.json({ ok: true, acknowledgedAt: updated[0].acknowledgedAt });
    } catch (e) { next(e); }
  });

  app.post("/sos/:id/:action", auth, async (req, res, next) => {
    try {
      if (!enabled()) error(503, "Emergency SOS is not enabled by the system administrator yet.");
      const action = req.params.action;
      if (!["resolve", "cancel"].includes(action)) error(404, "SOS action not found.");
      if (action === "resolve" && !["TODA_PRESIDENT", "AUTHORIZED_PERSONNEL", "SUPERADMIN", "PNP"].includes(req.user.role)) error(403, "You are not authorized to resolve SOS alerts.");
      if (action === "cancel" && req.user.role !== "STUDENT") error(403, "Only a student may cancel an SOS alert.");
      if (action === "resolve" && req.user.role === "TODA_PRESIDENT" && !await one("SELECT s.id FROM sos_alerts s JOIN drivers d ON d.id=s.driver_id JOIN todas t ON t.id=d.toda_id WHERE s.id=$1 AND t.president_user_id=$2 AND t.is_active=1", [req.params.id, req.user.id])) error(404, "Active SOS alert not found.");
      const status = action === "resolve" ? "RESOLVED" : "CANCELLED";
      const sql = action === "resolve"
        ? "UPDATE sos_alerts SET status=$1,resolved_at=CURRENT_TIMESTAMP,resolved_by=$2 WHERE id=$3 AND status='ACTIVE' RETURNING id"
        : "UPDATE sos_alerts SET status=$1,resolved_at=CURRENT_TIMESTAMP,resolved_by=$2 WHERE id=$3 AND student_user_id=$4 AND status='ACTIVE' RETURNING id";
      const params = action === "resolve" ? [status, req.user.id, req.params.id] : [status, req.user.id, req.params.id, req.user.id];
      const updated = await q(sql, params);
      if (!updated.length) error(404, "Active SOS alert not found.");
      await audit(req.user.id, `SOS_${status}`, "sos_alerts", req.params.id);
      res.json({ ok: true, status });
    } catch (e) { next(e); }
  });
}
