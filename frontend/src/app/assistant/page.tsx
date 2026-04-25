"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { aiAPI } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: "🌤 Weather now?", message: "What's the weather like right now?" },
  { label: "💨 Air quality?", message: "How is the air quality today?" },
  { label: "🚗 Traffic report", message: "What's the traffic situation?" },
  { label: "🏃 Best time to go out?", message: "When is the best time to go outside today?" },
  { label: "🎉 Any events?", message: "Are there any events happening today?" },
  { label: "💡 Daily tips", message: "Give me some tips for today based on city conditions." },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I'm **CitySense AI** 🌆, your smart city assistant for Almaty.

I can help you with:
• 🌤 **Weather** conditions and forecasts
• 💨 **Air quality** monitoring and alerts
• 🚗 **Traffic** congestion updates
• 🏃 **Best time** to go outside
• 🎉 **Events** and activities in the city
• 💡 Smart **daily tips**

How can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await aiAPI.chat(text.trim());
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.message,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I help you?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI City Assistant
          </h1>
          <p className="text-muted-foreground text-sm">
            Ask anything about Almaty — weather, air, traffic, events
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] ${
                  msg.role === "user" ? "order-2" : ""
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      CitySense AI
                    </span>
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    CitySense AI
                  </span>
                </div>
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto">
          {QUICK_ACTIONS.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => sendMessage(action.message)}
              disabled={loading}
            >
              {action.label}
            </Button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about weather, air quality, traffic, events..."
              className="min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={loading}
            />
            <Button
              type="submit"
              className="h-11 w-11 p-0 shrink-0"
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

