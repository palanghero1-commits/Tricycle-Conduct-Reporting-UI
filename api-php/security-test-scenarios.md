# Security Test Scenarios

These scenarios cover the access-control fixes in `api-php/index.php`.

Assume the API is running at:

```text
http://localhost:8000/index.php
```

Use a fresh test database with two TODAs, one president per TODA, one driver per TODA, and one complaint against each driver.

## 1. POST /seed requires superadmin authentication

Scenario:

1. Send `POST /seed` without an `Authorization` header.
2. Expect `401 Authentication required.`
3. Send `POST /seed` with a non-superadmin token.
4. Expect `403 You are not authorized to access this resource.`
5. Send `POST /seed` with a superadmin token.
6. Expect `200` and `{ "ok": true, "seededPassword": "Password123!" }`.

Example:

```bash
curl -i -X POST http://localhost:8000/index.php/seed
curl -i -X POST http://localhost:8000/index.php/seed -H "Authorization: Bearer $STUDENT_TOKEN"
curl -i -X POST http://localhost:8000/index.php/seed -H "Authorization: Bearer $SUPERADMIN_TOKEN"
```

## 2. Drivers cannot access other drivers' complaints

Scenario:

1. Log in as Driver A.
2. Send `GET /complaints/{complaint_for_driver_b}`.
3. Expect `403 You are not authorized to view this complaint.`
4. Send `GET /complaints/{complaint_for_driver_a}`.
5. Expect `200`.

Example:

```bash
curl -i http://localhost:8000/index.php/complaints/$COMPLAINT_B \
  -H "Authorization: Bearer $DRIVER_A_TOKEN"
curl -i http://localhost:8000/index.php/complaints/$COMPLAINT_A \
  -H "Authorization: Bearer $DRIVER_A_TOKEN"
```

## 3. TODA presidents are limited to their TODA's complaints

Scenario:

1. Log in as President A.
2. Send `GET /complaints/{complaint_for_toda_b}`.
3. Expect `403 You are not authorized to view this complaint.`
4. Send `GET /complaints`.
5. Expect only complaints for TODA A drivers.
6. Send `GET /dashboard/stats`, `GET /reports/summary`, and `GET /violations`.
7. Expect counts and rows scoped to TODA A only.

Example:

```bash
curl -i http://localhost:8000/index.php/complaints/$COMPLAINT_B \
  -H "Authorization: Bearer $PRESIDENT_A_TOKEN"
curl -s http://localhost:8000/index.php/complaints \
  -H "Authorization: Bearer $PRESIDENT_A_TOKEN"
curl -s http://localhost:8000/index.php/dashboard/stats \
  -H "Authorization: Bearer $PRESIDENT_A_TOKEN"
curl -s http://localhost:8000/index.php/reports/summary \
  -H "Authorization: Bearer $PRESIDENT_A_TOKEN"
curl -s http://localhost:8000/index.php/violations \
  -H "Authorization: Bearer $PRESIDENT_A_TOKEN"
```

## 4. TODA presidents cannot mutate other TODAs' complaints

Scenario:

1. Log in as President A.
2. Send `PATCH /complaints/{complaint_for_toda_b}/status`.
3. Expect `403 You are not authorized to view this complaint.`
4. Send `POST /complaints/{complaint_for_toda_b}/violations`.
5. Expect `403 You are not authorized to view this complaint.`
6. Repeat both requests against a complaint for TODA A.
7. Expect normal route behavior: valid status transitions and verified complaints may be updated; invalid transitions still return `400`.

Example:

```bash
curl -i -X PATCH http://localhost:8000/index.php/complaints/$COMPLAINT_B/status \
  -H "Authorization: Bearer $PRESIDENT_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"RECEIVED\"}"

curl -i -X POST http://localhost:8000/index.php/complaints/$COMPLAINT_B/violations \
  -H "Authorization: Bearer $PRESIDENT_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"violationCategory\":\"Overcharging\",\"description\":\"Confirmed by reviewer\"}"
```

## 5. Driver account creation requires an explicit valid TODA

Scenario:

1. Log in as Authorized Personnel or Superadmin.
2. Send `POST /drivers/accounts` without `todaId`.
3. Expect `400 todaId is required.`
4. Send the same request with a nonexistent or inactive `todaId`.
5. Expect `400 A valid active TODA is required.`
6. Send the request with an active `todaId`.
7. Expect `201`.
8. Log in as a TODA president assigned to TODA A.
9. Send `POST /drivers/accounts` without `todaId`.
10. Expect `201`, and the created driver should be assigned to TODA A.

Example:

```bash
curl -i -X POST http://localhost:8000/index.php/drivers/accounts \
  -H "Authorization: Bearer $AUTHORIZED_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"No TODA Driver\",\"driverCode\":\"DRV-MISSING-TODA\",\"tricycleIdentifier\":\"TRI-MISSING-TODA\",\"password\":\"Password123!\"}"

curl -i -X POST http://localhost:8000/index.php/drivers/accounts \
  -H "Authorization: Bearer $AUTHORIZED_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Valid Driver\",\"driverCode\":\"DRV-VALID-TODA\",\"tricycleIdentifier\":\"TRI-VALID-TODA\",\"password\":\"Password123!\",\"todaId\":1}"
```
