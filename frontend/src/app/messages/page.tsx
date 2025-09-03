// frontend/src/app/messages/page.tsx
"use client";

import { useSocket } from '@/hooks/useSocket';
import { useState, useEffect } from 'react';
import { Send, MessageSquare, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  from?: string;
  to?: string;
  body: string;
  timestamp: number;
  direction: "incoming" | "outgoing";
  type: string;
}

export default function Messages() {
  const { messages: liveMessages, sendMessage } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');

  useEffect(() => {
    // Fetch existing messages
    fetchMessages();
  }, []);

  useEffect(() => {
    // Add live messages from socket
    setMessages(prev => [...liveMessages, ...prev]);
  }, []);
//   }, [liveMessages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/messages', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && recipient.trim()) {
      sendMessage(recipient, newMessage);
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatPhoneNumber = (number: string) => {
    return number?.replace('@c.us', '') || 'Unknown';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">View conversation history and send messages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Conversation History
              </h2>
            </div>
            <div className="h-96 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet</p>
                  <p className="text-sm">Messages will appear here when your bot receives or sends them</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.direction === 'outgoing'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          {message.direction === 'outgoing' ? (
                            <Bot className="h-4 w-4 mr-1" />
                          ) : (
                            <User className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-xs font-medium">
                            {message.direction === 'outgoing' 
                              ? 'Bot' 
                              : formatPhoneNumber(message.from || '')
                            }
                          </span>
                        </div>
                        <p className="text-sm">{message.body}</p>
                        <p className={`text-xs mt-1 ${
                          message.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Send Message Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send Message
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Phone Number
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g., 1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !recipient.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg shadow mt-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Messages:</span>
                <span className="font-semibold">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Incoming:</span>
                <span className="font-semibold text-green-600">
                  {messages.filter(m => m.direction === 'incoming').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Outgoing:</span>
                <span className="font-semibold text-blue-600">
                  {messages.filter(m => m.direction === 'outgoing').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
