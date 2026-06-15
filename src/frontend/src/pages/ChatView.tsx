import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MoreVertical, Paperclip, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "../lib/mockData";

export function ChatView() {
  const { id } = useParams({ from: "/messages/$id" });
  const conversation =
    MOCK_CONVERSATIONS.find((c) => c.id === id) ?? MOCK_CONVERSATIONS[0];
  const [messages, setMessages] = useState(
    MOCK_MESSAGES.filter((m) => m.conversationId === (id || "conv-1")),
  );
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message change is intentional
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      conversationId: id,
      text,
      senderId: "me",
      senderName: "You",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    toast.success("Message sent");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div
        className="bg-card rounded-xl border border-border/60 shadow-card overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/60 bg-card">
          <Link
            to="/messages"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
              {conversation.participantAvatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              {conversation.participantName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Re:{" "}
              <Link
                to="/ads/$id"
                params={{ id: conversation.adId }}
                className="text-primary hover:underline"
              >
                {conversation.adTitle}
              </Link>
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Ad</DropdownMenuItem>
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">
                Start the conversation by sending a message.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2",
                  msg.isOwn ? "flex-row-reverse" : "flex-row",
                )}
              >
                {!msg.isOwn && (
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {conversation.participantAvatar}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  )}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      msg.isOwn
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground",
                    )}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => toast.info("File attachment coming soon")}
              data-ocid="chat.attachment_button"
            >
              <Paperclip size={16} />
            </Button>
            <Input
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-9"
              data-ocid="chat.message_input"
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={sendMessage}
              disabled={!inputText.trim()}
              data-ocid="chat.send_button"
            >
              <Send size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
