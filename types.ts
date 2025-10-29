
export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  reminderMinutes?: number;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'function';
  content: string;
  toolCall?: {
    id: string;
    name: string;
    args: any;
  };
  toolResponse?: {
    id: string;
    name: string;
    response: any;
  };
}