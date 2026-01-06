"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useConsultant } from "@/context/consultant-context";
import { cn } from "@/lib/utils";
import {
  Button,
  Card,
  Avatar,
  AvatarFallback,
  Textarea,
  ScrollArea,
} from "@tailfire/ui-public";

type Message = {
  id: string;
  sender: "advisor" | "client";
  content: string;
  timestamp: string;
  date: string;
};

const initialMessages: Message[] = [
  {
    id: "msg-1",
    sender: "advisor",
    content:
      "Hi! I've started working on your Mediterranean Cruise itinerary. I think you're going to love the stops we have planned!",
    timestamp: "10:30 AM",
    date: "Yesterday",
  },
  {
    id: "msg-2",
    sender: "client",
    content:
      "That sounds wonderful! Can we add a day in Santorini? I've always wanted to see those iconic blue domes.",
    timestamp: "10:45 AM",
    date: "Yesterday",
  },
  {
    id: "msg-3",
    sender: "advisor",
    content:
      "Absolutely! I'll add an extra day in Santorini. I recommend staying in Oia for the best sunset views. I'll also arrange a private wine tasting tour at one of the local vineyards.",
    timestamp: "11:15 AM",
    date: "Yesterday",
  },
  {
    id: "msg-4",
    sender: "client",
    content: "Perfect! That sounds amazing. What about the accommodations?",
    timestamp: "11:30 AM",
    date: "Yesterday",
  },
  {
    id: "msg-5",
    sender: "advisor",
    content:
      "I've secured a beautiful boutique hotel with a cave pool overlooking the caldera. The views are absolutely stunning, especially at sunset. I'll send over the details shortly.",
    timestamp: "11:45 AM",
    date: "Yesterday",
  },
  {
    id: "msg-6",
    sender: "advisor",
    content:
      "Good morning! I've finalized the Santorini accommodations and updated your itinerary. Take a look when you have a chance and let me know if you have any questions.",
    timestamp: "9:00 AM",
    date: "Today",
  },
  {
    id: "msg-7",
    sender: "client",
    content:
      "Good morning! Just reviewed everything - it looks perfect. Thank you so much for all your help!",
    timestamp: "9:30 AM",
    date: "Today",
  },
  {
    id: "msg-8",
    sender: "advisor",
    content:
      "You're very welcome! I'm so excited for your trip. Don't hesitate to reach out if you need anything else before departure. Safe travels!",
    timestamp: "9:45 AM",
    date: "Today",
  },
];

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-phoenix-charcoal/70 text-phoenix-text-muted text-xs px-3 py-1 rounded-full">
        {date}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  advisorName,
  advisorInitials,
}: {
  message: Message;
  advisorName: string;
  advisorInitials: string;
}) {
  const isClient = message.sender === "client";

  return (
    <div className={cn("flex gap-3 mb-4", isClient ? "flex-row-reverse" : "flex-row")}>
      {!isClient && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-phoenix-gold text-white text-xs">
            {advisorInitials}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3",
          isClient
            ? "bg-phoenix-gold/20 border border-phoenix-gold/30 rounded-br-md"
            : "bg-phoenix-charcoal/70 border border-phoenix-gold/20 rounded-bl-md"
        )}
      >
        {!isClient && (
          <p className="text-xs text-phoenix-gold font-medium mb-1">{advisorName}</p>
        )}
        <p className="text-white text-sm leading-relaxed">{message.content}</p>
        <p
          className={cn(
            "text-xs mt-2",
            isClient ? "text-phoenix-gold/70 text-right" : "text-phoenix-text-muted"
          )}
        >
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}

function MessageInputForm({ onSendMessage }: { onSendMessage: (content: string) => void }) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <Textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white placeholder:text-phoenix-text-muted focus-visible:ring-phoenix-gold"
        rows={1}
      />
      <Button type="submit" disabled={!inputValue.trim()} className="btn-phoenix-primary h-[44px] px-4">
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}

export default function MessagesPage() {
  const { consultant } = useConsultant();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const advisorInitials = consultant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const messagesByDate = messages.reduce(
    (acc, message) => {
      if (!acc[message.date]) {
        acc[message.date] = [];
      }
      acc[message.date].push(message);
      return acc;
    },
    {} as Record<string, Message[]>
  );

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "client",
      content,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      date: "Today",
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.32))]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-phoenix-text-muted hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Dashboard</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
          </div>
          <p className="text-phoenix-text-muted mt-1 ml-10">Chat with your travel advisor</p>
        </div>

        <div className="flex items-center gap-3 ml-10 sm:ml-0">
          <Avatar className="h-10 w-10 border-2 border-phoenix-gold">
            <AvatarFallback className="bg-phoenix-gold text-white">{advisorInitials}</AvatarFallback>
          </Avatar>
          <div className="text-right">
            <p className="font-medium text-white">{consultant.name}</p>
            <p className="text-xs text-phoenix-text-muted">{consultant.title || "Travel Consultant"}</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col bg-phoenix-charcoal/50 border-phoenix-gold/30 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {Object.entries(messagesByDate).map(([date, dateMessages]) => (
              <div key={date}>
                <DateSeparator date={date} />
                {dateMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    advisorName={consultant.name}
                    advisorInitials={advisorInitials}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-phoenix-gold/30 bg-phoenix-charcoal/70">
          <MessageInputForm onSendMessage={handleSendMessage} />
        </div>
      </Card>
    </div>
  );
}
