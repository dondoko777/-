
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ScheduleView } from './components/ScheduleView';
import { InputBar } from './components/InputBar';
import { useSchedule } from './hooks/useSchedule';
import { getAiResponse } from './services/geminiService';
import type { ChatMessage as ChatMessageType } from './types';

export default function App() {
  const { appointments, addAppointment, deleteAppointment, listAppointments, setReminder } = useSchedule();
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const processAiResponse = useCallback(async (history: ChatMessageType[]) => {
    setIsLoading(true);
    try {
      const response = await getAiResponse(history);
      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        const fc = functionCalls[0];
        const newHistory: ChatMessageType[] = [...history, {
          role: 'model',
          content: '',
          toolCall: { id: fc.id, name: fc.name, args: fc.args },
        }];

        let functionResult;
        let resultMessage = '';

        if (fc.name === 'add_appointment') {
          const { title, date, time, reminderMinutes } = fc.args;
          const newApp = addAppointment(title, date, time, reminderMinutes);
          functionResult = newApp;
          let reminderText = reminderMinutes ? ` with a reminder ${reminderMinutes} minutes before` : '';
          resultMessage = `Added appointment "${title}" on ${date} at ${time}${reminderText}. The ID for this appointment is ${newApp.id}.`;
        } else if (fc.name === 'delete_appointment') {
          const { id } = fc.args;
          const success = deleteAppointment(id);
          functionResult = { success };
          resultMessage = success ? `Successfully deleted appointment.` : `Could not find appointment with ID ${id}.`;
        } else if (fc.name === 'list_appointments') {
          const apps = listAppointments();
          functionResult = apps;
          resultMessage = apps.length > 0 ? `Here are your appointments.` : `You have no appointments.`;
        } else if (fc.name === 'set_reminder') {
            const { id, reminderMinutes } = fc.args;
            const updatedApp = setReminder(id, reminderMinutes);
            if (updatedApp) {
                functionResult = updatedApp;
                resultMessage = `OK. I've set a reminder for "${updatedApp.title}" to go off ${reminderMinutes} minutes before the scheduled time.`;
            } else {
                functionResult = { success: false, error: 'Appointment not found' };
                resultMessage = `Sorry, I couldn't find an appointment with ID ${id}.`;
            }
        } else {
            functionResult = { error: 'Unknown function' };
            resultMessage = `Sorry, I don't know how to do that.`;
        }

        const finalHistory: ChatMessageType[] = [...newHistory, {
            role: 'function',
            content: resultMessage,
            toolResponse: {
                id: fc.id,
                name: fc.name,
                response: functionResult,
            }
        }];
        
        // Get the final text response from the model
        const finalResponse = await getAiResponse(finalHistory);
        setChatHistory([...finalHistory, { role: 'model', content: finalResponse.text }]);
      } else {
        // No function call, just a text response
        setChatHistory([...history, { role: 'model', content: response.text }]);
      }
    } catch (error) {
      console.error("Error with Gemini API:", error);
      setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [addAppointment, deleteAppointment, listAppointments, setReminder]);

  const handleSend = (message: string) => {
    const newHistory: ChatMessageType[] = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newHistory);
    processAiResponse(newHistory);
  };
  
  const handleDeleteFromView = async (id: string) => {
    // We construct a specific request for the AI to delete this item
    const message = `Delete the appointment with ID ${id}`;
    const newHistory: ChatMessageType[] = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newHistory);
    processAiResponse(newHistory);
  };


  return (
    <div className="flex flex-col md:flex-row h-screen font-sans text-slate-800 dark:text-slate-200">
      <main className="flex flex-col flex-1 h-full bg-slate-100 dark:bg-slate-900">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <ChatMessage message={{ role: 'model', content: "Hello! I'm your schedule assistant. How can I help you? You can ask me to add, remove, or list your appointments." }} />
          {chatHistory.map((msg, index) => (
             msg.role !== 'function' && <ChatMessage key={index} message={msg} />
          ))}
        </div>
        <InputBar onSend={handleSend} isLoading={isLoading} />
      </main>
      <aside className="w-full md:w-1/3 lg:w-1/4 p-4 bg-slate-200/50 dark:bg-slate-950/50 border-l border-slate-200 dark:border-slate-800 h-full overflow-hidden">
        <ScheduleView appointments={appointments} onDelete={handleDeleteFromView} />
      </aside>
    </div>
  );
}