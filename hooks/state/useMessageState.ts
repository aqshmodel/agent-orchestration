
import { useState, useRef } from 'react';
import { Message } from '../../types';

export const useMessageState = (initialMessages: Record<string, Message[]> = {}) => {
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);
  const conversationHistoryRef = useRef('');

  const addMessage = (agentId: string, message: Message) => {
    setMessages(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), message]
    }));
  };

  const appendToHistory = (text: string) => {
    conversationHistoryRef.current += text + '\n\n';
  };

  return { messages, setMessages, conversationHistoryRef, addMessage, appendToHistory };
};
