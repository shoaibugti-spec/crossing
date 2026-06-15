import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { MOCK_CONVERSATIONS } from "../lib/mockData";

export function Messages() {
  const conversations = MOCK_CONVERSATIONS;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">
        Messages
      </h1>

      {conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              to="/messages/$id"
              params={{ id: conv.id }}
              className="block"
            >
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/60 hover:border-primary/30 hover:shadow-card transition-all cursor-pointer">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                    {conv.participantAvatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {conv.participantName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    Re: <span className="text-primary/80">{conv.adTitle}</span>
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unread > 0 && (
                  <Badge className="shrink-0 h-5 min-w-5 px-1.5 bg-primary text-primary-foreground border-0 text-xs font-bold">
                    {conv.unread}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="messages.empty_state"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageCircle size={24} className="text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-lg text-foreground mb-1">
            No conversations yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Start by browsing ads and messaging a seller to begin a
            conversation.
          </p>
        </div>
      )}
    </div>
  );
}
