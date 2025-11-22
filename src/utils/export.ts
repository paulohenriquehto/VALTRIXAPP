import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { OverallMetrics, ExportConfig } from '../types';
import { formatCurrency, formatPercent, formatTime } from './analytics';

/**
 * Exporta métricas para PDF
 */
export async function exportToPDF(
  metrics: OverallMetrics,
  config: ExportConfig
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Título
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Analytics', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Período
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const periodText = `Período: ${new Date(metrics.dateRange.startDate).toLocaleDateString('pt-BR')} - ${new Date(metrics.dateRange.endDate).toLocaleDateString('pt-BR')}`;
  doc.text(periodText, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Métricas Financeiras
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Métricas Financeiras', 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const financialData = [
    ['Receita Total', formatCurrency(metrics.financial.totalRevenue)],
    ['MRR', formatCurrency(metrics.financial.mrr)],
    ['ARR', formatCurrency(metrics.financial.arr)],
    ['Clientes Ativos', String(metrics.financial.activeClients)],
    ['Ticket Médio', formatCurrency(metrics.financial.avgRevenuePerClient)],
    ['Taxa de Sucesso', formatPercent(metrics.financial.paymentSuccessRate)],
  ];

  financialData.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, yPos);
    doc.text(value, 100, yPos);
    yPos += 6;
  });

  yPos += 10;

  // Métricas de Tarefas
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Métricas de Tarefas', 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const taskData = [
    ['Total de Tarefas', String(metrics.tasks.totalTasks)],
    ['Concluídas', String(metrics.tasks.completedTasks)],
    ['Em Progresso', String(metrics.tasks.inProgressTasks)],
    ['Taxa de Conclusão', formatPercent(metrics.tasks.completionRate)],
    ['Tempo Médio', formatTime(metrics.tasks.avgCompletionTime)],
  ];

  taskData.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, yPos);
    doc.text(value, 100, yPos);
    yPos += 6;
  });

  yPos += 10;

  // Nova página se necessário
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  // Produtividade da Equipe
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Produtividade da Equipe', 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const teamData = [
    ['Membros Ativos', String(metrics.teamProductivity.activeMembers)],
    ['Tarefas Concluídas', String(metrics.teamProductivity.totalTasksCompleted)],
    ['Score Médio', String(metrics.teamProductivity.avgProductivityScore)],
    ['Taxa Média de Conclusão', formatPercent(metrics.teamProductivity.avgCompletionRate)],
  ];

  teamData.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, yPos);
    doc.text(value, 100, yPos);
    yPos += 6;
  });

  // Rodapé
  const footer = `Gerado em ${new Date().toLocaleString('pt-BR')}`;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(footer, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Salvar
  const filename = config.filename || `analytics-${Date.now()}.pdf`;
  doc.save(filename);
}

/**
 * Exporta métricas para Excel
 */
export function exportToExcel(metrics: OverallMetrics, config: ExportConfig): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Resumo
  const summaryData = [
    ['Relatório de Analytics'],
    [''],
    ['Período:', `${new Date(metrics.dateRange.startDate).toLocaleDateString('pt-BR')} - ${new Date(metrics.dateRange.endDate).toLocaleDateString('pt-BR')}`],
    ['Gerado em:', new Date().toLocaleString('pt-BR')],
    [''],
    ['MÉTRICAS FINANCEIRAS'],
    ['Receita Total', metrics.financial.totalRevenue],
    ['MRR', metrics.financial.mrr],
    ['ARR', metrics.financial.arr],
    ['Clientes Ativos', metrics.financial.activeClients],
    ['Ticket Médio', metrics.financial.avgRevenuePerClient],
    ['Taxa de Sucesso (%)', metrics.financial.paymentSuccessRate],
    [''],
    ['MÉTRICAS DE TAREFAS'],
    ['Total de Tarefas', metrics.tasks.totalTasks],
    ['Concluídas', metrics.tasks.completedTasks],
    ['Em Progresso', metrics.tasks.inProgressTasks],
    ['Taxa de Conclusão (%)', metrics.tasks.completionRate],
    ['Tempo Médio (h)', metrics.tasks.avgCompletionTime],
    [''],
    ['PRODUTIVIDADE DA EQUIPE'],
    ['Membros Ativos', metrics.teamProductivity.activeMembers],
    ['Tarefas Concluídas', metrics.teamProductivity.totalTasksCompleted],
    ['Score Médio', metrics.teamProductivity.avgProductivityScore],
    ['Taxa Média de Conclusão (%)', metrics.teamProductivity.avgCompletionRate],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  // Sheet 2: Receita Mensal
  const revenueData = [
    ['Mês', 'Receita'],
    ...metrics.financial.revenueByMonth.map((item) => [
      item.label || new Date(item.date).toLocaleDateString('pt-BR'),
      item.value,
    ]),
  ];
  const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
  XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Receita Mensal');

  // Sheet 3: Produtividade Individual
  const productivityData = [
    ['Nome', 'Cargo', 'Departamento', 'Tarefas Concluídas', 'Score', 'Ranking'],
    ...metrics.teamProductivity.allMemberProductivity.map((member) => [
      member.memberName,
      member.memberRole,
      member.department,
      member.tasksCompleted,
      member.productivityScore,
      member.rank,
    ]),
  ];
  const productivitySheet = XLSX.utils.aoa_to_sheet(productivityData);
  XLSX.utils.book_append_sheet(workbook, productivitySheet, 'Produtividade');

  // Salvar
  const filename = config.filename || `analytics-${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Exporta métricas para CSV
 */
export function exportToCSV(metrics: OverallMetrics, config: ExportConfig): void {
  const csvData = [
    ['Categoria', 'Métrica', 'Valor'],
    ['Financeiro', 'Receita Total', formatCurrency(metrics.financial.totalRevenue)],
    ['Financeiro', 'MRR', formatCurrency(metrics.financial.mrr)],
    ['Financeiro', 'ARR', formatCurrency(metrics.financial.arr)],
    ['Financeiro', 'Clientes Ativos', String(metrics.financial.activeClients)],
    ['Financeiro', 'Ticket Médio', formatCurrency(metrics.financial.avgRevenuePerClient)],
    ['Tarefas', 'Total', String(metrics.tasks.totalTasks)],
    ['Tarefas', 'Concluídas', String(metrics.tasks.completedTasks)],
    ['Tarefas', 'Taxa de Conclusão', formatPercent(metrics.tasks.completionRate)],
    ['Equipe', 'Membros Ativos', String(metrics.teamProductivity.activeMembers)],
    ['Equipe', 'Score Médio', String(metrics.teamProductivity.avgProductivityScore)],
  ];

  const csv = csvData.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', config.filename || `analytics-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta métricas para JSON
 */
export function exportToJSON(metrics: OverallMetrics, config: ExportConfig): void {
  const json = JSON.stringify(metrics, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', config.filename || `analytics-${Date.now()}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
