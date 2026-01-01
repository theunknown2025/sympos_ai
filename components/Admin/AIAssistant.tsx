import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { chatWithAssistant } from '../../services/geminiService';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', parts: [{text: string}]}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    setIsTyping(true);

    const response = await chatWithAssistant(userMsg, messages);
    
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: response || "I couldn't process that request." }] }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
        >
          <Bot size={24} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-2 -right-2 bg-indigo-400 text-white text-[10px] px-2 py-0.5 rounded-full border-2 border-slate-50 font-bold">AI</span>
        </button>
      ) : (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-80 md:w-96 h-[500px] flex flex-col overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={18} />
              <span className="font-bold">Sympose AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
                  <MessageSquare size={24} />
                </div>
                <p className="text-slate-500 text-sm px-6">
                  Hello! I'm your conference assistant. I can help you search submissions, analyze metrics, or write announcements.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 px-4">
                  <button onClick={() => setInput("Count Bioinformatics papers")} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors">"Count Bioinfo papers"</button>
                  <button onClick={() => setInput("Summarize accepted papers")} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors">"Summarize accepted papers"</button>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                }`}>
                  {m.parts[0].text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-indigo-600" />
                  <span className="text-xs text-slate-400 italic">Accessing Firestore context...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your conference..."
              className="flex-1 text-sm bg-slate-50 border border-slate-200 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;