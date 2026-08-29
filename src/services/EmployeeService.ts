import { supabase } from '../lib/supabase';

// ============================================================
// TYPES
// ============================================================

export interface DepartmentRecord {
  id: string;
  name: string;
}
export function departmentFromMap(m: any): DepartmentRecord {
  return { id: m.id, name: m.name };
}

export interface RoleRecord {
  id: string;
  name: string;
  description?: string | null;
}
export function roleFromMap(m: any): RoleRecord {
  return { id: m.id, name: m.name, description: m.description ?? null };
}

export interface EmployeeRecord {
  id: string;
  employeeCode: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  profilePhotoUrl?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  designation?: string | null;
  joiningDate: Date;
  employmentType: string;
  reportingManagerId?: string | null;
  reportingManagerName?: string | null;
  basicSalary: number;
  allowances: number;
  deductions: number;
  status: string;
  roleName?: string | null;
}
export function netSalary(e: EmployeeRecord): number {
  return e.basicSalary + e.allowances - e.deductions;
}
export function employeeFromMap(m: any): EmployeeRecord {
  return {
    id: m.id,
    employeeCode: m.employee_code,
    fullName: m.full_name,
    phone: m.phone ?? null,
    email: m.email ?? null,
    address: m.address ?? null,
    dateOfBirth: m.date_of_birth ? new Date(m.date_of_birth) : null,
    gender: m.gender ?? null,
    profilePhotoUrl: m.profile_photo_url ?? null,
    departmentId: m.department_id ?? null,
    departmentName: m.departments ? m.departments.name : null,
    designation: m.designation ?? null,
    joiningDate: new Date(m.joining_date),
    employmentType: m.employment_type ?? 'FULL_TIME',
    reportingManagerId: m.reporting_manager_id ?? null,
    reportingManagerName: m.reporting_manager ? m.reporting_manager.full_name : null,
    basicSalary: Number(m.basic_salary ?? 0),
    allowances: Number(m.allowances ?? 0),
    deductions: Number(m.deductions ?? 0),
    status: m.status ?? 'ACTIVE',
    roleName: m.role_name ?? null,
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  date: Date;
  status: string;
  checkIn?: Date | null;
  checkOut?: Date | null;
}
export function attendanceFromMap(m: any): AttendanceRecord {
  return {
    id: m.id,
    employeeId: m.employee_id,
    employeeName: m.employees ? m.employees.full_name : null,
    date: new Date(m.attendance_date),
    status: m.status,
    checkIn: m.check_in ? new Date(m.check_in) : null,
    checkOut: m.check_out ? new Date(m.check_out) : null,
  };
}

export interface LeaveRequestRecord {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  leaveTypeName?: string | null;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
  status: string;
}
export function leaveRequestFromMap(m: any): LeaveRequestRecord {
  return {
    id: m.id,
    employeeId: m.employee_id,
    employeeName: m.employees ? m.employees.full_name : null,
    leaveTypeName: m.leave_types ? m.leave_types.name : null,
    startDate: new Date(m.start_date),
    endDate: new Date(m.end_date),
    reason: m.reason ?? null,
    status: m.status,
  };
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  payrollMonth: Date;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  paymentStatus: string;
}
export function payrollFromMap(m: any): PayrollRecord {
  return {
    id: m.id,
    employeeId: m.employee_id,
    employeeName: m.employees ? m.employees.full_name : null,
    payrollMonth: new Date(m.payroll_month),
    basicSalary: Number(m.basic_salary),
    allowances: Number(m.allowances),
    bonus: Number(m.bonus),
    deductions: Number(m.deductions),
    netSalary: Number(m.net_salary),
    paymentStatus: m.payment_status,
  };
}

export interface ActivityLogRecord {
  id: string;
  employeeName?: string | null;
  module: string;
  action: string;
  description?: string | null;
  createdAt: Date;
}
export function activityLogFromMap(m: any): ActivityLogRecord {
  return {
    id: m.id,
    employeeName: m.employees ? m.employees.full_name : null,
    module: m.module ?? '',
    action: m.action ?? '',
    description: m.description ?? null,
    createdAt: new Date(m.created_at),
  };
}

export interface LocalFile {
  uri: string;
  name?: string;
  type?: string;
}

// ============================================================
// SERVICE
// ============================================================

export class EmployeeService {
  private client = supabase;

  static readonly profileBucket = 'employee-profiles';

  async uploadEmployeeProfilePhoto(file: LocalFile, employeeCode: string): Promise<string> {
    console.log('========== PROFILE PHOTO UPLOAD START ==========');
    try {
      console.log('File uri:', file.uri);
      const extension = (file.name ?? file.uri).split('.').pop()?.toLowerCase() ?? 'jpg';
      console.log('File extension:', extension);
      console.log('Storage bucket:', EmployeeService.profileBucket);

      const currentUser = (await this.client.auth.getUser()).data.user;
      console.log('Supabase current user:', currentUser?.id);

      const filePath = `${employeeCode}/${Date.now()}.${extension}`;
      console.log('Storage file path:', filePath);

      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();

      console.log('Starting Supabase Storage upload...');
      const { error: uploadError } = await this.client.storage
        .from(EmployeeService.profileBucket)
        .upload(filePath, arrayBuffer, { contentType: file.type ?? `image/${extension}` });

      if (uploadError) throw uploadError;
      console.log('✅ STORAGE UPLOAD SUCCESS');

      const { data } = this.client.storage.from(EmployeeService.profileBucket).getPublicUrl(filePath);
      console.log('Generated public URL:', data.publicUrl);
      return data.publicUrl;
    } catch (e) {
      console.log('========== PROFILE PHOTO UPLOAD FAILED ==========');
      console.log('ERROR:', e);
      throw e;
    }
  }

  async getDepartments(): Promise<DepartmentRecord[]> {
    const { data, error } = await this.client.from('departments').select().order('name');
    if (error) throw error;
    return (data ?? []).map(departmentFromMap);
  }

  async getRoles(): Promise<RoleRecord[]> {
    try {
      const { data, error } = await this.client.from('roles').select().order('name');
      if (error) throw error;
      return (data ?? []).map(roleFromMap);
    } catch (e) {
      console.log('GET ROLES FAILED', e);
      throw e;
    }
  }

  async getEmployees(): Promise<EmployeeRecord[]> {
    const { data, error } = await this.client
      .from('employees')
      .select('*, departments(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(employeeFromMap);
  }

  async getEmployeeByAuthUserId(authUserId: string): Promise<{ id: string; full_name: string } | null> {
    try {
      const { data, error } = await this.client
        .from('employees')
        .select('id, full_name')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.log('Error fetching employee by auth_user_id:', e);
      return null;
    }
  }

  async getOrLinkEmployeeByAuthUser(
    authUserId: string,
    email?: string | null,
  ): Promise<{ id: string; full_name: string } | null> {
    const direct = await this.getEmployeeByAuthUserId(authUserId);
    if (direct) return direct;
    if (!email || !email.trim()) return null;

    try {
      const { data: unlinked, error } = await this.client
        .from('employees')
        .select('id, full_name, auth_user_id')
        .eq('email', email.trim())
        .maybeSingle();
      if (error) throw error;
      if (!unlinked) return null;

      if (!unlinked.auth_user_id) {
        const { error: updateError } = await this.client
          .from('employees')
          .update({ auth_user_id: authUserId })
          .eq('id', unlinked.id);
        if (updateError) throw updateError;
      }
      return { id: unlinked.id, full_name: unlinked.full_name };
    } catch (e) {
      console.log('Error in getOrLinkEmployeeByAuthUser fallback:', e);
      return null;
    }
  }

  static async resolveDataOwnerId(client = supabase): Promise<string> {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    const currentUser = userData.user;
    if (!currentUser) throw new Error('No authenticated user');

    try {
      const { data: row } = await client
        .from('employees')
        .select('owner_id')
        .eq('auth_user_id', currentUser.id)
        .maybeSingle();
      if (row?.owner_id) return row.owner_id as string;
    } catch {
      // fall through to admin case
    }
    return currentUser.id;
  }

  async addEmployee(data: Record<string, any>): Promise<EmployeeRecord> {
    try {
      const { data: existing, error: fetchError } = await this.client
        .from('employees')
        .select('employee_code')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;

      let employeeCode = 'EMP001';
      if (existing && existing.length > 0) {
        let maxNumber = 0;
        for (const employee of existing) {
          const code = employee.employee_code;
          if (code && String(code).startsWith('EMP')) {
            const number = parseInt(String(code).replace('EMP', ''), 10);
            if (!Number.isNaN(number) && number > maxNumber) maxNumber = number;
          }
        }
        employeeCode = `EMP${String(maxNumber + 1).padStart(3, '0')}`;
      }

      const insertData: Record<string, any> = { ...data };
      const { data: userData, error: userError } = await this.client.auth.getUser();
      if (userError) throw userError;
      const currentUser = userData.user;
      if (!currentUser) throw new Error('No authenticated user found');
      insertData.owner_id = currentUser.id;

      const profilePhotoFile: LocalFile | undefined = insertData.profile_photo_file;
      delete insertData.profile_photo_file;

      if (profilePhotoFile) {
        const photoUrl = await this.uploadEmployeeProfilePhoto(profilePhotoFile, employeeCode);
        insertData.profile_photo_url = photoUrl;
      }

      insertData.employee_code = employeeCode;

      const { data: inserted, error: insertError } = await this.client
        .from('employees')
        .insert(insertData)
        .select('*, departments(name)')
        .single();
      if (insertError) throw insertError;

      const employeeEmail = insertData.email;
      if (employeeEmail && String(employeeEmail).trim()) {
        await this.sendEmployeeInvitation({
          employeeId: String(inserted.id),
          email: String(employeeEmail).trim(),
        });
      }

      return employeeFromMap(inserted);
    } catch (e) {
      console.log('ADD EMPLOYEE ERROR', e);
      throw e;
    }
  }

  async updateEmployee(id: string, data: Record<string, any>): Promise<void> {
    const { error } = await this.client.from('employees').update(data).eq('id', id);
    if (error) throw error;
  }

  async updateEmployeeStatus(id: string, status: string): Promise<void> {
    const { error } = await this.client.from('employees').update({ status }).eq('id', id);
    if (error) throw error;
  }

  async assignRole({ employeeId, roleId }: { employeeId: string; roleId: string }): Promise<void> {
    const { data: sessionData } = await this.client.auth.getSession();
    const { data: userData } = await this.client.auth.getUser();
    if (!sessionData.session || !userData.user) throw new Error('No authenticated Supabase session');

    try {
      const { data: roleResponse, error: roleError } = await this.client
        .from('roles')
        .select()
        .eq('id', roleId)
        .maybeSingle();
      if (roleError) throw roleError;
      if (!roleResponse) throw new Error('Selected role does not exist');

      const { error: deleteError } = await this.client
        .from('employee_roles')
        .delete()
        .eq('employee_id', employeeId);
      if (deleteError) throw deleteError;

      const { error: insertError } = await this.client
        .from('employee_roles')
        .insert({ employee_id: employeeId, role_id: roleId })
        .select();
      if (insertError) throw insertError;
    } catch (e) {
      console.log('ASSIGN ROLE FAILED', e);
      throw e;
    }
  }

  async getAttendance(forDate?: Date): Promise<AttendanceRecord[]> {
    let query = this.client.from('attendance').select('*, employees(full_name)');
    if (forDate) {
      query = query.eq('attendance_date', forDate.toISOString().split('T')[0]);
    }
    const { data, error } = await query.order('attendance_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(attendanceFromMap);
  }

  async markAttendance({
    employeeId,
    date,
    status,
  }: {
    employeeId: string;
    date: Date;
    status: string;
  }): Promise<void> {
    const { error } = await this.client.from('attendance').upsert(
      {
        employee_id: employeeId,
        attendance_date: date.toISOString().split('T')[0],
        status,
        check_in: status === 'PRESENT' || status === 'LATE' ? new Date().toISOString() : null,
      },
      { onConflict: 'employee_id,attendance_date' },
    );
    if (error) throw error;
  }

  async getMyTodayAttendance(employeeId: string): Promise<AttendanceRecord | null> {
    const dateStr = new Date().toISOString().split('T')[0];
    const { data, error } = await this.client
      .from('attendance')
      .select('*, employees(full_name)')
      .eq('employee_id', employeeId)
      .eq('attendance_date', dateStr)
      .maybeSingle();
    if (error) throw error;
    return data ? attendanceFromMap(data) : null;
  }

  async checkInSelf(employeeId: string): Promise<void> {
    const now = new Date();
    const status = now.getHours() >= 11 ? 'LATE' : 'PRESENT';
    const { error } = await this.client.from('attendance').upsert(
      {
        employee_id: employeeId,
        attendance_date: now.toISOString().split('T')[0],
        status,
        check_in: now.toISOString(),
      },
      { onConflict: 'employee_id,attendance_date' },
    );
    if (error) throw error;
  }

  async checkOutSelf(employeeId: string): Promise<void> {
    const dateStr = new Date().toISOString().split('T')[0];
    const { error } = await this.client
      .from('attendance')
      .update({ check_out: new Date().toISOString() })
      .eq('employee_id', employeeId)
      .eq('attendance_date', dateStr);
    if (error) throw error;
  }

  async getMyAttendanceForMonth(employeeId: string, month: Date): Promise<AttendanceRecord[]> {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const { data, error } = await this.client
      .from('attendance')
      .select('*, employees(full_name)')
      .eq('employee_id', employeeId)
      .gte('attendance_date', start.toISOString().split('T')[0])
      .lt('attendance_date', end.toISOString().split('T')[0])
      .order('attendance_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(attendanceFromMap);
  }

  async getLeaveRequests(): Promise<LeaveRequestRecord[]> {
    const { data, error } = await this.client
      .from('leave_requests')
      .select('*, employees!leave_requests_employee_id_fkey(full_name), leave_types(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(leaveRequestFromMap);
  }

  async updateLeaveStatus(id: string, status: string): Promise<void> {
    const { error } = await this.client.from('leave_requests').update({ status }).eq('id', id);
    if (error) throw error;
  }

  async getLeaveTypes(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await this.client.from('leave_types').select('id, name').order('name');
    if (error) throw error;
    return data ?? [];
  }

  async getMyLeaveRequests(employeeId: string): Promise<LeaveRequestRecord[]> {
    const { data, error } = await this.client
      .from('leave_requests')
      .select('*, employees!leave_requests_employee_id_fkey(full_name), leave_types(name)')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(leaveRequestFromMap);
  }

  async createLeaveRequest({
    employeeId,
    leaveTypeId,
    startDate,
    endDate,
    reason,
  }: {
    employeeId: string;
    leaveTypeId: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
  }): Promise<void> {
    const { error } = await this.client.from('leave_requests').insert({
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      reason: reason ?? null,
      status: 'PENDING',
    });
    if (error) throw error;
  }

  async getPayroll(forMonth?: Date): Promise<PayrollRecord[]> {
    let query = this.client.from('payroll').select('*, employees(full_name)');
    if (forMonth) {
      const monthStr = new Date(forMonth.getFullYear(), forMonth.getMonth(), 1).toISOString().split('T')[0];
      query = query.eq('payroll_month', monthStr);
    }
    const { data, error } = await query.order('payroll_month', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(payrollFromMap);
  }

  async markPayrollPaid(id: string): Promise<void> {
    const { error } = await this.client
      .from('payroll')
      .update({ payment_status: 'PAID', payment_date: new Date().toISOString().split('T')[0] })
      .eq('id', id);
    if (error) throw error;
  }

  private totalDaysInMonth(month: Date): number {
    const firstOfNext = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const lastOfThis = new Date(firstOfNext.getTime() - 1);
    return lastOfThis.getDate();
  }

  async calculatePayrollForEmployee({
    employee,
    month,
  }: {
    employee: EmployeeRecord;
    month: Date;
  }): Promise<{
    employeeId: string;
    presentDays: number;
    totalDays: number;
    basicSalary: number;
    earnedBasic: number;
    allowances: number;
    deductions: number;
    netSalary: number;
  }> {
    const attendance = await this.getMyAttendanceForMonth(employee.id, month);
    const presentDays = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const totalDays = this.totalDaysInMonth(month);
    const perDayRate = totalDays === 0 ? 0 : employee.basicSalary / totalDays;
    const earnedBasic = perDayRate * presentDays;
    const net = earnedBasic + employee.allowances - employee.deductions;

    return {
      employeeId: employee.id,
      presentDays,
      totalDays,
      basicSalary: employee.basicSalary,
      earnedBasic,
      allowances: employee.allowances,
      deductions: employee.deductions,
      netSalary: net,
    };
  }

  async savePayrollRecord({
    employeeId,
    month,
    basicSalary,
    allowances,
    deductions,
    netSalary: net,
  }: {
    employeeId: string;
    month: Date;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
  }): Promise<void> {
    const monthStr = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0];
    const { data: userData, error: userError } = await this.client.auth.getUser();
    if (userError) throw userError;
    const currentUser = userData.user;
    if (!currentUser) throw new Error('No authenticated user');

    const { data: existing, error: fetchError } = await this.client
      .from('payroll')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('payroll_month', monthStr)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const data = {
      employee_id: employeeId,
      business_id: currentUser.id,
      payroll_month: monthStr,
      basic_salary: basicSalary,
      allowances,
      bonus: 0,
      deductions,
      net_salary: net,
      payment_status: 'PENDING',
    };

    if (existing) {
      const { error } = await this.client.from('payroll').update(data).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await this.client.from('payroll').insert(data);
      if (error) throw error;
    }
  }

  async getActivityLogs(): Promise<ActivityLogRecord[]> {
    const { data, error } = await this.client
      .from('employee_activity_logs')
      .select('*, employees(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map(activityLogFromMap);
  }

  async postMyActivity({
    employeeId,
    module,
    description,
  }: {
    employeeId: string;
    module: string;
    description: string;
  }): Promise<void> {
    const { error } = await this.client.from('employee_activity_logs').insert({
      employee_id: employeeId,
      module,
      action: 'NOTE',
      description,
    });
    if (error) throw error;
  }

  async getMyActivities(employeeId: string): Promise<ActivityLogRecord[]> {
    const { data, error } = await this.client
      .from('employee_activity_logs')
      .select('*, employees(full_name)')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []).map(activityLogFromMap);
  }

  async sendEmployeeInvitation({ employeeId, email }: { employeeId: string; email: string }): Promise<void> {
    try {
      const { data, error } = await this.client.functions.invoke('super-function', {
        body: { employee_id: employeeId, email },
      });
      if (error) throw new Error((data as any)?.error ?? error.message ?? 'Failed to send employee invitation');
    } catch (e) {
      console.log('EMPLOYEE INVITATION FAILED', e);
      throw e;
    }
  }

  async saveRolePermissions({
    roleId,
    moduleAccess,
  }: {
    roleId: string;
    moduleAccess: Record<string, boolean>;
  }): Promise<void> {
    try {
      const { data: permissions, error: permError } = await this.client.from('permissions').select();
      if (permError) throw permError;

      const { error: deleteError } = await this.client
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);
      if (deleteError) throw deleteError;

      const rows: Record<string, any>[] = [];
      for (const permission of permissions ?? []) {
        const module = permission.module?.toString();
        if (!module) continue;
        rows.push({ role_id: roleId, permission_id: permission.id, granted: moduleAccess[module] ?? false });
      }

      if (rows.length > 0) {
        const { error: insertError } = await this.client.from('role_permissions').insert(rows);
        if (insertError) throw insertError;
      }
    } catch (e) {
      console.log('SAVE ROLE PERMISSIONS FAILED', e);
      throw e;
    }
  }

  async getEmployeeRole(employeeId: string): Promise<string | null> {
    try {
      const { data, error } = await this.client
        .from('employee_roles')
        .select('role_id')
        .eq('employee_id', employeeId)
        .maybeSingle();
      if (error) throw error;
      return (data?.role_id as string) ?? null;
    } catch (e) {
      console.log('Error fetching employee role:', e);
      return null;
    }
  }

  async getRolePermissions(roleId: string): Promise<Record<string, boolean>> {
    try {
      const { data, error } = await this.client
        .from('role_permissions')
        .select('granted, permissions(module)')
        .eq('role_id', roleId);
      if (error) throw error;

      const permissions: Record<string, boolean> = {};
      for (const item of data ?? []) {
        const module = (item as any).permissions ? (item as any).permissions.module : null;
        if (module) permissions[module] = (item as any).granted ?? false;
      }
      return permissions;
    } catch (e) {
      console.log('Error fetching role permissions:', e);
      return {};
    }
  }
}