import Dexie, { type Table } from 'dexie';

export type FlowDirection = 'inflow' | 'outflow';
export type EntityNature = 'fixed_recurring' | 'variable_estimate' | 'income_source';
export type RecurringFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface FinancialSignal {
    id?: string; // UUID
    date: string; // ISO Date string
    amount: number;
    currency: string;
    flow: FlowDirection;
    nature: EntityNature;
    frequency?: RecurringFrequency;
    merchant: string;
    category: string;
    sourceDocId?: string;
    createdAt: number;
}

export interface DashboardPanel {
    id: string;
    title: string;
    type: 'stat' | 'line' | 'bar' | 'pie';
    query: {
        metric: 'sum' | 'avg' | 'count';
        filter?: {
            field: string;
            operator: 'equals' | 'contains';
            value: string;
        };
        groupBy: 'category' | 'merchant' | 'date' | 'custom_groups';
        customGroups?: Array<{
            name: string;
            categories: string[];
        }>;
        timeRange: string;
    };
    presentation: {
        color?: string;
        units?: string;
        thresholds?: number;
    };
}

export interface DashboardConfig {
    id?: string;
    name: string;
    panels: DashboardPanel[];
}

export interface UploadedDocument {
    id?: string;
    fileName: string;
    imageData: string; // base64 data URL
    uploadedAt: number;
    signalCount: number;
}

export interface DraftSignal {
    id?: number;
    fileId: string;
    image: string; // base64
    result: any; // The raw LLM result
    createdAt: number;
}

export interface InvestmentAccount {
    id?: number;
    name: string;
    currentBalance: number;
    monthlyContribution: number;
    annualGrowthRate: number;
    signalId?: string; // ID of the linked FinancialSignal
}

export interface TaxDocument {
    id?: number;
    fileName: string;
    docType: 'w2' | '1099' | 'property_tax' | 'other';
    taxYear: string;
    imageData: string; // base64
    uploadedAt: number;
}

export interface TaxInsight {
    id?: number;
    docId: number;
    type: 'extraction' | 'advice';
    data: any; // Flexible JSON for extracted fields or text advice
    createdAt: number;
}

export class BurnRateDatabase extends Dexie {
    signals!: Table<FinancialSignal>;
    dashboards!: Table<DashboardConfig>;
    documents!: Table<UploadedDocument>;
    drafts!: Table<DraftSignal>;
    investments!: Table<InvestmentAccount>;
    tax_documents!: Table<TaxDocument>;
    tax_insights!: Table<TaxInsight>;

    constructor() {
        super('BurnRateDB');
        this.version(1).stores({
            signals: '++id, date, flow, nature, category, merchant, createdAt',
            dashboards: '++id, name'
        });
        this.version(2).stores({
            signals: '++id, date, flow, nature, category, merchant, createdAt',
            dashboards: '++id, name',
            documents: '++id, fileName, uploadedAt'
        });
        this.version(3).stores({
            signals: '++id, date, flow, nature, category, merchant, sourceDocId, createdAt',
            dashboards: '++id, name',
            documents: '++id, fileName, uploadedAt'
        });
        this.version(4).stores({
            signals: '++id, date, flow, nature, category, merchant, sourceDocId, createdAt',
            dashboards: '++id, name',
            documents: '++id, fileName, uploadedAt',
            drafts: '++id, createdAt'
        });
        this.version(5).stores({
            signals: '++id, date, flow, nature, category, merchant, sourceDocId, createdAt',
            dashboards: '++id, name',
            documents: '++id, fileName, uploadedAt',
            drafts: '++id, createdAt',
            investments: '++id, name'
        });
        this.version(6).stores({
            signals: '++id, date, flow, nature, category, merchant, sourceDocId, createdAt',
            dashboards: '++id, name',
            documents: '++id, fileName, uploadedAt',
            drafts: '++id, createdAt',
            investments: '++id, name',
            tax_documents: '++id, fileName, docType, taxYear, uploadedAt', // docType: 'w2', '1099', 'property_tax', etc.
            tax_insights: '++id, docId, type, data, createdAt' // data: JSON of extracted values
        });
    }
}

export const db = new BurnRateDatabase();

