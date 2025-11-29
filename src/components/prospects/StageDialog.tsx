import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useProspectsStore } from '@/stores/prospectsStore';
import { useAuth } from '@/stores/appStore';
import type { StageInput } from '@/types/prospects';
import { DefaultStageColors } from '@/types/prospects';

export function StageDialog() {
  const { user } = useAuth();
  const {
    selectedStage,
    isStageDialogOpen,
    stageDialogMode,
    isLoading,
    closeStageDialog,
    createStage,
    updateStage,
  } = useProspectsStore();

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState(DefaultStageColors[0]);
  const [probability, setProbability] = useState(0);
  const [isWinStage, setIsWinStage] = useState(false);
  const [isLossStage, setIsLossStage] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isStageDialogOpen) {
      if (stageDialogMode === 'edit' && selectedStage) {
        setName(selectedStage.name);
        setColor(selectedStage.color);
        setProbability(selectedStage.probability);
        setIsWinStage(selectedStage.isWinStage);
        setIsLossStage(selectedStage.isLossStage);
      } else {
        // Create mode
        setName('');
        setColor(DefaultStageColors[Math.floor(Math.random() * DefaultStageColors.length)]);
        setProbability(0);
        setIsWinStage(false);
        setIsLossStage(false);
      }
    }
  }, [isStageDialogOpen, stageDialogMode, selectedStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !name.trim()) return;

    const input: StageInput = {
      name: name.trim(),
      color,
      probability,
      isWinStage,
      isLossStage,
    };

    if (stageDialogMode === 'edit' && selectedStage) {
      await updateStage(selectedStage.id, input);
    } else {
      await createStage(user.id, input);
    }
  };

  const handleWinStageChange = (checked: boolean) => {
    setIsWinStage(checked);
    if (checked) {
      setIsLossStage(false);
      setProbability(100);
    }
  };

  const handleLossStageChange = (checked: boolean) => {
    setIsLossStage(checked);
    if (checked) {
      setIsWinStage(false);
      setProbability(0);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={isStageDialogOpen} onOpenChange={closeStageDialog}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {stageDialogMode === 'edit' ? 'Editar Coluna' : 'Nova Coluna'}
            </DialogTitle>
            <DialogDescription>
              {stageDialogMode === 'edit'
                ? 'Atualize as configuracoes da coluna.'
                : 'Adicione uma nova coluna ao pipeline.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="stageName">Nome *</Label>
              <Input
                id="stageName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da coluna"
                required
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {DefaultStageColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-8 cursor-pointer"
              />
            </div>

            {/* Probability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Probabilidade de Conversao</Label>
                <span className="text-sm font-medium">{probability}%</span>
              </div>
              <Slider
                value={[probability]}
                onValueChange={(v) => setProbability(v[0])}
                min={0}
                max={100}
                step={5}
                disabled={isWinStage || isLossStage}
              />
              <p className="text-xs text-muted-foreground">
                Usado para calcular o valor ponderado do pipeline.
              </p>
            </div>

            {/* Win/Loss Stage */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Coluna de Ganho</Label>
                  <p className="text-xs text-muted-foreground">
                    Prospects movidos para ca serao marcados como ganhos.
                  </p>
                </div>
                <Switch
                  checked={isWinStage}
                  onCheckedChange={handleWinStageChange}
                  disabled={stageDialogMode === 'edit' && selectedStage?.isLossStage}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Coluna de Perda</Label>
                  <p className="text-xs text-muted-foreground">
                    Prospects movidos para ca serao marcados como perdidos.
                  </p>
                </div>
                <Switch
                  checked={isLossStage}
                  onCheckedChange={handleLossStageChange}
                  disabled={stageDialogMode === 'edit' && selectedStage?.isWinStage}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeStageDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {stageDialogMode === 'edit' ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
