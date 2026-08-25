export interface SeqEventProperty {
    Name: string;
    Value: unknown;
}

export interface MessageTemplateToken {
    Text?: string;
    PropertyName?: string;
    RawText?: string;
    FormattedValue?: string;
}

export interface SeqEvent {
    Id?: string;
    Timestamp: string;
    Start?: string;
    Properties?: SeqEventProperty[];
    MessageTemplateTokens?: MessageTemplateToken[];
    EventType?: string;
    Level?: string;
    Exception?: string;
    RenderedMessage?: string;
    TraceId?: string;
    SpanId?: string;
    ParentId?: string;
    SpanKind?: string;
    Resource?: SeqEventProperty[];
    Scope?: SeqEventProperty[];
    Definitions?: SeqEventProperty[];
    Elapsed?: string;
    Links?: Record<string, string>;
}

export interface StatisticsPart {
    Elapsed: string;
    LastReadEventId?: string;
    LastReadEventTimestamp?: string;
    Status?: string;
}

export interface ResultSet {
    Events: SeqEvent[];
    Statistics: StatisticsPart;
}

export function eventProperties(event: SeqEvent): Record<string, unknown> {
    const properties: Record<string, unknown> = {};
    for (const property of event.Properties ?? []) {
        properties[property.Name] = property.Value;
    }
    return properties;
}
