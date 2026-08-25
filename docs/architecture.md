# Architecture

## Design goal

Model the official C# client ([`datalust/seq-api`](https://github.com/datalust/seq-api)) but keep
the surface small, typed, and dependency-free. Only the read operations an application actually
needs are implemented.

## Endpoint strategy

Seq's API surface can vary between versions. The client therefore:

1. Builds requests against **hardcoded, verified paths** (`api/events`, `api/events/signal`,
   `api/signals`, `api/sqlqueries`, `api/data`).
2. **Discovers and validates** the API at runtime: `discover()` fetches the root resource
   (`api/`) and the four resource-group documents (`api/{events,signals,sqlqueries,data}/resources`),
   checking that the links the client relies on are present. A server that omits a required link
   produces a clear "unsupported Seq version" error rather than obscure failures.

The discovery results are cached on the `SeqClient` instance.

## Request layer

- `fetch()`-based, no HTTP dependency.
- Headers: `Accept: application/vnd.datalust.seq.v14+json` (the versioned media type the C# client
  sends) and `X-Seq-ApiKey` when an API key is configured.
- Query parameters omit `null`/`undefined`; `Date` values serialize to ISO-8601 (`fromDateUtc` /
  `toDateUtc` are produced from `fromDate` / `toDate`).
- Non-2xx responses throw `SeqApiError` carrying the HTTP status and the server's `{Error}` message
  when present. SQL queries pass `nonThrowingStatus: 400` so syntax errors surface as
  `QueryResult.Error` / `QueryResult.Reasons` instead of throwing (mirrors `TryQueryAsync`).

## Module layout

```
src/
├── client.ts          # SeqClient + request layer + link discovery
├── errors.ts          # SeqApiError
├── links.ts           # missingLinks validation
├── models/            # event, signal, query, data, root types
└── resources/         # events, signals, data, queries clients
```

Each resource client takes the `SeqRequestContext` (implemented by `SeqClient`) and only knows the
paths/parameters of its resource group.

## Wire-shape notes

- Event `Properties` are an array of `{Name, Value}`, not a flat object. Use
  `eventProperties(event)` to get a `Record<string, unknown>`. Message-template tokens can appear
  as numeric-keyed property names.
- `RenderedMessage` is only populated when `render: true` is requested.
- The `queries` resource maps to the `SqlQueries` resource group (`api/sqlqueries`).
