import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useProspectsStore } from '@/stores/prospectsStore';
import { useAuth } from '@/stores/appStore';
import type { ProspectFilters as FiltersType, ProspectPriority } from '@/types/prospects';
import { PriorityLabels, CommonSources } from '@/types/prospects';

export function ProspectFilters() {
  const { user } = useAuth();
  const { stages, filters, setFilters, clearFilters, loadProspects } = useProspectsStore();
  const [isOpen, setIsOpen] = useState(false);

  // Local state for the form
  const [localFilters, setLocalFilters] = useState<FiltersType>(filters);

  const handleSearchChange = (search: string) => {
    const newFilters = { ...filters, search };
    setFilters(newFilters);
    if (user?.id) {
      loadProspects(user.id, newFilters);
    }
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    if (user?.id) {
      loadProspects(user.id, localFilters);
    }
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: FiltersType = {};
    setLocalFilters(emptyFilters);
    clearFilters();
    if (user?.id) {
      loadProspects(user.id, emptyFilters);
    }
    setIsOpen(false);
  };

  const handlePriorityToggle = (priority: ProspectPriority) => {
    const current = localFilters.priorities || [];
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    setLocalFilters({ ...localFilters, priorities: updated.length > 0 ? updated : undefined });
  };

  const handleStageToggle = (stageId: string) => {
    const current = localFilters.stageIds || [];
    const updated = current.includes(stageId)
      ? current.filter((s) => s !== stageId)
      : [...current, stageId];
    setLocalFilters({ ...localFilters, stageIds: updated.length > 0 ? updated : undefined });
  };

  const handleSourceChange = (source: string) => {
    const current = localFilters.sources || [];
    const updated = current.includes(source)
      ? current.filter((s) => s !== source)
      : [...current, source];
    setLocalFilters({ ...localFilters, sources: updated.length > 0 ? updated : undefined });
  };

  // Count active filters
  const activeFiltersCount =
    (filters.priorities?.length || 0) +
    (filters.stageIds?.length || 0) +
    (filters.sources?.length || 0) +
    (filters.minValue !== undefined ? 1 : 0) +
    (filters.maxValue !== undefined ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar prospects..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 w-[200px]"
        />
      </div>

      {/* Filters popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <h4 className="font-medium">Filtrar Prospects</h4>

            {/* Priority filter */}
            <div className="space-y-2">
              <Label className="text-sm">Prioridade</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PriorityLabels).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={localFilters.priorities?.includes(key as ProspectPriority) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handlePriorityToggle(key as ProspectPriority)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stage filter */}
            <div className="space-y-2">
              <Label className="text-sm">Estagios</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {stages.map((stage) => (
                  <div key={stage.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`stage-${stage.id}`}
                      checked={localFilters.stageIds?.includes(stage.id) || false}
                      onCheckedChange={() => handleStageToggle(stage.id)}
                    />
                    <Label htmlFor={`stage-${stage.id}`} className="text-sm flex items-center gap-2 cursor-pointer">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      {stage.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Value range */}
            <div className="space-y-2">
              <Label className="text-sm">Valor Esperado</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minValue || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, minValue: Number(e.target.value) || undefined })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxValue || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, maxValue: Number(e.target.value) || undefined })
                  }
                />
              </div>
            </div>

            {/* Source filter */}
            <div className="space-y-2">
              <Label className="text-sm">Origem</Label>
              <Select
                value=""
                onValueChange={handleSourceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar origem..." />
                </SelectTrigger>
                <SelectContent>
                  {CommonSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localFilters.sources && localFilters.sources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {localFilters.sources.map((source) => (
                    <Badge key={source} variant="secondary" className="gap-1">
                      {source}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleSourceChange(source)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Limpar
              </Button>
              <Button size="sm" onClick={handleApplyFilters}>
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear filters button (when filters are active) */}
      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
