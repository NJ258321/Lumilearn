
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot, ArrowLeft } from 'lucide-react';
import { Message } from '../types';
import { createChatSession, sendMessage } from '../services/geminiService';
import { COLORS } from '../constants';

interface AgentProps {
  onBack?: () => void;
}

const Agent: React.FC<AgentProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'model', text: '你好！我是 Lumi。今天复习感觉如何？我可以帮你生成复习简报，或者解释具体的知识点。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSessionRef.current = createChatSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await sendMessage(chatSessionRef.current, userMsg.text);
    
    const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const chips = ["生成今日简报", "解释'最大似然估计'", "查看本周薄弱点"];

  return (
    <div className="flex flex-col h-full bg-white relative animate-in fade-in slide-in-from-right duration-300">
      <div className="pt-12 pb-4 px-4 border-b border-gray-100 flex items-center bg-white z-10 shadow-sm">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
             <Bot size={18} className="text-blue-600" />
        </div>
        <h1 className="font-bold text-gray-800">AI 助教 Lumi</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[130px] scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
            >
                {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-none flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-6 w-full px-4">
         {/* Chips */}
        {messages.length < 3 && (
            <div className="flex space-x-2 mb-2 overflow-x-auto scrollbar-hide justify-center">
                {chips.map(chip => (
                    <button 
                        key={chip} 
                        onClick={() => { setInput(chip); }}
                        className="whitespace-nowrap px-3 py-1 bg-blue-50/90 backdrop-blur-sm text-blue-600 text-xs rounded-full border border-blue-100 shadow-sm"
                    >
                        {chip}
                    </button>
                ))}
            </div>
        )}

        <div className="flex items-center bg-white rounded-full px-4 py-2 border border-gray-200 shadow-lg">
            <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="问点什么..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-800"
            />
            <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className={`p-2 rounded-full transition-colors ml-2 ${input.trim() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}
            >
                <Send size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Agent;
