import React, { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Course, Material } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { saveMaterial, deleteMaterial, uploadFile } from '@/lib/data-actions';
import { FileUpload } from '@/components/ui/FileUpload';

interface MaterialManagerProps {
    initialMaterials: Material[];
    courses: Course[];
    onRefresh: () => void;
}

export const MaterialManager: React.FC<MaterialManagerProps> = ({ initialMaterials, courses, onRefresh }) => {
    const { client } = useSupabase();
    const { addToast } = useAppContext();
    const [selectedCourseId, setSelectedCourseId] = useState('');

    const performUpload = async (file: File, category: 'materials' | 'submissions' | 'thumbnails') => {
        const { filePath } = await uploadFile(file.name, category);
        const { error: uploadError } = await client.storage
            .from('lms-files')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = client.storage
            .from('lms-files')
            .getPublicUrl(filePath);

        return { url: publicUrl.publicUrl };
    };

    const handleUploadComplete = async (url: string, fileName: string) => {
        if (!selectedCourseId) return;
        try {
            await saveMaterial({
                course_id: selectedCourseId,
                title: fileName,
                file_url: url
            });
            onRefresh();
            addToast('Material uploaded successfully!', 'success');
        } catch (err) {
            console.error('Failed to save material:', err);
            addToast('Failed to save material information.', 'error');
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
        try {
            await deleteMaterial(id);
            addToast('Material deleted successfully', 'success');
            onRefresh();
        } catch (err) {
            console.error('Delete failed:', err);
            addToast('Failed to delete material.', 'error');
        }
    };

    return (
        <div className="space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Course Materials</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage PDFs, lecture notes, and study guides.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <select
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)}
                        className="p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white min-w-[200px]"
                    >
                        <option value="">Select Course to Upload</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>

                    {selectedCourseId && (
                        <div className="w-full sm:w-64">
                            <FileUpload
                                category="materials"
                                uploadFn={performUpload}
                                onUploadComplete={handleUploadComplete}
                                label="Upload Material"
                                className="!min-h-0"
                            />
                        </div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialMaterials.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="text-6xl mb-6 grayscale opacity-20">📂</div>
                        <h3 className="text-xl font-bold text-slate-900">No Materials Yet</h3>
                        <p className="text-slate-500 mt-2 font-medium">Upload lecture notes, PDFs, and guides for your students.</p>
                    </div>
                ) : (
                    initialMaterials.map(mat => (
                        <div key={mat.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold">📄</div>
                                <button onClick={() => handleDelete(mat.id, mat.title)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">🗑️</button>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 line-clamp-1">{mat.title}</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">{courses.find(c => c.id === mat.course_id)?.title || 'Global Material'}</p>
                            </div>
                            <div className="mt-auto pt-4 flex gap-3">
                                <a href={mat.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 py-2 text-[10px] uppercase font-bold tracking-widest text-center">View</a>
                                <button onClick={() => { navigator.clipboard.writeText(mat.file_url); addToast('URL copied to clipboard!', 'success'); }} className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">🔗</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
