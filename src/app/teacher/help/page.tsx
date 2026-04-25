"use client";

import React, { useState, useMemo } from 'react';
import { Search, HelpCircle, Book, MessageSquare, Send, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { apiClient } from '@/lib/api-client';

const TEACHER_FAQ = [
    {
        category: 'Course Management',
        questions: [
            { q: "How do I create a new course?", a: "Go to 'Courses' and click 'Create Course'. You can then add lessons, materials, and assignments." },
            { q: "Can I hide a course while building it?", a: "Yes, keep the course status as 'Draft'. It will only be visible to students once set to 'Published'." },
            { q: "How do I manage enrollments?", a: "In 'Course Management', you can view enrolled students and remove them if necessary." }
        ]
    },
    {
        category: 'Grading & Assessments',
        questions: [
            { q: "How do I grade assignments?", a: "Access the 'Grading' queue from your dashboard. You can view submissions, provide feedback, and assign scores." },
            { q: "What are regrade requests?", a: "Students can request a review of their grade. You can respond to these requests in the Grading Modal." },
            { q: "How do quizzes work?", a: "Quizzes are auto-graded based on correct answers, but you can review attempts and violation counts." }
        ]
    },
    {
        category: 'Live Interaction',
        questions: [
            { q: "How do I start a live class?", a: "Schedule a class in 'Live Classes'. At the scheduled time, click 'Go Live' to start the session." },
            { q: "Can I record sessions?", a: "Live sessions can be recorded depending on your integration settings. Recorded links can be added to course materials." }
        ]
    }
];

export default function TeacherHelpPage() {
    const { addToast } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [openIndex, setOpenIndex] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contactForm, setContactForm] = useState({ subject: '', message: '' });

    const filteredFaqs = useMemo(() => {
        if (!searchQuery) return TEACHER_FAQ;
        return TEACHER_FAQ.map(cat => ({
            ...cat,
            questions: cat.questions.filter(q =>
                q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.questions.length > 0);
    }, [searchQuery]);

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactForm.subject || !contactForm.message) return;

        setIsSubmitting(true);
        try {
            await createSystemLog({
                level: 'info',
                category: 'management',
                message: `Instructor Support: ${contactForm.subject}`,
                metadata: {
                    user_message: contactForm.message,
                    type: 'support_ticket'
                }
            });
            addToast('Support request sent! We will prioritize your request.', 'success');
            setContactForm({ subject: '', message: '' });
        } catch (err) {
            console.error('Support request failed:', err);
            addToast('Failed to send request.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-2">
                    <GraduationCap size={32} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Instructor Help Center</h1>
                <p className="text-slate-500 max-w-2xl mx-auto font-medium">Resources to help you manage your courses and support your students effectively.</p>

                <div className="relative max-w-xl mx-auto mt-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search for instructor tools or guides..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                        <HelpCircle className="text-blue-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">Instructor FAQ</h2>
                    </div>

                    {filteredFaqs.map((category, catIdx) => (
                        <div key={category.category} className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">{category.category}</h3>
                            <div className="space-y-3">
                                {category.questions.map((faq, qIdx) => {
                                    const isOpen = openIndex === `${catIdx}-${qIdx}`;
                                    return (
                                        <div key={qIdx} className={`bg-white rounded-2xl border transition-all ${isOpen ? 'border-blue-200 shadow-md ring-4 ring-blue-50' : 'border-slate-100 shadow-sm'}`}>
                                            <button onClick={() => setOpenIndex(isOpen ? null : `${catIdx}-${qIdx}`)} className="w-full px-6 py-5 flex items-center justify-between text-left">
                                                <span className="font-bold text-slate-800">{faq.q}</span>
                                                {isOpen ? <ChevronUp className="text-blue-500" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
                                            </button>
                                            {isOpen && (
                                                <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-2 animate-in slide-in-from-top-2">
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
                        <h3 className="text-xl font-bold mb-6">Instructor Support</h3>
                        <form onSubmit={handleSupportSubmit} className="space-y-4">
                            <input
                                type="text"
                                required
                                value={contactForm.subject}
                                onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                                placeholder="Subject"
                                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <textarea
                                required
                                value={contactForm.message}
                                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                                placeholder="How can we help you today?"
                                rows={4}
                                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                <Send size={18} /> {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900">Instructor Quick Links</h3>
                        <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 font-bold text-sm text-slate-700">
                            <Book size={18} className="text-purple-500" /> Teaching Standards
                        </a>
                        <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 font-bold text-sm text-slate-700">
                            <MessageSquare size={18} className="text-green-500" /> Community Forum
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
