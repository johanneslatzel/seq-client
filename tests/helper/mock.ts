import { vi } from 'vitest';

export interface Call {
    url: string;
    init: RequestInit;
}

export function stubFetch(route: (url: string) => Response, calls: Call[] = []): Call[] {
    vi.stubGlobal(
        'fetch',
        async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> => {
            const url = String(input);
            calls.push({ url, init: init ?? {} });
            return route(url);
        }
    );
    return calls;
}

export function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export function pathOf(call: Call): string {
    return new URL(call.url).pathname;
}

export function searchParamsOf(call: Call): URLSearchParams {
    return new URL(call.url).searchParams;
}
