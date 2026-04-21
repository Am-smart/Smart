import { BadgeRepository } from '../repositories/badge.repository';
import { CertificateRepository } from '../repositories/certificate.repository';
import { Badge, UserBadge, Certificate, User } from '../types';

export class GamificationService {
  private badgeRepo = new BadgeRepository();
  private certificateRepo = new CertificateRepository();

  // Badges
  async getBadges(): Promise<Badge[]> {
    return this.badgeRepo.findAll();
  }

  async getUserBadges(userId: string, sessionId: string): Promise<UserBadge[]> {
    return this.badgeRepo.findByUserId(userId, sessionId);
  }

  async saveBadge(currentUser: User, badge: Partial<Badge>, sessionId: string): Promise<Badge> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    return this.badgeRepo.upsert(badge, sessionId);
  }

  async deleteBadge(currentUser: User, id: string, sessionId: string): Promise<void> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    await this.badgeRepo.delete(id, sessionId);
  }

  async assignBadge(currentUser: User, userBadge: Partial<UserBadge>, sessionId: string): Promise<void> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    await this.badgeRepo.assignToUser(userBadge, sessionId);
  }

  // Certificates
  async getCertificates(userId: string, sessionId: string): Promise<Certificate[]> {
    return this.certificateRepo.findByUserId(userId, sessionId);
  }

  async issueCertificate(currentUser: User, certificate: Partial<Certificate>, sessionId: string): Promise<Certificate> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    return this.certificateRepo.create(certificate, sessionId);
  }
}

export const gamificationService = new GamificationService();
