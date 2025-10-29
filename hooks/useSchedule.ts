
import { useState, useEffect } from 'react';
import type { Appointment } from '../types';

export const useSchedule = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [triggeredReminders, setTriggeredReminders] = useState<Set<string>>(new Set());

  // Load from localStorage on initial render
  useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem('schedule');
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      }
      const storedTriggered = localStorage.getItem('triggeredReminders');
      if (storedTriggered) {
        setTriggeredReminders(new Set(JSON.parse(storedTriggered)));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('schedule', JSON.stringify(appointments));
      localStorage.setItem('triggeredReminders', JSON.stringify(Array.from(triggeredReminders)));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [appointments, triggeredReminders]);

  // Reminder checking logic
  useEffect(() => {
    const checkReminders = () => {
      if (Notification.permission !== 'granted') {
        return;
      }
      const now = new Date();
      appointments.forEach(app => {
        if (app.reminderMinutes && !triggeredReminders.has(app.id)) {
          const appTime = new Date(`${app.date}T${app.time}`);
          const reminderTime = new Date(appTime.getTime() - app.reminderMinutes * 60000);
          
          if (now >= reminderTime && now < appTime) {
            new Notification('Appointment Reminder', {
              body: `${app.title} is at ${app.time}`,
              icon: '/vite.svg',
            });
            setTriggeredReminders(prev => new Set(prev).add(app.id));
          }
        }
      });
    };

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    const intervalId = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [appointments, triggeredReminders]);

  const addAppointment = (title: string, date: string, time: string, reminderMinutes?: number): Appointment => {
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      title,
      date,
      time,
      reminderMinutes,
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
    setTriggeredReminders(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    return found;
  };
  
  const listAppointments = (): Appointment[] => {
    return appointments;
  };

  const setReminder = (id: string, reminderMinutes: number): Appointment | null => {
    let updatedAppointment: Appointment | null = null;
    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        updatedAppointment = { ...app, reminderMinutes };
        return updatedAppointment;
      }
      return app;
    }));
    // Reset triggered state for this reminder
    setTriggeredReminders(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    return updatedAppointment;
  };


  return { appointments, addAppointment, deleteAppointment, listAppointments, setReminder };
};