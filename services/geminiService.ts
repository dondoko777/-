
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const addAppointmentDeclaration: FunctionDeclaration = {
    name: 'add_appointment',
    description: 'Adds a new appointment to the schedule. Can optionally include a reminder. Today is ' + new Date().toLocaleDateString(),
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'The title or description of the appointment.' },
            date: { type: Type.STRING, description: 'The date of the appointment in YYYY-MM-DD format.' },
            time: { type: Type.STRING, description: 'The time of the appointment in HH:MM (24-hour) format.' },
            reminderMinutes: { type: Type.NUMBER, description: 'Optional. Number of minutes before the appointment to send a reminder notification.' },
        },
        required: ['title', 'date', 'time'],
    },
};

const deleteAppointmentDeclaration: FunctionDeclaration = {
    name: 'delete_appointment',
    description: 'Deletes an existing appointment from the schedule using its unique ID.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: 'The unique ID of the appointment to delete.' },
        },
        required: ['id'],
    },
};

const listAppointmentsDeclaration: FunctionDeclaration = {
    name: 'list_appointments',
    description: 'Lists all current appointments in the schedule.',
    parameters: {
        type: Type.OBJECT,
        properties: {},
    },
};

const setReminderDeclaration: FunctionDeclaration = {
    name: 'set_reminder',
    description: 'Sets or updates a reminder for an existing appointment using its unique ID.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: 'The unique ID of the appointment to set a reminder for.' },
            reminderMinutes: { type: Type.NUMBER, description: 'Number of minutes before the appointment to send the reminder.' },
        },
        required: ['id', 'reminderMinutes'],
    },
};

const tools = [{
    functionDeclarations: [addAppointmentDeclaration, deleteAppointmentDeclaration, listAppointmentsDeclaration, setReminderDeclaration],
}];

export const getAiResponse = async (history: ChatMessage[]) => {

    const contents = history.map(msg => {
        if (msg.role === 'user') {
            return { role: 'user', parts: [{ text: msg.content }] };
        }
        if (msg.role === 'model' && msg.toolCall) {
            return {
                role: 'model',
                parts: [{
                    functionCall: {
                        name: msg.toolCall.name,
                        args: msg.toolCall.args,
                    }
                }]
            };
        }
        if (msg.role === 'function' && msg.toolResponse) {
            return {
                role: 'function',
                parts: [{
                    functionResponse: {
                        name: msg.toolResponse.name,
                        response: { result: msg.toolResponse.response }
                    }
                }]
            };
        }
        return { role: 'model', parts: [{ text: msg.content }] };
    });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            tools,
            systemInstruction: "You are a helpful schedule assistant. When a user adds an appointment without specifying a reminder, you MUST ask them if they would like to set one. After successfully adding an appointment, confirm it and provide its ID so they can refer to it later for updates or deletion."
        },
    });

    return response;
};