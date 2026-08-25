export interface DescriptiveFilterPart {
    Description?: string;
    DescriptionIsExcluded?: boolean;
    Filter?: string;
    FilterNonStrict?: string;
}

export interface SignalColumnPart {
    Expression?: string;
}

export interface SignalEntity {
    Id?: string;
    Title: string;
    Description?: string;
    Filters?: DescriptiveFilterPart[];
    Columns?: SignalColumnPart[];
    IsProtected?: boolean;
    IsIndexSuppressed?: boolean;
    Grouping?: string;
    ExplicitGroupName?: string | null;
    OwnerId?: string | null;
    Links?: Record<string, string>;
}
