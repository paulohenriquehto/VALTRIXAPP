import React, { useState } from 'react';
import { useAuth } from '@/stores/appStore';
import { useSalesStore } from '@/stores/salesStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  Mail,
  Users,
  FileText,
  Plus,
  Minus,
  Check,
  Loader2,
} from 'lucide-react';

interface ActivityButtonProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange: (value: number) => void;
}

const ActivityButton: React.FC<ActivityButtonProps> = ({
  icon: Icon,
  label,
  value,
  color,
  onIncrement,
  onDecrement,
  onChange,
}) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={onDecrement}
        disabled={value <= 0}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-12 h-7 text-center p-0 text-sm"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={onIncrement}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  </div>
);

export const ActivityQuickAdd: React.FC = () => {
  const { user } = useAuth();
  const { updateActivity, todayActivity } = useSalesStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [contacts, setContacts] = useState(0);
  const [calls, setCalls] = useState(0);
  const [meetings, setMeetings] = useState(0);
  const [proposals, setProposals] = useState(0);

  const hasChanges = contacts > 0 || calls > 0 || meetings > 0 || proposals > 0;

  const handleSubmit = async () => {
    if (!user || !hasChanges) return;

    setIsSubmitting(true);
    try {
      await updateActivity(user.id, {
        contacts_sent: (todayActivity?.contacts_sent || 0) + contacts,
        calls_made: (todayActivity?.calls_made || 0) + calls,
        meetings_held: (todayActivity?.meetings_held || 0) + meetings,
        proposals_sent: (todayActivity?.proposals_sent || 0) + proposals,
      });

      // Reset values
      setContacts(0);
      setCalls(0);
      setMeetings(0);
      setProposals(0);

      // Show success
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <ActivityButton
              icon={Mail}
              label="Contatos"
              value={contacts}
              color="bg-blue-500/10 text-blue-500"
              onIncrement={() => setContacts(c => c + 1)}
              onDecrement={() => setContacts(c => Math.max(0, c - 1))}
              onChange={setContacts}
            />
            <ActivityButton
              icon={Phone}
              label="Ligacoes"
              value={calls}
              color="bg-green-500/10 text-green-500"
              onIncrement={() => setCalls(c => c + 1)}
              onDecrement={() => setCalls(c => Math.max(0, c - 1))}
              onChange={setCalls}
            />
            <ActivityButton
              icon={Users}
              label="Reunioes"
              value={meetings}
              color="bg-purple-500/10 text-purple-500"
              onIncrement={() => setMeetings(m => m + 1)}
              onDecrement={() => setMeetings(m => Math.max(0, m - 1))}
              onChange={setMeetings}
            />
            <ActivityButton
              icon={FileText}
              label="Propostas"
              value={proposals}
              color="bg-orange-500/10 text-orange-500"
              onIncrement={() => setProposals(p => p + 1)}
              onDecrement={() => setProposals(p => Math.max(0, p - 1))}
              onChange={setProposals}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || isSubmitting}
            className="min-w-[120px] gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : showSuccess ? (
              <>
                <Check className="h-4 w-4" />
                Salvo!
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Registrar
              </>
            )}
          </Button>
        </div>

        {/* Today's totals */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">Hoje:</span>
          <Badge variant="outline" className="gap-1">
            <Mail className="h-3 w-3" />
            {todayActivity?.contacts_sent || 0}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Phone className="h-3 w-3" />
            {todayActivity?.calls_made || 0}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {todayActivity?.meetings_held || 0}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            {todayActivity?.proposals_sent || 0}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
