import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { Category, Tag } from '../types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type TagRow = Database['public']['Tables']['tags']['Row'];
type TagInsert = Database['public']['Tables']['tags']['Insert'];

export class CategoryService {
    /**
     * Buscar todas as categorias (sistema + usuário)
     */
    static async getAll(userId: string): Promise<Category[]> {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .or(`is_system.eq.true,user_id.eq.${userId}`)
            .order('name');

        if (error) throw error;
        return (data || []).map(transformCategoryFromDB);
    }

    /**
     * Criar nova categoria
     */
    static async create(category: Partial<Category>, userId: string): Promise<Category> {
        const categoryInsert: CategoryInsert = {
            name: category.name!,
            color: category.color!,
            icon: category.icon || null,
            is_system: false,
            user_id: userId,
        };

        const { data, error } = await supabase
            .from('categories')
            .insert(categoryInsert)
            .select()
            .single();

        if (error) throw error;
        return transformCategoryFromDB(data);
    }

    /**
     * Atualizar categoria
     */
    static async update(categoryId: string, updates: Partial<Category>): Promise<Category> {
        const { data, error } = await supabase
            .from('categories')
            .update({
                ...(updates.name && { name: updates.name }),
                ...(updates.color && { color: updates.color }),
                ...(updates.icon !== undefined && { icon: updates.icon }),
            })
            .eq('id', categoryId)
            .select()
            .single();

        if (error) throw error;
        return transformCategoryFromDB(data);
    }

    /**
     * Deletar categoria
     */
    static async delete(categoryId: string): Promise<void> {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);

        if (error) throw error;
    }
}

export class TagService {
    /**
     * Buscar todas as tags do usuário
     */
    static async getAll(userId: string): Promise<Tag[]> {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', userId)
            .order('name');

        if (error) throw error;
        return (data || []).map(transformTagFromDB);
    }

    /**
     * Criar nova tag
     */
    static async create(tag: Partial<Tag>, userId: string): Promise<Tag> {
        const tagInsert: TagInsert = {
            name: tag.name!,
            color: tag.color!,
            user_id: userId,
            usage_count: 0,
        };

        const { data, error } = await supabase
            .from('tags')
            .insert(tagInsert)
            .select()
            .single();

        if (error) throw error;
        return transformTagFromDB(data);
    }

    /**
     * Atualizar tag
     */
    static async update(tagId: string, updates: Partial<Tag>): Promise<Tag> {
        const { data, error } = await supabase
            .from('tags')
            .update({
                ...(updates.name && { name: updates.name }),
                ...(updates.color && { color: updates.color }),
            })
            .eq('id', tagId)
            .select()
            .single();

        if (error) throw error;
        return transformTagFromDB(data);
    }

    /**
     * Deletar tag
     */
    static async delete(tagId: string): Promise<void> {
        const { error } = await supabase
            .from('tags')
            .delete()
            .eq('id', tagId);

        if (error) throw error;
    }

    /**
     * Incrementar contador de uso de uma tag
     */
    static async incrementUsage(tagId: string): Promise<void> {
        const { error } = await supabase.rpc('increment_tag_usage', {
            tag_id: tagId,
        });

        if (error) {
            // Fallback: buscar, incrementar e atualizar
            const { data } = await supabase
                .from('tags')
                .select('usage_count')
                .eq('id', tagId)
                .single();

            if (data) {
                await supabase
                    .from('tags')
                    .update({ usage_count: (data.usage_count || 0) + 1 })
                    .eq('id', tagId);
            }
        }
    }
}

/**
 * Transformar categoria do banco para formato do frontend
 */
function transformCategoryFromDB(dbCategory: CategoryRow): Category {
    return {
        id: dbCategory.id,
        name: dbCategory.name,
        color: dbCategory.color,
        icon: dbCategory.icon || undefined,
        userId: dbCategory.user_id || '',
        isSystem: dbCategory.is_system || false,
        createdAt: dbCategory.created_at || new Date().toISOString(),
    };
}

/**
 * Transformar tag do banco para formato do frontend
 */
function transformTagFromDB(dbTag: TagRow): Tag {
    return {
        id: dbTag.id,
        name: dbTag.name,
        color: dbTag.color,
        userId: dbTag.user_id || '',
        usageCount: dbTag.usage_count || 0,
        createdAt: dbTag.created_at || new Date().toISOString(),
    };
}
