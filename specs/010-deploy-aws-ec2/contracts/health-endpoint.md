# Contract: Application Health Endpoint

## Request

```http
GET /health HTTP/1.1
```

Authentication is not required.

## Healthy Response

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store

{"status":"ok"}
```

## Constraints

- The response MUST contain no member, club, book, vote, meeting, credential, filesystem, or environment data.
- The endpoint verifies that the web process can accept and route an HTTP request.
- Nginx forwards this path exactly as it forwards application traffic.
- Presentation markup changes MUST NOT alter this contract.
