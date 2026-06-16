import { ArrowLeft, Send, Paperclip, Image, FileText, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";

const CHATS: Record<string, {
  name: string;
  role: string;
  avatar: string;
  verified: boolean;
  messages: { id: number; from: "me" | "them"; text: string; time: string; type?: string }[];
}> = {
  "1": {
    name: "ImmigrationPro",
    role: "Visa Provider · 🇨🇦 Canada",
    avatar: "IP",
    verified: true,
    messages: [
      { id: 1, from: "them", text: "السلام علیکم! I received your escrow payment. Let's get started on your Canada PR application.", time: "10:00 AM" },
      { id: 2, from: "them", text: "🌐 Translated from Arabic", time: "10:00 AM", type: "translate" },
      { id: 3, from: "me", text: "Wa alaikum assalam! Great, what documents do you need first?", time: "10:02 AM" },
      { id: 4, from: "them", text: "Please send:\n1. Passport copy (all pages)\n2. IELTS result\n3. Educational certificates\n4. Work experience letters (last 3 years)", time: "10:05 AM" },
      { id: 5, from: "me", text: "I will prepare them today and upload through the app.", time: "10:08 AM" },
      { id: 6, from: "them", text: "Perfect! Once I receive them I will review within 48 hours and proceed to embassy submission.", time: "10:10 AM" },
    ],
  },
  "2": {
    name: "Global Edu",
    role: "Study Visa · 🇬🇧 UK",
    avatar: "GE",
    verified: true,
    messages: [
      { id: 1, from: "them", text: "Hello! Your UK student visa application has been submitted to the embassy.", time: "9:00 AM" },
      { id: 2, from: "me", text: "Thank you! How long will it take?", time: "9:05 AM" },
      { id: 3, from: "them", text: "Usually 3-4 weeks. I will update you immediately when there is any news.", time: "9:07 AM" },
    ],
  },
};

const QUICK_REPLIES = [
  "What documents do you need?",
  "What is the current status?",
  "How long will it take?",
  "Please send an update",
];

export function ChatView() {
  const { id } = useParams({ from: "/messages/$id" });
  const navigate = useNavigate();
  const chat = CHATS[id] ?? CHATS["1"];

  const [messages, setMessages] = useState(chat.messages);
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [showEscrowInfo, setShowEscrowInfo] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const newMsg = {
      id: messages.length + 1,
      from: "me" as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((m) => [...m, newMsg]);
    setText("");

    // Auto reply
    setTimeout(() => {
      setMessages((m) => [...m, {
        id: m.length + 1,
        from: "them" as const,
        text: "Thank you for your message. I will get back to you shortly.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => void navigate({ to: "/messages" })}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a56f0] to-purple-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {chat.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-800 text-sm">{chat.name}</span>
            {chat.verified && (
              <CheckCircle size={13} className="text-[#1a56f0] flex-shrink-0" />
            )}
          </div>
          <div className="text-xs text-gray-400 truncate">{chat.role}</div>
        </div>
        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-semibold text-green-600">Online</span>
        </div>
      </div>

      {/* ESCROW BANNER */}
      {showEscrowInfo && (
        <div className="mx-3 mt-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0">
          <Lock size={13} className="text-[#1a56f0] flex-shrink-0" />
          <span className="text-[11px] text-blue-700 flex-1">Escrow active — $499 USDT locked until visa confirmed</span>
          <button onClick={() => setShowEscrowInfo(false)} className="text-blue-300 text-xs font-bold">✕</button>
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.map((msg) => {
          if (msg.type === "translate") {
            return (
              <div key={msg.id} className="self-start bg-purple-50 border border-purple-100 rounded-xl px-3 py-1.5 flex items-center gap-1.5 max-w-[70%]">
                <span className="text-[11px] text-purple-600">🌐 {msg.text}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.from === "me" ? "items-end" : "items-start"}`}>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[78%] text-sm leading-relaxed whitespace-pre-line ${
                msg.from === "me"
                  ? "bg-[#1a56f0] text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-50"
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* QUICK REPLIES */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 flex-shrink-0 scrollbar-none">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => setText(q)}
            className="flex-shrink-0 bg-white border border-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:border-[#1a56f0]/40 hover:text-[#1a56f0] transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ATTACH MENU */}
      {showAttach && (
        <div className="mx-4 mb-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-3 flex gap-3 flex-shrink-0">
          {[
            { icon: Image, label: "Photo", color: "bg-blue-50 text-blue-500" },
            { icon: FileText, label: "Document", color: "bg-green-50 text-green-500" },
            { icon: AlertTriangle, label: "Evidence", color: "bg-red-50 text-red-500" },
          ].map(({ icon: Icon, label, color }) => (
            <button
              key={label}
              onClick={() => { alert(`${label} picker opening...`); setShowAttach(false); }}
              className="flex-1 flex flex-col items-center gap-1.5 py-2"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon size={18} />
              </div>
              <span className="text-[10px] text-gray-500 font-semibold">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* INPUT */}
      <div className="bg-white border-t border-gray-100 px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setShowAttach(!showAttach)}
          className={`p-2 rounded-xl transition-all ${showAttach ? "bg-[#1a56f0] text-white" : "bg-gray-50 text-gray-400"}`}
        >
          <Paperclip size={18} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-100">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-xl bg-[#1a56f0] flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>

    </div>
  );
}
