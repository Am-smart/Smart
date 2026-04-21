import { BadgeRepository } from '../repositories/badge.repository';
import { CertificateRepository } from '../repositories/certificate.repository';
import { Badge, UserBadge, Certificate, User } from '../types';
import { GamificationDomain } from '../domain/gamification.domain';

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

  async saveBadge(badge: Partial<Badge>, sessionId: string): Promise<Badge> {
    const badgeToSave = GamificationDomain.prepareBadge(badge);
    return this.badgeRepo.upsert(badgeToSave, sessionId);
  }

  async deleteBadge(id: string, sessionId: string): Promise<void> {
    await this.badgeRepo.delete(id, sessionId);
  }

  async assignBadge(userBadge: Partial<UserBadge>, sessionId: string): Promise<void> {
    await this.badgeRepo.assignToUser(userBadge, sessionId);
  }

  // Certificates
  async getCertificates(userId: string, sessionId: string): Promise<Certificate[]> {
    return this.certificateRepo.findByUserId(userId, sessionId);
  }

  async issueCertificate(certificate: Partial<Certificate>, sessionId: string): Promise<Certificate> {
    const certificateToSave = GamificationDomain.prepareCertificate(certificate);
    return this.certificateRepo.create(certificateToSave, sessionId);
  }
}

export const gamificationService = new GamificationService();
