import { SystemLogRepository } from '../repositories/system-log.repository';
import { MaintenanceRepository } from '../repositories/maintenance.repository';
import { PlannerRepository } from '../repositories/planner.repository';
import { SettingRepository } from '../repositories/setting.repository';
import { SystemLog, Maintenance, PlannerItem, User, Setting } from '../types';
import { UserDomain } from '../domain/user.domain';

export class SystemService {
  private logRepo = new SystemLogRepository();
  private maintenanceRepo = new MaintenanceRepository();
  private plannerRepo = new PlannerRepository();
  private settingRepo = new SettingRepository();

  // Logs
  async createLog(log: SystemLog, sessionId?: string): Promise<boolean> {
    return this.logRepo.create(log, sessionId);
  }

  async createLogAsync(log: SystemLog): Promise<void> {
    const { taskQueue } = await import('../queue/task-queue');
    taskQueue.enqueue(async () => {
      await this.createLog(log);
    });
  }

  async getLogs(currentUser: User, limit: number, sessionId: string): Promise<SystemLog[]> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    return this.logRepo.findAll(limit, sessionId);
  }

  async updateLog(currentUser: User, id: string, updates: Partial<SystemLog>, sessionId: string): Promise<SystemLog> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    return this.logRepo.update(id, updates, sessionId);
  }

  // Maintenance
  async getMaintenance(sessionId?: string): Promise<Maintenance> {
    return this.maintenanceRepo.getMaintenance(sessionId);
  }

  async updateMaintenance(currentUser: User, maintenance: Partial<Maintenance>, sessionId: string): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    await this.maintenanceRepo.update(maintenance, sessionId);
  }

  // Planner
  async getPlannerItems(userId: string, sessionId: string): Promise<PlannerItem[]> {
    return this.plannerRepo.findByUserId(userId, sessionId);
  }

  async savePlannerItem(userId: string, item: Partial<PlannerItem>, sessionId: string): Promise<PlannerItem> {
    return this.plannerRepo.upsert({ ...item, user_id: userId }, sessionId);
  }

  async deletePlannerItem(userId: string, id: string, sessionId: string): Promise<void> {
    await this.plannerRepo.delete(id, userId, sessionId);
  }

  // Settings
  async getSettings(currentUser: User, sessionId: string): Promise<Setting[]> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    return this.settingRepo.findAll(sessionId);
  }

  async updateSetting(currentUser: User, key: string, value: unknown, sessionId: string): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    await this.settingRepo.update(key, value, sessionId);
  }
}

export const systemService = new SystemService();
