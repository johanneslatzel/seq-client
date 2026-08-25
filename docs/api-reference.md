# API Reference

## `SeqClient`

```ts
import { SeqClient } from '@johannes.latzel/seq-client';

const seq = new SeqClient({ url, apiKey? });
```

### `root()`

Fetch the Seq API root entity (`Product`, `Version`, `Links`). Cached after the first call.

Returns `Promise<RootEntity>`.

### `discover()`

Fetch the root and all four resource-group documents, validating that required links are present. Throws `SeqApiError` if a link is missing (unsupported Seq version).

Returns `Promise<RootEntity>`.

### `resourceGroup(name)`

Fetch and cache a single resource-group document by name.

| Param | Type | Description |
|---|---|---|
| `name` | `string` | Resource group name: `Events`, `Signals`, `SqlQueries`, `Data` |

Returns `Promise<ResourceGroup>`.

## `seq.events`

### `query(options?)`

Query events as an array, oldest first.

| Option | Type | Default | Description |
|---|---|---|---|
| `filter` | `string` | — | Strict Seq filter expression |
| `count` | `number` | `30` | Max events to return |
| `signal` | `string` | — | Comma-separated signal ids |
| `startAtId` | `string` | — | Inclusive cursor |
| `afterId` | `string` | — | Exclusive cursor |
| `fromDate` | `Date` | — | Start of time range (serialized to ISO-8601) |
| `toDate` | `Date` | — | End of time range (serialized to ISO-8601) |
| `render` | `boolean` | `false` | Populate `RenderedMessage` |
| `permalinkId` | `string` | — | Permalink id |
| `background` | `boolean` | `false` | Server-side priority |
| `trace` | `boolean` | `false` | Server-side tracing |

Returns `Promise<SeqEvent[]>`.

### `page(options?)`

Page events via the signal endpoint. Same options as `query`.

Returns `Promise<ResultSet>` (events + statistics).

### `findById(id, options?)`

Fetch a single event by id.

| Option | Type | Default | Description |
|---|---|---|---|
| `render` | `boolean` | `false` | Populate `RenderedMessage` |
| `permalinkId` | `string` | — | Permalink id |
| `background` | `boolean` | `false` | Server-side priority |
| `trace` | `boolean` | `false` | Server-side tracing |

Returns `Promise<SeqEvent>`.

## `seq.signals`

### `list(options?)`

List signals.

| Option | Type | Default | Description |
|---|---|---|---|
| `ownerId` | `string` | — | Filter by owner |
| `shared` | `boolean` | `false` | Only shared signals |
| `partial` | `boolean` | `false` | Return partial details |

Returns `Promise<SignalEntity[]>`.

### `findById(id, options?)`

Fetch a single signal by id.

| Option | Type | Default | Description |
|---|---|---|---|
| `partial` | `boolean` | `false` | Return partial details |

Returns `Promise<SignalEntity>`.

## `seq.data`

### `query(options)`

Execute a SQL query.

| Option | Type | Default | Description |
|---|---|---|---|
| `q` | `string` |  | SQL query (required) |
| `rangeStartUtc` | `Date` | — | Start of time range |
| `rangeEndUtc` | `Date` | — | End of time range |
| `signal` | `string` | — | Signal id |
| `timeoutMs` | `number` | — | Query timeout (sent as `timeoutMS`) |
| `trace` | `boolean` | `false` | Server-side tracing |

Returns `Promise<QueryResult>`. Invalid SQL returns HTTP 400 with `QueryResult.Error` / `QueryResult.Reasons` instead of throwing.

### `queryCsv(options)`

Execute a SQL query and return the result as a CSV string. Same options as `query`.

Returns `Promise<string>`.

## `seq.queries`

### `list(options?)`

List saved queries.

| Option | Type | Default | Description |
|---|---|---|---|
| `ownerId` | `string` | — | Filter by owner |
| `shared` | `boolean` | `false` | Only shared queries |

Returns `Promise<QueryEntity[]>`.

### `findById(id)`

Fetch a single saved query by id.

Returns `Promise<QueryEntity>`.

## Helpers

### `eventProperties(event)`

Flatten an event's `Properties` (`{Name, Value}[]`) into a `Record<string, unknown>`. Numeric message-template keys are included. Later properties win on duplicate names.

## Errors

### `SeqApiError`

Extends `Error`. Thrown on non-2xx responses.

| Field | Type | Description |
|---|---|---|
| `status` | `number` | HTTP status code |
| `serverError` | `string \| undefined` | Server's `{Error}` message when present |

### `SeqTimeoutError`

Extends `Error`. Thrown when a request exceeds the configured timeout.

| Field | Type | Description |
|---|---|---|
| `timeoutMs` | `number` | The timeout that was exceeded |
