# RASID API examples

All examples use synthetic data. Start the database/API and seed with the README commands first. Base URL: `http://localhost:3000/api/v1`. Interactive schemas live at `/docs`; the exported contract is [openapi.json](openapi.json).

## Sign in and save the cookie

```sh
curl -i -c /tmp/rasid-demo.cookies \
  -H 'Content-Type: application/json' \
  -d '{"email":"atif@example.test","password":"Synthetic-Demo-Only-2026!"}' \
  http://localhost:3000/api/v1/auth/login
```

The JSON includes `accessToken`, `tokenType`, `expiresIn`, `sessionId`, and `user`. The refresh secret is only in `Set-Cookie`. Set `RASID_TOKEN` locally to the returned access token. Do not commit tokens or screenshots containing them.

```sh
curl -H "Authorization: Bearer $RASID_TOKEN" http://localhost:3000/api/v1/auth/me
curl -H "Authorization: Bearer $RASID_TOKEN" 'http://localhost:3000/api/v1/accounts?limit=20&page=1'
curl -H "Authorization: Bearer $RASID_TOKEN" http://localhost:3000/api/v1/categories
```

## Create a manual account and transaction

```sh
curl -H "Authorization: Bearer $RASID_TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"حساب عرض اصطناعي","type":"CURRENT","currency":"SAR","balance":"5000.00","balanceAsOf":"2026-09-01T09:00:00+03:00"}' \
  http://localhost:3000/api/v1/accounts
```

Set `RASID_ACCOUNT_ID` to that response's `id`.

```sh
curl -H "Authorization: Bearer $RASID_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"accountId\":\"$RASID_ACCOUNT_ID\",\"postedAt\":\"2026-09-10\",\"amount\":\"42.50\",\"direction\":\"EXPENSE\",\"merchant\":\"Demo café\",\"categoryId\":\"10000000-0000-4000-8000-000000000002\",\"reference\":\"manual-demo-001\"}" \
  http://localhost:3000/api/v1/transactions

curl -H "Authorization: Bearer $RASID_TOKEN" \
  'http://localhost:3000/api/v1/transactions?from=2026-09-01&to=2026-09-30&currency=SAR&direction=EXPENSE&limit=20&page=1'

curl -H "Authorization: Bearer $RASID_TOKEN" \
  'http://localhost:3000/api/v1/analytics/monthly?month=2026-09&currency=SAR'
```

Creating that same transaction twice returns `409 DUPLICATE_TRANSACTION`. Sending `42.50` as a JSON number, a negative amount, an impossible date, or a caller-supplied `userId` returns a validation error. Using another user's account returns 404.

## Preview and commit a CSV

```sh
curl -H "Authorization: Bearer $RASID_TOKEN" \
  -F 'file=@examples/synthetic-row-errors.csv;type=text/csv' \
  "http://localhost:3000/api/v1/imports/accounts/$RASID_ACCOUNT_ID/preview"
```

Set `RASID_IMPORT_ID` to the preview `id`. Inspect `rows` and `summary`. The fixture contains one accepted row, one duplicate, and two invalid rows. A commit without acknowledgment returns 422. Only accepted rows can be committed; the client cannot replace the saved preview payload.

```sh
curl -H "Authorization: Bearer $RASID_TOKEN" -H 'Content-Type: application/json' \
  -d '{"acknowledgeRejectedRows":true}' \
  "http://localhost:3000/api/v1/imports/$RASID_IMPORT_ID/commit"
```

Repeat the same commit. Its original `result` is returned and transaction counts do not grow. A different file overlapping existing records gets its duplicates checked again at commit time.

## Refresh and log out

```sh
curl -b /tmp/rasid-demo.cookies -c /tmp/rasid-demo.cookies \
  -H 'X-RASID-Client: web' -X POST http://localhost:3000/api/v1/auth/refresh

curl -b /tmp/rasid-demo.cookies -c /tmp/rasid-demo.cookies \
  -H 'X-RASID-Client: web' -X POST http://localhost:3000/api/v1/auth/logout
```

Always use the newly rotated cookie. Replaying the old one revokes that session. Logout returns 204; a subsequent protected request using that session's access token returns 401.

## Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "messageAr": "البيانات المدخلة غير صالحة.",
    "details": [{"field":"amount","rules":["matches"]}]
  },
  "requestId": "example-request-123",
  "timestamp": "2026-09-11T00:00:00.000Z"
}
```

Every response includes `X-Request-ID`, `X-RASID-Data: demo-only`, and `Cache-Control: no-store`. Successful JSON is returned directly; there is no universal `{ success, data }` wrapper. Paginated endpoints alone use `{ data, meta }`.
