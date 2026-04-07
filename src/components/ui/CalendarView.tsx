import React, { useState, useMemo } from 'react';

interface Event {
    id: string;
    title: string;
    date: string;
    type: 'assignment' | 'quiz' | 'live';
    color: string;
}

interface CalendarViewProps {
    events: Event[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentDate]);

    const getEventsForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <header className="p-8 border-b flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-colors">←</button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-colors">→</button>
                </div>
            </header>

            <div className="grid grid-cols-7 border-b bg-slate-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {calendarDays.map((date, i) => (
                    <div key={i} className={`min-h-[140px] p-2 border-r border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${!date ? 'bg-slate-50/30' : ''}`}>
                        {date && (
                            <>
                                <div className={`text-sm font-bold mb-2 ${date.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full mx-auto' : 'text-slate-400 text-center'}`}>
                                    {date.getDate()}
                                </div>
                                <div className="space-y-1">
                                    {getEventsForDay(date).map(event => (
                                        <div key={event.id} className={`text-[9px] p-1.5 rounded-lg font-bold border-l-4 ${event.color} truncate`}>
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
