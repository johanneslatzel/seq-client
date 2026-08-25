# Configuration

`seq-client` reads no environment variables. Configuration is passed to the `SeqClient` constructor:

```ts
import { SeqClient } from '@johannes.latzel/seq-client';

const seq = new SeqClient({
    url: process.env.SEQ_URL ?? 'http://localhost:5341',
    apiKey: process.env.SEQ_API_KEY,
});
```

## `SeqClientOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | — | Base URL of the Seq server (required). A trailing slash is normalized. |
| `apiKey` | `string` | — | Sent as the `X-Seq-ApiKey` header. |
| `accept` | `string` | `application/vnd.datalust.seq.v14+json` | `Accept` header override. |
| `timeoutMs` | `number` | — | Default request timeout in milliseconds. |

## Integration tests

Run the live integration suite against a Seq instance with:

```bash
npm run test:integration
```

The target is `SEQ_TEST_URL` (default `http://localhost:5341`). These tests are excluded from
`npm run verify`.
