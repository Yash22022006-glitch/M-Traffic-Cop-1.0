
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

interface Message {
  text: string;
  sender: 'user' | 'gemini';
}

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const initializeChat = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'You are a concise traffic enforcement AI assistant. Answer support questions briefly.',
        },
      });
      if (messages.length === 0) {
        setMessages([{ text: "System ready. How can I help?", sender: 'gemini' }]);
      }
    } catch (error: any) {
      console.error('Gemini init failed', error);
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
        if (window.aistudio?.openSelectKey) {
          window.aistudio.openSelectKey();
        }
      }
    }
  };

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input, sender: 'user' as const };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatRef.current) await initializeChat();
      if (!chatRef.current) throw new Error("No session");
      
      const responseStream = await chatRef.current.sendMessageStream({ message: userMessage.text });
      let geminiResponseText = '';
      setMessages(prev => [...prev, { text: '', sender: 'gemini' as const }]);

      for await (const chunk of responseStream) {
        const currentChunkText = chunk.text;
        if (currentChunkText) {
          geminiResponseText += currentChunkText;
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].sender === 'gemini') {
              newMessages[newMessages.length - 1].text = geminiResponseText;
            }
            return newMessages;
          });
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
        if (window.aistudio?.openSelectKey) {
          window.aistudio.openSelectKey();
        }
      }
      setMessages(prev => [...prev, { text: `Error: Connection lost. Please verify your API settings.`, sender: 'gemini' as const }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-snug ${
                msg.sender === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-900 text-white border border-white/5'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 bg-gray-900 rounded-2xl border border-white/5">
              <LoadingSpinner />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex p-4 bg-gray-950 border-t border-white/5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query AI Copilot..."
          className="flex-1 p-4 rounded-xl bg-gray-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="ml-2 bg-white text-black p-4 rounded-xl disabled:opacity-30 active:scale-95 transition-all shadow-lg"
          disabled={!input.trim() || isLoading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatbotPage;
