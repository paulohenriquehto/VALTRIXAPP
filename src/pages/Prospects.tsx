import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useProspectsStore } from '@/stores/prospectsStore';
import { useAuth } from '@/stores/appStore';
import {
  ProspectBoard,
  ProspectDialog,
  StageDialog,
  InteractionDialog,
  ProspectFilters,
  PipelineMetricsBar,
  ProspectDetail,
} from '@/components/prospects';

export default function Prospects() {
  const { user } = useAuth();
  const {
    isLoading,
    loadStagesWithMetrics,
    loadProspects,
    loadMetrics,
    openProspectDialog,
    refreshData,
  } = useProspectsStore();

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      loadStagesWithMetrics(user.id);
      loadProspects(user.id);
      loadMetrics(user.id);
    }
  }, [user?.id, loadStagesWithMetrics, loadProspects, loadMetrics]);

  const handleRefresh = async () => {
    if (user?.id) {
      await refreshData(user.id);
    }
  };

  const handleAddProspect = () => {
    openProspectDialog('create');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus prospects e acompanhe o funil de vendas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProspectFilters />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleAddProspect}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Prospect
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 pt-4">
        <PipelineMetricsBar />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <ProspectBoard />
      </div>

      {/* Dialogs */}
      <ProspectDialog />
      <StageDialog />
      <InteractionDialog />

      {/* Detail Panel */}
      <ProspectDetail />
    </div>
  );
}
