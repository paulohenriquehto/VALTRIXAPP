import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { Project, ProjectNote, ProjectDocument, User } from '../types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export class ProjectService {
  // ============================================
  // CRUD de Projetos
  // ============================================

  static async getAll(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        created_by:users(*)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformProjectFromDB);
  }

  static async getById(projectId: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        created_by:users(*),
        notes:project_notes(*, created_by:users(*)),
        documents:project_documents(*, uploaded_by:users(*)),
        tasks(*, category:categories(*), assignee:users!tasks_assignee_id_fkey(*))
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return transformProjectFromDB(data);
  }

  static async getByClient(clientId: string, userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        created_by:users(*)
      `)
      .eq('client_id', clientId)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformProjectFromDB);
  }

  static async create(project: Partial<Project>, userId: string): Promise<Project> {
    const projectInsert: ProjectInsert = {
      name: project.name!,
      description: project.description || null,
      client_id: project.client!.id,
      status: project.status || 'planning',
      start_date: project.startDate || null,
      end_date: project.endDate || null,
      budget: project.budget || 0,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(projectInsert)
      .select(`
        *,
        client:clients(*),
        created_by:users(*)
      `)
      .single();

    if (error) throw error;
    return transformProjectFromDB(data);
  }

  static async update(projectId: string, updates: Partial<Project>): Promise<Project> {
    const projectUpdate: ProjectUpdate = {
      ...(updates.name && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.client && { client_id: updates.client.id }),
      ...(updates.status && { status: updates.status }),
      ...(updates.startDate !== undefined && { start_date: updates.startDate }),
      ...(updates.endDate !== undefined && { end_date: updates.endDate }),
      ...(updates.budget !== undefined && { budget: updates.budget }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('projects')
      .update(projectUpdate)
      .eq('id', projectId)
      .select(`
        *,
        client:clients(*),
        created_by:users(*)
      `)
      .single();

    if (error) throw error;
    return transformProjectFromDB(data);
  }

  static async delete(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }

  // ============================================
  // Notes
  // ============================================

  static async getNotes(projectId: string): Promise<ProjectNote[]> {
    const { data, error } = await supabase
      .from('project_notes')
      .select('*, created_by:users(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformNoteFromDB);
  }

  static async createNote(note: Partial<ProjectNote>, userId: string): Promise<ProjectNote> {
    const { data, error } = await supabase
      .from('project_notes')
      .insert({
        project_id: note.projectId!,
        title: note.title!,
        content: note.content!,
        created_by: userId,
      })
      .select('*, created_by:users(*)')
      .single();

    if (error) throw error;
    return transformNoteFromDB(data);
  }

  static async updateNote(noteId: string, updates: Partial<ProjectNote>): Promise<ProjectNote> {
    const { data, error } = await supabase
      .from('project_notes')
      .update({
        ...(updates.title && { title: updates.title }),
        ...(updates.content && { content: updates.content }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .select('*, created_by:users(*)')
      .single();

    if (error) throw error;
    return transformNoteFromDB(data);
  }

  static async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  }

  // ============================================
  // Documents
  // ============================================

  static async getDocuments(projectId: string): Promise<ProjectDocument[]> {
    const { data, error } = await supabase
      .from('project_documents')
      .select('*, uploaded_by:users(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformDocumentFromDB);
  }

  static async uploadDocument(
    projectId: string,
    file: File,
    userId: string
  ): Promise<ProjectDocument> {
    // 1. Upload para Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 2. Criar registro no banco
    const { data, error } = await supabase
      .from('project_documents')
      .insert({
        project_id: projectId,
        filename: fileName,
        original_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: uploadData.path,
        uploaded_by: userId,
      })
      .select('*, uploaded_by:users(*)')
      .single();

    if (error) throw error;
    return transformDocumentFromDB(data);
  }

  static async deleteDocument(documentId: string): Promise<void> {
    // 1. Buscar documento para pegar storage_path
    const { data: doc, error: fetchError } = await supabase
      .from('project_documents')
      .select('storage_path')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Deletar do Storage
    const { error: storageError } = await supabase.storage
      .from('project-documents')
      .remove([doc.storage_path]);

    if (storageError) throw storageError;

    // 3. Deletar registro do banco
    const { error } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  }

  static async getDocumentUrl(storagePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('project-documents')
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }
}

// ============================================
// Transformers
// ============================================

function transformProjectFromDB(dbProject: any): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description || undefined,
    client: {
      id: dbProject.client.id,
      companyName: dbProject.client.company_name,
      segment: dbProject.client.segment,
      contactPerson: dbProject.client.contact_person,
      email: dbProject.client.email,
      phone: dbProject.client.phone || undefined,
      logoUrl: dbProject.client.logo_url || undefined,
      monthlyValue: dbProject.client.monthly_value || 0,
      contractStartDate: dbProject.client.contract_start_date,
      paymentDueDay: dbProject.client.payment_due_day,
      paymentStatus: dbProject.client.payment_status,
      paymentMethod: dbProject.client.payment_method,
      status: dbProject.client.status,
      notes: dbProject.client.notes || undefined,
      createdAt: dbProject.client.created_at,
      updatedAt: dbProject.client.updated_at || dbProject.client.created_at,
      createdBy: transformUserFromDB(dbProject.client.created_by),
    },
    status: dbProject.status,
    startDate: dbProject.start_date || undefined,
    endDate: dbProject.end_date || undefined,
    budget: dbProject.budget || 0,
    createdBy: transformUserFromDB(dbProject.created_by),
    createdAt: dbProject.created_at,
    updatedAt: dbProject.updated_at || dbProject.created_at,
    notes: dbProject.notes?.map(transformNoteFromDB) || undefined,
    documents: dbProject.documents?.map(transformDocumentFromDB) || undefined,
    tasks: dbProject.tasks?.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      status: t.status,
      priority: t.priority,
      progress: t.progress || 0,
      dueDate: t.due_date || undefined,
      estimatedTime: t.estimated_time || undefined,
      actualTime: t.actual_time || undefined,
      category: t.category ? {
        id: t.category.id,
        name: t.category.name,
        color: t.category.color,
        icon: t.category.icon || undefined,
        userId: t.category.user_id,
        isSystem: t.category.is_system || false,
        createdAt: t.category.created_at,
      } : undefined,
      assignee: t.assignee ? transformUserFromDB(t.assignee) : undefined,
      createdBy: transformUserFromDB(t.created_by || {}),
      tags: [],
      attachments: [],
      comments: [],
      createdAt: t.created_at,
      updatedAt: t.updated_at || t.created_at,
    })) || undefined,
  };
}

function transformNoteFromDB(dbNote: any): ProjectNote {
  return {
    id: dbNote.id,
    projectId: dbNote.project_id,
    title: dbNote.title,
    content: dbNote.content,
    createdBy: transformUserFromDB(dbNote.created_by),
    createdAt: dbNote.created_at,
    updatedAt: dbNote.updated_at || dbNote.created_at,
  };
}

function transformDocumentFromDB(dbDoc: any): ProjectDocument {
  return {
    id: dbDoc.id,
    projectId: dbDoc.project_id,
    filename: dbDoc.filename,
    originalName: dbDoc.original_name,
    fileType: dbDoc.file_type || undefined,
    fileSize: dbDoc.file_size || undefined,
    storagePath: dbDoc.storage_path,
    uploadedBy: transformUserFromDB(dbDoc.uploaded_by),
    createdAt: dbDoc.created_at,
  };
}

function transformUserFromDB(dbUser: any): User {
  if (!dbUser || !dbUser.id) {
    return {
      id: '',
      email: 'unknown@email.com',
      fullName: 'Usuário',
      timezone: 'UTC',
      theme: 'light',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name || 'Usuário',
    avatarUrl: dbUser.avatar_url || undefined,
    timezone: dbUser.timezone || 'UTC',
    theme: (dbUser.theme as any) || 'light',
    isActive: dbUser.is_active || true,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at || new Date().toISOString(),
  };
}
