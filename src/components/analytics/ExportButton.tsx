import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  onExport: (format: 'excel' | 'pdf') => Promise<void>;
  disabled?: boolean;
}

export default function ExportButton({ onExport, disabled }: ExportButtonProps) {
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(format);
      await onExport(format);
      toast.success(`Report exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || exporting !== null}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')} disabled={exporting !== null}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={exporting !== null}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Utility functions for generating exports
export const generateCSVContent = (data: Record<string, unknown>[], headers: string[]): string => {
  const headerRow = headers.join(',');
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      // Escape values with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );
  return [headerRow, ...rows].join('\n');
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToExcel = (data: Record<string, unknown>[], headers: string[], filename: string) => {
  const csvContent = generateCSVContent(data, headers);
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

export const exportToPDF = async (elementId: string, filename: string) => {
  // For PDF export, we'll create a simple HTML-based PDF
  // In production, you might want to use a library like jsPDF or html2pdf
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found for PDF export');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          h1 { color: #333; }
          .header { margin-bottom: 20px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${filename}</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        ${element.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
