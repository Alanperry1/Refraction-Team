declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      [key: string]: any;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
      [key: string]: any;
    };
    [key: string]: any;
  }

  interface Html2PdfInstance {
    set: (options: Html2PdfOptions) => Html2PdfInstance;
    from: (element: HTMLElement | string) => Html2PdfInstance;
    save: () => Promise<void>;
    output: (type: string, options?: any) => any;
    then: (callback: (pdf: any) => void) => Html2PdfInstance;
    catch: (callback: (error: Error) => void) => Html2PdfInstance;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Html2PdfInstance;

  export = html2pdf;
}