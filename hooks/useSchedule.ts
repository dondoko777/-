
import { useState, useEffect } from 'react';
import type { Appointment } from '../types';

export const useSchedule = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem('schedule');
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      }
    } catch (error) {
      console.error("Failed to load appointments from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('schedule', JSON.stringify(appointments));
    } catch (error) {
      console.error("Failed to save appointments to localStorage", error);
    }
  }, [appointments]);

  const addAppointment = (title: string, date: string, time: string): Appointment => {
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      title,
      date,
      time,
    };
    setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()));
    return newAppointment;
  };

  const deleteAppointment = (id: string): boolean => {
    let found = false;
    setAppointments(prev => {
        const filtered = prev.filter(app => app.id !== id);
        found = filtered.length < prev.length;
        return filtered;
    });
    return found;
  };
  
  const listAppointments = (): Appointment[] => {
    return appointments;
  };


  return { appointments, addAppointment, deleteAppointment, listAppointments };
};
