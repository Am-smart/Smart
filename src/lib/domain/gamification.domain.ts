import { Badge, Certificate, UserBadge } from '../types';

export class GamificationDomain {
  static prepareBadge(badge: Partial<Badge>): Partial<Badge> {
    return {
      ...badge,
      xp_required: badge.xp_required || 0
    };
  }

  static prepareCertificate(certificate: Partial<Certificate>): Partial<Certificate> {
    return {
      ...certificate,
      issued_at: certificate.issued_at || new Date().toISOString()
    };
  }
}
