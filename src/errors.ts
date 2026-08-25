export class SeqApiError extends Error {
    readonly status: number;
    readonly serverError: string | undefined;

    constructor(message: string, status: number, serverError: string | undefined) {
        super(message);
        this.name = 'SeqApiError';
        this.status = status;
        this.serverError = serverError;
    }
}

export class SeqTimeoutError extends Error {
    readonly timeoutMs: number;

    constructor(timeoutMs: number) {
        super(`Seq request timed out after ${timeoutMs}ms`);
        this.name = 'SeqTimeoutError';
        this.timeoutMs = timeoutMs;
    }
}
