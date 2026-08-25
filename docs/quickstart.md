# Quick Start

## Install

```bash
npm install @johannes.latzel/seq-client
```

## Query events

```ts
import { SeqClient, eventProperties } from '@johannes.latzel/seq-client';

const seq = new SeqClient({
    url: 'http://localhost:5341',
    apiKey: process.env.SEQ_API_KEY,
});

const events = await seq.events.query({
    filter: "SessionId = 'abc123' and UserId = 'user42'",
    count: 100,
    render: true,
});

for (const event of events) {
    console.log(event.Timestamp, event.Level, event.RenderedMessage, eventProperties(event));
}
```

## Run a SQL query

```ts
const result = await seq.data.query({
    q: 'select count(*) from stream',
    rangeStartUtc: new Date(Date.now() - 60 * 60 * 1000),
});
console.log(result.Columns, result.Rows);
```

## List signals and saved queries

```ts
const signals = await seq.signals.list({ shared: true });
const queries = await seq.queries.list({ shared: true });
```

## Full API

See [API Reference](api-reference.md) for every method and [Architecture](architecture.md) for the design.
