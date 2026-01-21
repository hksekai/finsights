export interface LLMResponse {
    signals: any[]; // refined later
    usage: any;
}

export const analyzeDocument = async (base64Image: string, apiKey: string, model: string = 'google/gemini-2.0-flash-001'): Promise<any> => {
    // Constraint: Explicitly forbid markdown
    const prompt = `
    You are an expert financial data analyst. 
    Analyze the provided image. The image may be a STITCHED PDF consisting of multiple pages scanned vertically.
    Look for tabular data containing financial transactions, which may span across these stitched sections.
    
    CRITICAL INSTRUCTION: You must extract **EVERY SINGLE** financial transaction row found in the document, **EXCEPT** for the following ignored categories:

    **EXCLUSION RULES (Do NOT extract these):**
    1. **Internal Transfers**: Ignore "Overdraft protection", "Transfer from savings", "Desposit" (if generic/internal). Keep "Direct Deposit" (Payroll).
    2. **Credit Card Payments**:
       - **CRITICAL**: Ignore ANY row that looks like a credit card payoff or internal transfer to a credit card.
       - **Keywords to IGNORE**: "Chase Credit Crd", "Autopay", "Amex Epayment", "Capital One", "Citi Card", "Discover", "Bank of America Credit", "Payment to Credit Card", "Transfer to Credit Card", "Online Payment", "Thank you for your payment".
       - These are typically large round numbers or exact matches to a statement balance. THEY ARE NOT EXPENSES.

    - Do not skip any rows unless they match the Exclusion Rules.
    - Do not summarize similar transactions.
    - Scan the entire image from top to bottom.
    - If a page break splits a table, continue extracting seamlessly.
    - **Date Logic**: 
      - Look for the year in the transaction row itself (e.g. "Oct 27, 2025"). 
      - If missing in the row, use the Year found in the Document Header/Statement Period. 
      - **NEVER** default to "2023" or the current year unless explicitly written in the document.
      - If the year is 2025, output 2025.
    
    Return ONLY a valid JSON object with a "signals" key containing an array of objects.
    DO NOT use markdown formatting (like \`\`\`json). DO NOT include any text outside the JSON object.
    ENSURE all property names are DOUBLE-QUOTED strings (e.g. "date": "...", NOT date: "...").
    NO trailing commas. NO comments.
    
    Each signal object must have:
    - date: ISO8601 date string (YYYY-MM-DD). **Verify the year matches the document.**
    - amount: number (positive float)
    - currency: string (e.g. "USD")
    - flow: "inflow" or "outflow"
    - nature: "fixed_recurring" (subscriptions, rent), "variable_estimate" (food, taxi), or "income_source"
    - merchant: string (name of entity)
    - category: string (inferred category)
    - frequency: string (optional, only if confident it is recurring, e.g. "monthly")

    If no financial data is found, return { "signals": [] }.
  `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            { "type": "text", "text": prompt },
                            { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const rawContent = data.choices[0].message.content;

        // Robust JSON extraction
        const firstBrace = rawContent.indexOf('{');
        const lastBrace = rawContent.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("No JSON object found in response");
        }

        const jsonString = rawContent.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("LLM Analysis Failed:", error);
        throw error;
    }
};

export const analyzeTaxDocument = async (base64Image: string, apiKey: string, model: string = 'google/gemini-2.0-flash-001'): Promise<any> => {
    const prompt = `
    You are an expert tax accountant and financial analyst.
    Analyze the provided image of a tax document (e.g., W2, 1099, Property Tax Bill, or Paystub).
    
    GOAL: Extract key tax-related figures and identify the document type and tax year.

    RETURN JSON ONLY. No markdown. Format:
    {
        "docType": "w2" | "1099" | "property_tax" | "paystub" | "other",
        "taxYear": "YYYY" (e.g. "2024"),
        "entityName": "Employer or Payer Name",
        "data": {
            // Common fields search. Use null if not found.
            "grossIncome": number | null,
            "federalTaxWithheld": number | null,
            "socialSecurityTax": number | null,
            "medicareTax": number | null,
            "stateTaxWithheld": number | null,
            "state": string | null (e.g "CA"),
            "propertyTaxAmount": number | null (if property tax)
        },
        "insights": [
             "Array of string. Brief observations or potential tax credit suggestions based on this doc."
        ]
    }

    - If it's a W2:
      - grossIncome = Box 1 (Wages, tips)
      - federalTaxWithheld = Box 2
      - socialSecurityTax = Box 4
      - medicareTax = Box 6
      - stateTaxWithheld = Box 17
    
    - If it's a 1099-NEC/MISC:
      - grossIncome = Nonemployee compensation
    
    - If it's Property Tax:
      - propertyTaxAmount = Total Tax Due

    - Insight Logic:
      - If State Tax is high (>5% of income), mention SALT deduction cap.
      - If 401k (Box 12 D) found, mention retirement savings credit potential.
      - General 2024/2025 tax season advice based on the data.
  `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            { "type": "text", "text": prompt },
                            { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const rawContent = data.choices[0].message.content;

        const firstBrace = rawContent.indexOf('{');
        const lastBrace = rawContent.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");

        return JSON.parse(rawContent.substring(firstBrace, lastBrace + 1));

    } catch (error) {
        console.error("Tax Analysis Failed:", error);
        throw error;
    }
};
