import React from 'react';
import { LiveClassDTO } from '@/lib/dto/communication.dto';

interface LiveClassesListProps {
  liveClasses: LiveClassDTO[];
  onJoin: (liveClass: LiveClassDTO) => void;
}

export const LiveClassesList: React.FC<LiveClassesListProps> = ({ liveClasses, onJoin }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Upcoming Live Classes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveClasses.map(liveClass => {
          const isLive = liveClass.status === 'live';
          return (
            <div key={liveClass.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{liveClass.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    <strong>Time:</strong> {new Date(liveClass.start_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isLive ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                  {liveClass.status}
                </span>
              </div>
              <div className="mt-auto pt-4">
                {isLive ? (
                  <button onClick={() => onJoin(liveClass)} className="btn-primary w-full py-3">Join Now</button>
                ) : (
                  <button disabled className="btn-secondary w-full py-3 opacity-50 cursor-not-allowed">Not Started</button>
                )}
              </div>
            </div>
          );
        })}
        {liveClasses.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-500 italic">No live classes scheduled for your courses.</p>
          </div>
        )}
      </div>
    </div>
  );
};
