import { supabase } from '../lib/supabase';
import type { TeamMember, TeamInvite, User } from '../types';
import type { Database } from '../types/supabase';



export const TeamService = {
    // --- Membros ---

    async getAllMembers(): Promise<TeamMember[]> {
        const { data, error } = await supabase
            .from('team_members')
            .select(`
        *,
        user:users (*)
      `);

        if (error) throw error;

        const members = data.map((row: any) => this.mapToTeamMember(row));

        // Popula subordinates
        members.forEach(member => {
            member.subordinates = members
                .filter(m => m.managerId === member.id)
                .map(m => m.id);
        });

        return members;
    },

    async getMemberById(id: string): Promise<TeamMember | null> {
        const { data, error } = await supabase
            .from('team_members')
            .select(`
        *,
        user:users (*)
      `)
            .eq('id', id)
            .single();

        if (error) return null;
        return this.mapToTeamMember(data);
    },

    async createMember(member: Partial<TeamMember>, userId: string): Promise<TeamMember> {
        const dbMember: Database['public']['Tables']['team_members']['Insert'] = {
            id: member.id,
            user_id: userId,
            role: member.role as any,
            department: member.department as any,
            permissions: member.permissions as any,
            manager_id: member.managerId,
            status: member.status as any,
            hire_date: member.hireDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('team_members')
            .insert(dbMember)
            .select(`*, user:users (*)`)
            .single();

        if (error) throw error;
        return this.mapToTeamMember(data);
    },

    async updateMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
        const dbUpdates: Database['public']['Tables']['team_members']['Update'] = {
            updated_at: new Date().toISOString(),
        };

        if (updates.role) dbUpdates.role = updates.role as any;
        if (updates.department) dbUpdates.department = updates.department as any;
        if (updates.permissions) dbUpdates.permissions = updates.permissions as any;
        if (updates.managerId !== undefined) dbUpdates.manager_id = updates.managerId;
        if (updates.status) dbUpdates.status = updates.status as any;
        if (updates.hireDate) dbUpdates.hire_date = updates.hireDate;

        const { data, error } = await supabase
            .from('team_members')
            .update(dbUpdates)
            .eq('id', id)
            .select(`*, user:users (*)`)
            .single();

        if (error) throw error;
        return this.mapToTeamMember(data);
    },

    async deleteMember(id: string): Promise<void> {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Convites ---

    async getAllInvites(): Promise<TeamInvite[]> {
        const { data, error } = await supabase
            .from('team_invites')
            .select(`
        *,
        invited_by_user:users!team_invites_invited_by_fkey (*)
      `);

        if (error) throw error;
        return data.map((row: any) => this.mapToTeamInvite(row));
    },

    async createInvite(invite: Partial<TeamInvite>): Promise<TeamInvite> {
        const dbInvite: Database['public']['Tables']['team_invites']['Insert'] = {
            email: invite.email!,
            name: invite.name!,
            role: invite.role as any,
            department: invite.department as any,
            permissions: invite.permissions as any,
            manager_id: invite.managerId,
            invited_by: invite.invitedBy?.id,
            status: 'pending',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        const { data, error } = await supabase
            .from('team_invites')
            .insert(dbInvite)
            .select(`
        *,
        invited_by_user:users!team_invites_invited_by_fkey (*)
      `)
            .single();

        if (error) throw error;
        return this.mapToTeamInvite(data);
    },

    async deleteInvite(id: string): Promise<void> {
        const { error } = await supabase
            .from('team_invites')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async resendInvite(id: string): Promise<TeamInvite> {
        const { data, error } = await supabase
            .from('team_invites')
            .update({
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(`
                *,
                invited_by_user:users!team_invites_invited_by_fkey (*)
            `)
            .single();

        if (error) throw error;
        return this.mapToTeamInvite(data);
    },

    // --- Mappers ---

    mapToTeamMember(row: any): TeamMember {
        return {
            id: row.id,
            user: {
                id: row.user?.id || row.user_id,
                email: row.user?.email || '',
                fullName: row.user?.full_name || '',
                avatarUrl: row.user?.avatar_url,
                timezone: row.user?.timezone || 'America/Sao_Paulo',
                theme: row.user?.theme || 'light',
                isActive: row.user?.is_active ?? true,
                createdAt: row.user?.created_at || new Date().toISOString(),
                updatedAt: row.user?.updated_at || new Date().toISOString(),
            },
            role: row.role,
            department: row.department,
            permissions: row.permissions,
            managerId: row.manager_id,
            subordinates: [],
            hireDate: row.hire_date,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },

    mapToTeamInvite(row: any): TeamInvite {
        const invitedByUser = row.invited_by_user || {};

        const invitedBy: User = {
            id: invitedByUser.id || row.invited_by || '',
            email: invitedByUser.email || '',
            fullName: invitedByUser.full_name || 'Unknown',
            avatarUrl: invitedByUser.avatar_url,
            timezone: invitedByUser.timezone || 'America/Sao_Paulo',
            theme: invitedByUser.theme || 'light',
            isActive: invitedByUser.is_active ?? true,
            createdAt: invitedByUser.created_at || new Date().toISOString(),
            updatedAt: invitedByUser.updated_at || new Date().toISOString(),
        };

        return {
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            department: row.department,
            permissions: row.permissions,
            managerId: row.manager_id || undefined,
            invitedBy: invitedBy,
            status: row.status,
            createdAt: row.created_at || new Date().toISOString(),
            expiresAt: row.expires_at || new Date().toISOString(),
        };
    }
};
