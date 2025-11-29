import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { Task } from '../types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export class TaskService {
    /**
     * Buscar todas as tarefas do usuário autenticado
     */
    static async getAll(userId: string): Promise<Task[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        category:categories(*),
        project:projects(*, client:clients(*)),
        assignee:users!tasks_assignee_id_fkey(*),
        created_by:users!tasks_created_by_fkey(*),
        tags:task_tags(tag:tags(*))
      `)
            .or(`created_by.eq.${userId},assignee_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transformar para o formato esperado pelo frontend
        return (data || []).map(transformTaskFromDB);
    }

    /**
     * Buscar uma tarefa específica por ID
     */
    static async getById(taskId: string): Promise<Task> {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        category:categories(*),
        project:projects(*, client:clients(*)),
        assignee:users!tasks_assignee_id_fkey(*),
        created_by:users!tasks_created_by_fkey(*),
        tags:task_tags(tag:tags(*)),
        attachments(*),
        comments(*, author:users(*))
      `)
            .eq('id', taskId)
            .single();

        if (error) throw error;
        return transformTaskFromDB(data);
    }

    /**
     * Criar nova tarefa
     */
    static async create(task: Partial<Task>, userId: string): Promise<Task> {
        const taskInsert: TaskInsert = {
            title: task.title!,
            description: task.description || null,
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            progress: task.progress || 0,
            due_date: task.dueDate || null,
            estimated_time: task.estimatedTime || null,
            category_id: task.category?.id || null,
            project_id: task.project?.id || null,
            assignee_id: task.assignee?.id || null,
            created_by: userId,
        };

        const { data, error } = await supabase
            .from('tasks')
            .insert(taskInsert)
            .select(`
        *,
        category:categories(*),
        project:projects(*, client:clients(*)),
        assignee:users!tasks_assignee_id_fkey(*),
        created_by:users!tasks_created_by_fkey(*)
      `)
            .single();

        if (error) throw error;

        // Se houver tags, criar os relacionamentos
        if (task.tags && task.tags.length > 0 && data) {
            await Promise.all(
                task.tags.map(tag =>
                    supabase.from('task_tags').insert({
                        task_id: data.id,
                        tag_id: tag.id,
                    })
                )
            );
        }

        return transformTaskFromDB(data);
    }

    /**
     * Atualizar tarefa existente
     */
    static async update(taskId: string, updates: Partial<Task>): Promise<Task> {
        const taskUpdate: TaskUpdate = {
            ...(updates.title && { title: updates.title }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.status && { status: updates.status }),
            ...(updates.priority && { priority: updates.priority }),
            ...(updates.progress !== undefined && { progress: updates.progress }),
            ...(updates.dueDate !== undefined && { due_date: updates.dueDate }),
            ...(updates.estimatedTime !== undefined && { estimated_time: updates.estimatedTime }),
            ...(updates.actualTime !== undefined && { actual_time: updates.actualTime }),
            ...(updates.category && { category_id: updates.category.id }),
            ...(updates.project !== undefined && { project_id: updates.project?.id || null }),
            ...(updates.assignee !== undefined && { assignee_id: updates.assignee?.id || null }),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('tasks')
            .update(taskUpdate)
            .eq('id', taskId)
            .select(`
        *,
        category:categories(*),
        project:projects(*, client:clients(*)),
        assignee:users!tasks_assignee_id_fkey(*),
        created_by:users!tasks_created_by_fkey(*)
      `)
            .single();

        if (error) throw error;

        // Atualizar tags se fornecidas
        if (updates.tags !== undefined) {
            // Remover tags antigas
            await supabase.from('task_tags').delete().eq('task_id', taskId);

            // Adicionar novas tags
            if (updates.tags.length > 0) {
                await Promise.all(
                    updates.tags.map(tag =>
                        supabase.from('task_tags').insert({
                            task_id: taskId,
                            tag_id: tag.id,
                        })
                    )
                );
            }
        }

        return transformTaskFromDB(data);
    }

    /**
     * Deletar tarefa
     */
    static async delete(taskId: string): Promise<void> {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
    }

    /**
     * Buscar tarefas por filtros
     */
    static async getByFilters(userId: string, filters: {
        status?: string[];
        priority?: string[];
        categoryId?: string;
        projectId?: string;
        assigneeId?: string;
    }): Promise<Task[]> {
        let query = supabase
            .from('tasks')
            .select(`
        *,
        category:categories(*),
        project:projects(*, client:clients(*)),
        assignee:users!tasks_assignee_id_fkey(*),
        created_by:users!tasks_created_by_fkey(*),
        tags:task_tags(tag:tags(*))
      `)
            .or(`created_by.eq.${userId},assignee_id.eq.${userId}`);

        if (filters.status && filters.status.length > 0) {
            query = query.in('status', filters.status);
        }

        if (filters.priority && filters.priority.length > 0) {
            query = query.in('priority', filters.priority);
        }

        if (filters.categoryId) {
            query = query.eq('category_id', filters.categoryId);
        }

        if (filters.projectId) {
            if (filters.projectId === 'none') {
                query = query.is('project_id', null);
            } else {
                query = query.eq('project_id', filters.projectId);
            }
        }

        if (filters.assigneeId) {
            query = query.eq('assignee_id', filters.assigneeId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(transformTaskFromDB);
    }
}

/**
 * Transformar dados do banco para o formato do frontend
 */
function transformTaskFromDB(dbTask: any): Task {
    return {
        id: dbTask.id,
        title: dbTask.title,
        description: dbTask.description || undefined,
        status: dbTask.status,
        priority: dbTask.priority,
        progress: dbTask.progress || 0,
        dueDate: dbTask.due_date || undefined,
        estimatedTime: dbTask.estimated_time || undefined,
        actualTime: dbTask.actual_time || undefined,
        category: dbTask.category ? {
            id: dbTask.category.id,
            name: dbTask.category.name,
            color: dbTask.category.color,
            icon: dbTask.category.icon || undefined,
            userId: dbTask.category.user_id,
            isSystem: dbTask.category.is_system || false,
            createdAt: dbTask.category.created_at,
        } : undefined,
        project: dbTask.project ? {
            id: dbTask.project.id,
            name: dbTask.project.name,
            description: dbTask.project.description || undefined,
            status: dbTask.project.status,
            startDate: dbTask.project.start_date || undefined,
            endDate: dbTask.project.end_date || undefined,
            budget: dbTask.project.budget || 0,
            deadline: dbTask.project.deadline || undefined,
            client: dbTask.project.client ? {
                id: dbTask.project.client.id,
                companyName: dbTask.project.client.company_name,
                segment: dbTask.project.client.segment,
                contactPerson: dbTask.project.client.contact_person,
                email: dbTask.project.client.email,
                phone: dbTask.project.client.phone || undefined,
                logoUrl: dbTask.project.client.logo_url || undefined,
                clientType: dbTask.project.client.client_type,
                monthlyValue: dbTask.project.client.monthly_value || 0,
                contractStartDate: dbTask.project.client.contract_start_date,
                paymentDueDay: dbTask.project.client.payment_due_day || 1,
                paymentStatus: dbTask.project.client.payment_status,
                paymentMethod: dbTask.project.client.payment_method,
                status: dbTask.project.client.status,
                createdAt: dbTask.project.client.created_at,
                updatedAt: dbTask.project.client.updated_at,
            } : undefined,
            createdAt: dbTask.project.created_at,
            updatedAt: dbTask.project.updated_at,
        } as any : undefined,
        tags: dbTask.tags?.map((tt: any) => ({
            id: tt.tag.id,
            name: tt.tag.name,
            color: tt.tag.color,
            userId: tt.tag.user_id,
            usageCount: tt.tag.usage_count || 0,
            createdAt: tt.tag.created_at,
        })) || [],
        assignee: dbTask.assignee ? {
            id: dbTask.assignee.id,
            email: dbTask.assignee.email,
            fullName: dbTask.assignee.full_name || 'Usuário',
            avatarUrl: dbTask.assignee.avatar_url || undefined,
            timezone: dbTask.assignee.timezone || 'UTC',
            theme: dbTask.assignee.theme as any || 'light',
            isActive: dbTask.assignee.is_active || true,
            createdAt: dbTask.assignee.created_at,
            updatedAt: dbTask.assignee.updated_at || new Date().toISOString(),
        } : undefined,
        createdBy: dbTask.created_by ? {
            id: dbTask.created_by.id,
            email: dbTask.created_by.email,
            fullName: dbTask.created_by.full_name || 'Usuário',
            avatarUrl: dbTask.created_by.avatar_url || undefined,
            timezone: dbTask.created_by.timezone || 'UTC',
            theme: dbTask.created_by.theme as any || 'light',
            isActive: dbTask.created_by.is_active || true,
            createdAt: dbTask.created_by.created_at,
            updatedAt: dbTask.created_by.updated_at || new Date().toISOString(),
        } : {
            id: dbTask.created_by,
            email: 'unknown@email.com',
            fullName: 'Usuário',
            timezone: 'UTC',
            theme: 'light',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        attachments: dbTask.attachments?.map((a: any) => ({
            id: a.id,
            filename: a.filename,
            originalName: a.original_name,
            url: a.url,
            mimeType: a.mime_type || undefined,
            size: a.size || undefined,
            uploadedBy: a.uploaded_by,
            uploadedAt: a.created_at,
        })) || [],
        comments: dbTask.comments?.map((c: any) => ({
            id: c.id,
            content: c.content,
            author: c.author ? {
                id: c.author.id,
                email: c.author.email,
                fullName: c.author.full_name || 'Usuário',
                avatarUrl: c.author.avatar_url || undefined,
                timezone: c.author.timezone || 'UTC',
                theme: c.author.theme as any || 'light',
                isActive: c.author.is_active || true,
                createdAt: c.author.created_at,
                updatedAt: c.author.updated_at || new Date().toISOString(),
            } : undefined,
            createdAt: c.created_at,
            updatedAt: c.updated_at || c.created_at,
        })) || [],
        createdAt: dbTask.created_at,
        updatedAt: dbTask.updated_at || dbTask.created_at,
    };
}
