import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Printer, Loader2 } from "lucide-react";
import { exportCsv, printPage } from "@/lib/exportUtils";
import { invokeXlsxDownload } from "@/lib/xlsxDownload";
import { toast } from "sonner";
import type { ExportColumn } from "@/lib/exportUtils";

interface ExportMenuProps {
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  filename: string;
  pageTitle?: string;
  showXlsx?: boolean;
  xlsxFnName?: string;
  xlsxBody?: Record<string, unknown>;
  disabled?: boolean;
}

export function ExportMenu({
  columns,
  data,
  filename,
  pageTitle,
  showXlsx,
  xlsxFnName,
  xlsxBody,
  disabled,
}: ExportMenuProps) {
  const [xlsxLoading, setXlsxLoading] = React.useState(false);

  const handleXlsx = async () => {
    if (!xlsxFnName) return;
    setXlsxLoading(true);
    try {
      await invokeXlsxDownload(xlsxFnName, xlsxBody ?? {}, `${filename}.xlsx`);
      toast.success("Excel file downloaded");
    } catch (err: any) {
      toast.error(err.message || "Excel export failed");
    } finally {
      setXlsxLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          {xlsxLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportCsv(data, columns, filename)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          CSV
        </DropdownMenuItem>
        {showXlsx && (
          <DropdownMenuItem onClick={handleXlsx} disabled={xlsxLoading}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {xlsxLoading ? "Exporting..." : "Excel (XLSX)"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => printPage(pageTitle || filename)}>
          <Printer className="h-4 w-4 mr-2" />
          Print / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
