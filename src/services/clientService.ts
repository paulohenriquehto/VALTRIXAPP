import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { Client, Payment } from '../types';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export class ClientService {
    /**
     * Buscar todos os clientes do usuário
     */
    static async getAll(userId: string): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select(`
        *,
        created_by:users(*)
      `)
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(transformClientFromDB);
    }

    /**
     * Buscar cliente por ID
     */
    static async getById(clientId: string): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .select(`
        *,
        created_by:users(*)
      `)
            .eq('id', clientId)
            .single();

        if (error) throw error;
        return transformClientFromDB(data);
    }

    /**
     * Criar novo cliente
     */
    static async create(client: Partial<Client>, userId: string): Promise<Client> {
        const clientInsert: ClientInsert = {
            company_name: client.companyName!,
            segment: client.segment!,
            contact_person: client.contactPerson || null,
            email: client.email || null,
            phone: client.phone || null,
            monthly_value: client.monthlyValue || 0,
            contract_start_date: client.contractStartDate || new Date().toISOString(),
            payment_due_day: client.paymentDueDay || 1,
            payment_method: client.paymentMethod || 'pix',
            payment_status: client.paymentStatus || 'pending',
            status: client.status || 'active',
            notes: client.notes || null,
            logo_url: client.logoUrl || null,
            created_by: userId,
        };

        const { data, error } = await supabase
            .from('clients')
            .insert(clientInsert)
            .select(`
        *,
        created_by:users(*)
      `)
            .single();

        if (error) throw error;
        return transformClientFromDB(data);
    }

    /**
     * Atualizar cliente
     */
    static async update(clientId: string, updates: Partial<Client>): Promise<Client> {
        const clientUpdate: ClientUpdate = {
            ...(updates.companyName && { company_name: updates.companyName }),
            ...(updates.segment && { segment: updates.segment }),
            ...(updates.contactPerson !== undefined && { contact_person: updates.contactPerson }),
            ...(updates.email !== undefined && { email: updates.email }),
            ...(updates.phone !== undefined && { phone: updates.phone }),
            ...(updates.monthlyValue !== undefined && { monthly_value: updates.monthlyValue }),
            ...(updates.contractStartDate !== undefined && { contract_start_date: updates.contractStartDate }),
            ...(updates.paymentDueDay !== undefined && { payment_due_day: updates.paymentDueDay }),
            ...(updates.paymentMethod && { payment_method: updates.paymentMethod }),
            ...(updates.paymentStatus && { payment_status: updates.paymentStatus }),
            ...(updates.status && { status: updates.status }),
            ...(updates.notes !== undefined && { notes: updates.notes }),
            ...(updates.logoUrl !== undefined && { logo_url: updates.logoUrl }),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('clients')
            .update(clientUpdate)
            .eq('id', clientId)
            .select(`
        *,
        created_by:users(*)
      `)
            .single();

        if (error) throw error;
        return transformClientFromDB(data);
    }

    /**
     * Deletar cliente
     */
    static async delete(clientId: string): Promise<void> {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (error) throw error;
    }

    /**
     * Buscar pagamentos de um cliente
     */
    static async getPayments(clientId: string): Promise<Payment[]> {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('client_id', clientId)
            .order('due_date', { ascending: false });

        if (error) throw error;
        return (data || []).map(transformPaymentFromDB);
    }

    /**
     * Criar pagamento
     */
    static async createPayment(payment: Partial<Payment>): Promise<Payment> {
        const { data, error } = await supabase
            .from('payments')
            .insert({
                client_id: payment.clientId!,
                amount: payment.amount!,
                due_date: payment.dueDate!,
                method: payment.method!,
                status: payment.status || 'pending',
                notes: payment.notes || null,
                paid_date: payment.paidDate || null,
            })
            .select()
            .single();

        if (error) throw error;
        return transformPaymentFromDB(data);
    }

    /**
     * Atualizar status de pagamento
     */
    static async updatePaymentStatus(
        paymentId: string,
        status: Database['public']['Enums']['payment_status'],
        paidDate?: string
    ): Promise<Payment> {
        const { data, error } = await supabase
            .from('payments')
            .update({
                status,
                paid_date: paidDate || null,
            })
            .eq('id', paymentId)
            .select()
            .single();

        if (error) throw error;
        return transformPaymentFromDB(data);
    }
}

/**
 * Transformar cliente do banco para formato do frontend
 */
function transformClientFromDB(dbClient: any): Client {
    return {
        id: dbClient.id,
        companyName: dbClient.company_name,
        segment: dbClient.segment,
        contactPerson: dbClient.contact_person || undefined,
        email: dbClient.email || undefined,
        phone: dbClient.phone || undefined,
        monthlyValue: dbClient.monthly_value || 0,
        contractStartDate: dbClient.contract_start_date,
        paymentDueDay: dbClient.payment_due_day,
        paymentMethod: dbClient.payment_method,
        paymentStatus: dbClient.payment_status,
        status: dbClient.status,
        notes: dbClient.notes || undefined,
        logoUrl: dbClient.logo_url || undefined,
        createdBy: dbClient.created_by ? {
            id: dbClient.created_by.id,
            email: dbClient.created_by.email,
            fullName: dbClient.created_by.full_name || 'Usuário',
            avatarUrl: dbClient.created_by.avatar_url || undefined,
            timezone: dbClient.created_by.timezone || 'UTC',
            theme: dbClient.created_by.theme as any || 'light',
            isActive: dbClient.created_by.is_active || true,
            createdAt: dbClient.created_by.created_at,
            updatedAt: dbClient.created_by.updated_at || new Date().toISOString(),
        } : undefined,
        createdAt: dbClient.created_at,
        updatedAt: dbClient.updated_at || dbClient.created_at,
    };
}

/**
 * Transformar pagamento do banco para formato do frontend
 */
function transformPaymentFromDB(dbPayment: any): Payment {
    return {
        id: dbPayment.id,
        clientId: dbPayment.client_id,
        amount: dbPayment.amount,
        dueDate: dbPayment.due_date,
        paidDate: dbPayment.paid_date || undefined,
        method: dbPayment.method,
        status: dbPayment.status,
        notes: dbPayment.notes || undefined,
        createdAt: dbPayment.created_at,
    };
}
