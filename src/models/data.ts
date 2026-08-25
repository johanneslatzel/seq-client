export interface QueryStatistics {
    Elapsed?: string;
}

export interface TimeSlice {
    Columns?: string[];
    Rows?: unknown[][];
}

export interface Timeseries {
    Columns?: string[];
    Points?: unknown[][];
}

export interface QueryResult {
    Columns?: string[];
    Rows?: unknown[][];
    Slices?: TimeSlice[];
    Series?: Timeseries[];
    Variables?: Record<string, unknown>;
    Error?: string;
    Reasons?: string[];
    Suggestion?: string;
    Statistics?: QueryStatistics;
}
