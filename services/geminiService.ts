
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const addAppointmentDeclaration: FunctionDeclaration = {
    name: 'add_appointment',
    description: 'Adds a new appointment to the schedule. Use todays date if not specified. Today is ' + new Date().toLocaleDateString(),
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'The title or description of the appointment.' },
            date: { type: Type.STRING, description: 'The date of the appointment in YYYY-MM-DD format.' },
            time: { type: Type.STRING, description: 'The time of the appointment in HH:MM (24-hour) format.' },
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

const tools = [{
    functionDeclarations: [addAppointmentDeclaration, deleteAppointmentDeclaration, listAppointmentsDeclaration],
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
        },
    });

    return response;
};
