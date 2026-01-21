import type { FinancialSignal } from './db';
import { differenceInDays } from 'date-fns';

export interface RecurringEntity {
    merchant: string;
    amount: number; // Monthly normalized amount
    frequency: string;
    lastDate: string;
}

export interface MonthlyInsights {
    totalIncome: number;
    totalFixedCosts: number;
    disposableIncome: number;
    recurringIncome: RecurringEntity[];
    recurringExpenses: RecurringEntity[];
}

/**
 * Calculates the estimated monthly income based on recurring salary signals.
 */
export const calculateMonthlyIncome = (signals: FinancialSignal[]): RecurringEntity[] => {
    const incomeSignals = signals.filter(s => s.flow === 'inflow' && s.nature === 'income_source');
    return groupAndNormalize(incomeSignals);
};

/**
 * Calculates the estimated monthly fixed costs based on recurring expense signals.
 */
export const calculateRecurringExpenses = (signals: FinancialSignal[]): RecurringEntity[] => {
    const expenseSignals = signals.filter(s => s.flow === 'outflow' && s.nature === 'fixed_recurring');
    return groupAndNormalize(expenseSignals);
};

/**
 * Core logic to group signals by merchant and normalize amounts to a monthly basis.
 */
const groupAndNormalize = (signals: FinancialSignal[]): RecurringEntity[] => {
    const groups = new Map<string, FinancialSignal[]>();

    // Group by Merchant
    signals.forEach(s => {
        const key = s.merchant.toLowerCase().trim();
        const existing = groups.get(key) || [];
        existing.push(s);
        groups.set(key, existing);
    });

    const results: RecurringEntity[] = [];

    groups.forEach((groupSignals, _merchantKey) => {
        if (groupSignals.length === 0) return;

        // Sort by date descending (newest first)
        groupSignals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const latestSignal = groupSignals[0];
        let monthlyAmount = latestSignal.amount;
        let frequency = latestSignal.frequency || 'unknown';

        // Inference Logic if frequency is missing or needs validation
        if (groupSignals.length > 1) {
            // Calculate average days between transactions
            let totalDays = 0;
            for (let i = 0; i < groupSignals.length - 1; i++) {
                const d1 = new Date(groupSignals[i].date);
                const d2 = new Date(groupSignals[i + 1].date);
                totalDays += Math.abs(differenceInDays(d1, d2));
            }
            const avgGap = totalDays / (groupSignals.length - 1);

            if (avgGap >= 25 && avgGap <= 35) {
                frequency = 'monthly';
                // Monthly amount is just the amount
            } else if (avgGap >= 12 && avgGap <= 16) {
                frequency = 'bi-weekly';
                monthlyAmount = latestSignal.amount * 2.16; // Average weeks in a month / 2 approx
            } else if (avgGap >= 6 && avgGap <= 8) {
                frequency = 'weekly';
                monthlyAmount = latestSignal.amount * 4.33;
            }
        } else {
            // Single signal: Trust the LLM's frequency or default to monthly if it looks like a subscription
            if (!frequency || frequency === 'unknown') {
                // For now, default to monthly for "fixed_recurring" if we only have one data point,
                // assuming the user uploaded a monthly statement.
                frequency = 'monthly';
            }
        }

        // Final normalization based on potentially updated frequency
        if (frequency === 'bi-weekly') monthlyAmount = latestSignal.amount * 2; // Conservative 2x
        if (frequency === 'weekly') monthlyAmount = latestSignal.amount * 4;   // Conservative 4x
        if (frequency === 'annual') monthlyAmount = latestSignal.amount / 12;

        results.push({
            merchant: latestSignal.merchant, // Use the pretty name from the latest signal
            amount: monthlyAmount,
            frequency: frequency,
            lastDate: latestSignal.date
        });
    });

    return results;
};

export const calculateDisposableIncome = (income: RecurringEntity[], expenses: RecurringEntity[]) => {
    const totalIncome = income.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return {
        totalIncome,
        totalFixedCosts: totalExpenses,
        disposableIncome: totalIncome - totalExpenses,
        recurringIncome: income,
        recurringExpenses: expenses
    };
};
