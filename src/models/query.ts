export interface QueryEntity {
    Id?: string;
    Title: string;
    Description?: string;
    Sql: string;
    IsProtected?: boolean;
    OwnerId?: string | null;
    Links?: Record<string, string>;
}
