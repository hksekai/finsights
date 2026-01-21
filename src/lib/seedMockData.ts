// Mock Signals Seed Script
// Run this in the browser console to populate the database with test data

import { db, type FinancialSignal } from './db';
import { subMonths, format } from 'date-fns';

// Helper to generate a date string for a given months ago and day of month
const getDate = (monthsAgo: number, dayOfMonth: number = 1): string => {
    const date = subMonths(new Date(), monthsAgo);
    date.setDate(dayOfMonth);
    return format(date, 'yyyy-MM-dd');
};

// Generate mock signals
export const generateMockSignals = (): FinancialSignal[] => {
    const signals: FinancialSignal[] = [];

    // === INCOME SOURCES ===

    // Bi-weekly Salary (twice a month for 12 months = 24 entries)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 1),
            amount: 3250.00,
            currency: 'USD',
            flow: 'inflow',
            nature: 'income_source',
            merchant: 'ACME Corp - Direct Deposit',
            category: 'Salary',
            frequency: 'bi-weekly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 15),
            amount: 3250.00,
            currency: 'USD',
            flow: 'inflow',
            nature: 'income_source',
            merchant: 'ACME Corp - Direct Deposit',
            category: 'Salary',
            frequency: 'bi-weekly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Rental Income (monthly, 1st of each month)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 1),
            amount: 1800.00,
            currency: 'USD',
            flow: 'inflow',
            nature: 'income_source',
            merchant: 'Tenant - Unit 4B Rent',
            category: 'Rental Income',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // === FIXED RECURRING EXPENSES ===

    // Mortgage Payment (monthly, 1st of each month)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 1),
            amount: 2450.00,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Wells Fargo Mortgage',
            category: 'Housing',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Car Payment (monthly, 5th of each month)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 5),
            amount: 489.00,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Toyota Financial Services',
            category: 'Auto',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Car Insurance (monthly, 15th)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 15),
            amount: 142.00,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Geico Auto Insurance',
            category: 'Insurance',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Health Insurance (monthly, 1st)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 1),
            amount: 485.00,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Blue Cross Blue Shield',
            category: 'Insurance',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // === SUBSCRIPTIONS ===

    // Netflix (monthly, 8th)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 8),
            amount: 22.99,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Netflix',
            category: 'Entertainment',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Spotify (monthly, 12th)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 12),
            amount: 15.99,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Spotify Premium',
            category: 'Entertainment',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Adobe Creative Cloud (monthly, 20th)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 20),
            amount: 54.99,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Adobe Creative Cloud',
            category: 'Software',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Gym Membership (monthly, 1st)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 1),
            amount: 49.99,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Planet Fitness',
            category: 'Health & Fitness',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // iCloud Storage (monthly, 25th)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 25),
            amount: 2.99,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Apple iCloud',
            category: 'Software',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // YouTube Premium (monthly, 18th)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 18),
            amount: 13.99,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'YouTube Premium',
            category: 'Entertainment',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // === UTILITIES ===

    // Electric Bill (monthly, varies)
    const electricAmounts = [145, 178, 210, 245, 280, 312, 298, 275, 220, 185, 155, 140];
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 22),
            amount: electricAmounts[m],
            currency: 'USD',
            flow: 'outflow',
            nature: 'variable_estimate',
            merchant: 'Pacific Gas & Electric',
            category: 'Utilities',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Water Bill (monthly)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 10),
            amount: 65 + Math.random() * 30,
            currency: 'USD',
            flow: 'outflow',
            nature: 'variable_estimate',
            merchant: 'City Water Department',
            category: 'Utilities',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Internet (monthly, 3rd)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 3),
            amount: 79.99,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Comcast Xfinity',
            category: 'Utilities',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // Phone Bill (monthly, 7th)
    for (let m = 0; m < 12; m++) {
        signals.push({
            id: crypto.randomUUID(),
            date: getDate(m, 7),
            amount: 85.00,
            currency: 'USD',
            flow: 'outflow',
            nature: 'fixed_recurring',
            merchant: 'Verizon Wireless',
            category: 'Utilities',
            frequency: 'monthly',
            sourceDocId: 'mock-seed',
            createdAt: Date.now()
        });
    }

    // === VARIABLE EXPENSES ===

    // Groceries (weekly, roughly)
    for (let m = 0; m < 12; m++) {
        for (const day of [3, 10, 17, 24]) {
            signals.push({
                id: crypto.randomUUID(),
                date: getDate(m, day),
                amount: 80 + Math.random() * 120,
                currency: 'USD',
                flow: 'outflow',
                nature: 'variable_estimate',
                merchant: ['Whole Foods', 'Trader Joes', 'Costco', 'Safeway'][Math.floor(Math.random() * 4)],
                category: 'Groceries',
                sourceDocId: 'mock-seed',
                createdAt: Date.now()
            });
        }
    }

    // Gas (bi-weekly roughly)
    for (let m = 0; m < 12; m++) {
        for (const day of [5, 20]) {
            signals.push({
                id: crypto.randomUUID(),
                date: getDate(m, day),
                amount: 45 + Math.random() * 25,
                currency: 'USD',
                flow: 'outflow',
                nature: 'variable_estimate',
                merchant: ['Chevron', 'Shell', 'Arco', '76 Gas'][Math.floor(Math.random() * 4)],
                category: 'Transportation',
                sourceDocId: 'mock-seed',
                createdAt: Date.now()
            });
        }
    }

    // Dining Out (random dates)
    for (let m = 0; m < 12; m++) {
        const numMeals = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numMeals; i++) {
            signals.push({
                id: crypto.randomUUID(),
                date: getDate(m, 1 + Math.floor(Math.random() * 27)),
                amount: 15 + Math.random() * 85,
                currency: 'USD',
                flow: 'outflow',
                nature: 'variable_estimate',
                merchant: ['Chipotle', 'Starbucks', 'McDonalds', 'Olive Garden', 'Panda Express', 'Subway', 'In-N-Out'][Math.floor(Math.random() * 7)],
                category: 'Dining',
                sourceDocId: 'mock-seed',
                createdAt: Date.now()
            });
        }
    }

    // Amazon Purchases (random)
    for (let m = 0; m < 12; m++) {
        const numPurchases = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numPurchases; i++) {
            signals.push({
                id: crypto.randomUUID(),
                date: getDate(m, 1 + Math.floor(Math.random() * 27)),
                amount: 15 + Math.random() * 150,
                currency: 'USD',
                flow: 'outflow',
                nature: 'variable_estimate',
                merchant: 'Amazon.com',
                category: 'Shopping',
                sourceDocId: 'mock-seed',
                createdAt: Date.now()
            });
        }
    }

    return signals;
};

// Seed function to populate database
export const seedMockData = async () => {
    const signals = generateMockSignals();

    // Clear existing mock data first
    await db.signals.where('sourceDocId').equals('mock-seed').delete();

    // Add new signals
    await db.signals.bulkAdd(signals);

    console.log(`Seeded ${signals.length} mock signals!`);
    return signals.length;
};

// Export for use
export default seedMockData;
