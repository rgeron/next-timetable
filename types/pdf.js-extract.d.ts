declare module "pdf.js-extract" {
  interface PDFExtractOptions {
    // Add any options as needed
    firstPage?: number;
    lastPage?: number;
    password?: string;
    verbosity?: number;
  }

  interface PDFExtractContent {
    str: string;
    x: number;
    y: number;
    w: number;
    h: number;
    fontName: string;
  }

  interface PDFExtractPage {
    pageInfo: {
      num: number;
      scale: number;
      rotation: number;
      offsetX: number;
      offsetY: number;
      width: number;
      height: number;
    };
    content: PDFExtractContent[];
  }

  interface PDFExtractResult {
    meta: {
      info: Record<string, unknown>;
      metadata: Record<string, unknown>;
    };
    pages: PDFExtractPage[];
    pdfInfo: {
      numPages: number;
      fingerprint: string;
    };
  }

  class PDFExtract {
    extractBuffer(
      buffer: Buffer | Uint8Array,
      options?: PDFExtractOptions
    ): Promise<PDFExtractResult>;

    extract(
      filePath: string,
      options?: PDFExtractOptions
    ): Promise<PDFExtractResult>;
  }

  export { PDFExtract, PDFExtractOptions, PDFExtractResult };
}
