import { FileSpreadsheet, FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onDownloadIdCards: () => void;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onExportExcel,
  onExportPDF,
  onDownloadIdCards,
  onClearSelection,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <Badge variant="secondary" className="text-sm px-3 py-1">
        {selectedCount} selected
      </Badge>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="outline" size="sm" onClick={onExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>

        <Button variant="outline" size="sm" onClick={onExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export PDF
        </Button>

        <Button variant="outline" size="sm" onClick={onDownloadIdCards}>
          <Download className="h-4 w-4 mr-2" />
          Download ID Cards
        </Button>

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}