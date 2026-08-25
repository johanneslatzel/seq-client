export interface RootEntity {
    Product: string;
    Version: string;
    InstanceName: string | null;
    Links: Record<string, string>;
}

export interface ResourceGroup {
    Links: Record<string, string>;
}
