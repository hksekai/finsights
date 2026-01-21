import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const convertPdfToImage = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;


    // Store page dimensions/canvases
    const pagesInfo = [];
    let totalHeight = 0;
    let maxWidth = 0;
    const scale = 3.0; // Higher quality for better text detection

    // Render all pages to separate canvases first
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Canvas context failed");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas as any // Required by pdfjs-dist type definition
        }).promise;

        pagesInfo.push({ canvas, height: viewport.height, width: viewport.width });
        totalHeight += viewport.height;
        maxWidth = Math.max(maxWidth, viewport.width);
    }

    // Stitch them onto a single canvas
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = maxWidth;
    finalCanvas.height = totalHeight;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) throw new Error("Final canvas context failed");

    // White background
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    let currentY = 0;
    for (const p of pagesInfo) {
        // Center the page if it's smaller than max width (unlikely for consistent docs but good practice)
        const xOffset = (maxWidth - p.width) / 2;
        finalCtx.drawImage(p.canvas, xOffset, currentY);
        currentY += p.height;
    }

    return finalCanvas.toDataURL('image/jpeg', 0.85); // High quality JPEG
};
