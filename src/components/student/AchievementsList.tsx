import React from 'react';
import { BadgeDTO } from '@/lib/dto/system.dto';

interface AchievementsListProps {
  badges: BadgeDTO[];
}

export const AchievementsList: React.FC<AchievementsListProps> = ({ badges }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Your Achievements</h2>
        <div className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
          Total: {badges.length} Badges
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {badges.length > 0 ? (
          badges.map(badge => (
            <div key={badge.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-transform hover:scale-105">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-4 grayscale-0 shadow-inner">
                {badge.icon_url || '🏆'}
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{badge.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{badge.description}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="text-4xl mb-4">🎖️</div>
            <p className="text-slate-500 font-medium">No badges earned yet. Keep learning to unlock achievements!</p>
          </div>
        )}
      </div>
    </div>
  );
};
