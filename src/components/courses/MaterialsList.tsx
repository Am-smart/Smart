import React from 'react';
import { MaterialDTO } from '@/lib/types';

interface MaterialsListProps {
  materials: MaterialDTO[];
}

export const MaterialsList: React.FC<MaterialsListProps> = ({ materials }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Course Materials</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.length > 0 ? (
          materials.map(material => (
            <div key={material.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl">
                📄
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-slate-900 truncate">{material.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Added: {new Date(material.created_at).toLocaleDateString()}</p>
              </div>
              <a
                href={material.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Download"
              >
                📥
              </a>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-500">
            No materials shared by your teachers yet.
          </div>
        )}
      </div>
    </div>
  );
};
