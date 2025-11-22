import React from 'react';
import type { TeamMember } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, Edit, MoreVertical, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getRoleLabel, getDepartmentLabel } from '../utils/permissions';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit?: () => void;
  onViewDetails?: () => void;
  onRemove?: () => void;
  variant?: 'grid' | 'compact';
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  onEdit,
  onViewDetails,
  onRemove,
  variant = 'grid',
}) => {
  // Gera iniciais para o avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Define a cor do badge baseado no status
  const getStatusBadge = (status: TeamMember['status']) => {
    const variants: Record<
      TeamMember['status'],
      { label: string; className: string }
    > = {
      active: {
        label: 'Ativo',
        className:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      inactive: {
        label: 'Inativo',
        className:
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      on_leave: {
        label: 'Afastado',
        className:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      terminated: {
        label: 'Desligado',
        className:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  // Define a cor do badge baseado no cargo
  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ceo: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      c_level:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      director:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      manager:
        'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      team_lead:
        'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      senior:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      mid_level:
        'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
      junior:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      intern:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return (
      colors[role] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    );
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.user.avatarUrl} alt={member.user.fullName} />
            <AvatarFallback>{getInitials(member.user.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{member.user.fullName}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                {getRoleLabel(member.role)}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                {getDepartmentLabel(member.department)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {getStatusBadge(member.status)}
          {(onEdit || onViewDetails || onRemove) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewDetails && (
                  <DropdownMenuItem onClick={onViewDetails}>
                    <User className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <DropdownMenuItem onClick={onRemove} className="text-destructive">
                    Remover
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Avatar */}
        <Avatar className="h-20 w-20">
          <AvatarImage src={member.user.avatarUrl} alt={member.user.fullName} />
          <AvatarFallback className="text-xl">
            {getInitials(member.user.fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Nome e cargo */}
        <div className="space-y-2 w-full">
          <h3 className="font-semibold text-lg">{member.user.fullName}</h3>
          <div className="flex flex-col gap-2">
            <Badge className={getRoleBadgeColor(member.role)}>
              {getRoleLabel(member.role)}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {getDepartmentLabel(member.department)}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="w-full">{getStatusBadge(member.status)}</div>

        {/* Contato */}
        <div className="w-full space-y-2 text-sm">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{member.user.email}</span>
          </div>
        </div>

        {/* Ações */}
        {(onViewDetails || onEdit || onRemove) && (
          <div className="w-full flex gap-2 pt-2">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
                <User className="mr-2 h-4 w-4" />
                Ver Perfil
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TeamMemberCard;
