import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export interface RepairRecord {
  id: string;
  repairNumber: string;
  source: string; // 'OFFLINE' or 'ONLINE'
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  address?: string | null;
  device: string;
  problemDescription: string;
  status: string; // PENDING / IN_PROGRESS / COMPLETED / REJECTED
  assignedTo?: string | null;
  assignedToName?: string | null;
  rejectionReason?: string | null;
  createdAt: Date;
}

export function repairFromMap(m: any): RepairRecord {
  return {
    id: m.id,
    repairNumber: m.repair_number,
    source: m.source ?? 'OFFLINE',
    customerId: m.customer_id ?? null,
    customerName: m.customer_name,
    customerPhone: m.customer_phone ?? null,
    address: m.address ?? null,
    device: m.device,
    problemDescription: m.problem_description,
    status: m.status,
    assignedTo: m.assigned_to ?? null,
    assignedToName: m.employees ? m.employees.full_name : null,
    rejectionReason: m.rejection_reason ?? null,
    createdAt: new Date(m.created_at),
  };
}

const SELECT_WITH_TECH = '*, employees(full_name)';

export class RepairService {
  private client = supabase;

  async getOfflineRepairs(): Promise<RepairRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('repairs')
      .select(SELECT_WITH_TECH)
      .eq('owner_id', userId)
      .eq('source', 'OFFLINE')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(repairFromMap);
  }

  async getOnlineRepairs(): Promise<RepairRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('repairs')
      .select(SELECT_WITH_TECH)
      .eq('owner_id', userId)
      .eq('source', 'ONLINE')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(repairFromMap);
  }

  /// Repair history for one specific customer — used inside Customer
  /// Details "Repairs" tab.
  async getRepairsForCustomer(customerId: string): Promise<RepairRecord[]> {
    const { data, error } = await this.client
      .from('repairs')
      .select(SELECT_WITH_TECH)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(repairFromMap);
  }

  async getMyRepairs(employeeId: string): Promise<RepairRecord[]> {
    const { data, error } = await this.client
      .from('repairs')
      .select(SELECT_WITH_TECH)
      .eq('assigned_to', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(repairFromMap);
  }

  /// Creates an OFFLINE repair ticket linked to an existing customer
  /// (picked from the Customer module) — uses the real customer's
  /// id/name/phone rather than free-typed details.
  async createOfflineRepair({
    customerId,
    customerName,
    customerPhone,
    address,
    device,
    problemDescription,
    assignedTo,
  }: {
    customerId: string;
    customerName: string;
    customerPhone?: string;
    address?: string;
    device: string;
    problemDescription: string;
    assignedTo: string;
  }): Promise<void> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data: userData } = await this.client.auth.getUser();
    const currentUser = userData.user;

    const { data: existing, error: fetchError } = await this.client
      .from('repairs')
      .select('repair_number')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    let maxNumber = 0;
    for (const row of existing ?? []) {
      const num = row.repair_number?.toString();
      if (num && num.startsWith('RPR-')) {
        const parsed = parseInt(num.replace('RPR-', ''), 10);
        if (!Number.isNaN(parsed) && parsed > maxNumber) maxNumber = parsed;
      }
    }
    const repairNumber = `RPR-${String(maxNumber + 1).padStart(3, '0')}`;

    const { error } = await this.client.from('repairs').insert({
      repair_number: repairNumber,
      source: 'OFFLINE',
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone ?? null,
      address: address ?? null,
      device,
      problem_description: problemDescription,
      status: 'PENDING',
      assigned_to: assignedTo,
      created_by: currentUser?.id ?? null,
      owner_id: userId,
    });
    if (error) throw error;
  }

  async updateRepairStatus(repairId: string, status: string): Promise<void> {
    const { error } = await this.client.from('repairs').update({ status }).eq('id', repairId);
    if (error) throw error;
  }

  async acceptOnlineRepair({
    repairId,
    assignedTo,
  }: {
    repairId: string;
    assignedTo: string;
  }): Promise<void> {
    const { error } = await this.client
      .from('repairs')
      .update({ status: 'PENDING', assigned_to: assignedTo })
      .eq('id', repairId);
    if (error) throw error;
  }

  async rejectOnlineRepair({
    repairId,
    reason,
  }: {
    repairId: string;
    reason: string;
  }): Promise<void> {
    const { error } = await this.client
      .from('repairs')
      .update({ status: 'REJECTED', rejection_reason: reason })
      .eq('id', repairId);
    if (error) throw error;
  }

  async reassignRepair(repairId: string, newAssignedTo: string): Promise<void> {
    const { error } = await this.client
      .from('repairs')
      .update({ assigned_to: newAssignedTo })
      .eq('id', repairId);
    if (error) throw error;
  }
}