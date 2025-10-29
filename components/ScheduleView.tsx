
import React from 'react';
import type { Appointment } from '../types';

interface ScheduleViewProps {
  appointments: Appointment[];
  onDelete: (id: string) => Promise<void>;
}

const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00'); // To avoid timezone issues
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};


export const ScheduleView: React.FC<ScheduleViewProps> = ({ appointments, onDelete }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg h-full">
      <div className="flex items-center mb-6">
        <CalendarIcon />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your Schedule</h2>
      </div>
      {appointments.length > 0 ? (
        <ul className="space-y-4 h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {appointments.map((app) => (
            <li key={app.id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl flex justify-between items-center transition-transform hover:scale-105">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-100">{app.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(app.date)} at {app.time}</p>
              </div>
              <button
                onClick={() => onDelete(app.id)}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                aria-label={`Delete appointment: ${app.title}`}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center text-slate-500 dark:text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          <p className="font-semibold">No appointments scheduled.</p>
          <p className="text-sm">Use the chat to add a new one!</p>
        </div>
      )}
    </div>
  );
};
