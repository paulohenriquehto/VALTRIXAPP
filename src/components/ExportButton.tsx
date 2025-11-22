import React, { useState } from 'react';
import { Download, FileDown, FileSpreadsheet, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { OverallMetrics, ExportConfig } from '../types';
import { exportToPDF, exportToExcel, exportToCSV, exportToJSON } from '../utils/export';
import { toast } from 'sonner';

interface ExportButtonProps {
  metrics: OverallMetrics;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ metrics, disabled }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: ExportConfig['format']) => {
    setLoading(true);

    try {
      const config: ExportConfig = {
        format,
        filename: `analytics-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`,
      };

      switch (format) {
        case 'pdf':
          await exportToPDF(metrics, config);
          break;
        case 'excel':
          exportToExcel(metrics, config);
          break;
        case 'csv':
          exportToCSV(metrics, config);
          break;
        case 'json':
          exportToJSON(metrics, config);
          break;
      }

      toast.success('Exportação concluída!', {
        description: `Arquivo ${config.filename} baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar', {
        description: 'Não foi possível exportar os dados. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || loading}>
          <Download className="mr-2 h-4 w-4" />
          {loading ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Formato de Exportação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar como Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar como CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="mr-2 h-4 w-4" />
          Exportar como JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
