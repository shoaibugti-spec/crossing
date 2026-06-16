import { ArrowLeft, Send, Paperclip, FileText, Lock, CheckCircle, AlertTriangle, Shield, X, Image, File } from "lucide-react";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";

const CHATS: Record<string, {
  name: string;
  role: string;
  avatar: string;
  verified: boolean;
  orderId: string;
  orderTitle: string;
  orderAmount: number;
  messages: { id: number; from: "me" | "them"; text: string; time: string; type?: string; file?: string }[];
}> = {
  "1": {
    name: "ImmigrationPro",
    role: "Visa Provider · 🇨🇦 Canada",
    avatar: "IP",
    verified: true,
    orderId: "TXN-001",
    orderTitle: "Canada Express Entry — PR",
    orderAmount: 499,
    messages: [
      { id: 1, from: "them", text: "السلام علیکم! I received your escrow payment. Let's start your Canada PR application.", time: "10:00 AM" },
      { id: 2, from: "them", text: "🌐 Translated from Arabic", time: "10:00 AM", type: "translate" },
      { id: 3, from: "me", text: "Wa alaikum assalam! Great, what documents do you need?", time: "10:02 AM" },
      { id: 4, from: "them", text: "Please upload through this chat:\n1. Passport (all pages)\n2. IELTS result\n3. Educational certificates\n4. Work experience letters", time: "10:05 AM" },
      { id: 5, from: "me", text: "I will upload them now through the app.", time: "10:08 AM" },
    ],
  },
  "2": {
    name: "Global Edu",
    role: "Study Visa · 🇬🇧 UK",
    avatar: "GE",
    verified: true,
    orderId: "TXN-002",
    orderTitle: "UK Student Visa",
    orderAmount: 299,
    messages: [
      { id: 1, from: "them", text: "Hello! Your UK student visa application has been submitted to the embassy.", time: "9:00 AM" },
      { id: 2, from: "me", text: "Thank you! How long will it take?", time: "9:05 AM" },
      { id: 3, from: "them", text: "Usually 3-4 weeks. I will update you immediately.", time: "9:07 AM" },
    ],
  },
};

const QUICK_REPLIES = [
  "What documents do you need?",
  "Please send an update",
  "I have uploaded the documents",
  "How long will it take?",
];

// AI Detection — phone/email patterns
const PERSONAL_INFO_PATTERN = /(\+?\d[\d\s\-]{8,}|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|whatsapp|telegram|@\w+)/i;

export function ChatView() {
  const { id } = useParams({ from: "/messages/$id" });
  const navigate = useNavigate();
  const chat = CHATS[id] ?? CHATS["1"];

  const [messages, setMessages] = useState(chat.messages);
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [showEscrowInfo, setShowEscrowInfo] = useState(true);
  const [showPolicyWarning, setShowPolicyWarning] = useState(true);
  const [showPersonalInfoAlert, setShowPersonalInfoAlert] = useState(false);
  const [showDocConfirm, setShowDocConfirm] = useState(false);
  const [pendingDoc, setPendingDoc] = useState("");
  const [docsSubmitted, setDocsSubmitted] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;

    // AI Detection — personal info check
    if (PERSONAL_INFO_PATTERN.test(text)) {
      setShowPersonalInfoAlert(true);
      return;
    }

    const newMsg = {
      id: messages.length + 1,
      from: "me" as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((m) => [...m, newMsg]);
    setText("");

    setTimeout(() => {
      setMessages((m) => [...m, {
        id: m.length + 1,
        from: "them" as const,
        text: "Thank you. I will review and get back to you shortly.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 1200);
  };

  const uploadDoc = (docName: string) => {
    setPendingDoc(docName);
    setShowDocConfirm(true);
    setShowAttach(false);
  };

  const confirmUpload = () => {
    setDocsSubmitted((d) => [...d, pendingDoc]);
    setShowDocConfirm(false);
    const newMsg = {
      id: messages.length + 1,
      from: "me" as const,
      text: `📎 Document uploaded: ${pendingDoc}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "doc",
      file: pendingDoc,
    };
    setMessages((m) => [...m, newMsg]);
    setTimeout(() => {
      setMessages((m) => [...m, {
        id: m.length + 1,
        from: "them" as const,
        text: `✅ Received: ${pendingDoc}. I will review and confirm.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={() => void navigate({ to: "/messages" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a56f0] to-purple-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {chat.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-800 text-sm">{chat.name}</span>
            {chat.verified && <CheckCircle size={13} className="text-[#1a56f0]" />}
          </div>
          <div className="text-xs text-gray-400 truncate">{chat.role}</div>
        </div>
        <Link to="/transactions">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5 text-center">
            <div className="text-[10px] font-bold text-amber-600">🔒 ${chat.orderAmount}</div>
            <div className="text-[9px] text-amber-400">Escrow</div>
          </div>
        </Link>
      </div>

      {/* ORDER BANNER */}
      <div className="mx-3 mt-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <Lock size={12} className="text-[#1a56f0] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[11px] text-blue-700 font-semibold">{chat.orderTitle}</span>
          <span className="text-[10px] text-blue-400 ml-1">· #{chat.orderId}</span>
        </div>
      </div>

      {/* POLICY WARNING */}
      {showPolicyWarning && (
        <div className="mx-3 mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex-shrink-0">
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[11px] font-black text-red-600 mb-0.5">⚠️ Crossing Safety Policy</div>
              <div className="text-[10px] text-red-500 leading-relaxed">
                Do NOT share personal info (phone, email, WhatsApp, Telegram) in chat. All documents must be uploaded through this app only. Sharing outside voids your Escrow protection.
              </div>
            </div>
            <button onClick={() => setShowPolicyWarning(false)} className="flex-shrink-0">
              <X size={14} className="text-red-300" />
            </button>
          </div>
        </div>
      )}

      {/* ESCROW BANNER */}
      {showEscrowInfo && (
        <div className="mx-3 mt-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0">
          <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
          <span className="text-[11px] text-green-700 flex-1">Escrow active — funds safe until you confirm visa received</span>
          <button onClick={() => setShowEscrowInfo(false)}>
            <X size={13} className="text-green-300" />
          </button>
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 bg-[#F2F3F7]">
        {messages.map((msg) => {

          if (msg.type === "translate") {
            return (
              <div key={msg.id} className="self-center bg-purple-50 border border-purple-100 rounded-xl px-3 py-1.5 flex items-center gap-1.5 max-w-[80%]">
                <span className="text-[11px] text-purple-600">🌐 {msg.text}</span>
              </div>
            );
          }

          if (msg.type === "doc") {
            return (
              <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.from === "me" ? "items-end" : "items-start"}`}>
                <div className="bg-white border border-gray-100 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 max-w-[75%] shadow-sm">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-[#1a56f0]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">{msg.file}</div>
                    <div className="text-[10px] text-green-500 font-semibold">✓ Uploaded securely</div>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.from === "me" ? "items-end" : "items-start"}`}>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[78%] text-sm leading-relaxed whitespace-pre-line ${
                msg.from === "me"
                  ? "bg-[#1a56f0] text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* DOCS SUBMITTED STATUS */}
      {docsSubmitted.length > 0 && (
        <div className="mx-3 mb-1 bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex-shrink-0">
          <div className="text-[11px] font-bold text-green-600 mb-1">
            ✅ Documents Uploaded ({docsSubmitted.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {docsSubmitted.map((d) => (
              <span key={d} className="text-[10px] bg-white border border-green-100 text-green-600 px-2 py-0.5 rounded-full">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* QUICK REPLIES */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 flex-shrink-0 scrollbar-none bg-white border-t border-gray-50">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => setText(q)}
            className="flex-shrink-0 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#1a56f0]/40 hover:text-[#1a56f0] transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ATTACH MENU */}
      {showAttach && (
        <div className="mx-4 mb-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex-shrink-0">
          <div className="text-xs font-bold text-gray-600 mb-3">📎 Upload Document (In-App Only)</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: FileText, label: "Passport", color: "bg-blue-50 text-blue-500" },
              { icon: File, label: "IELTS Result", color: "bg-green-50 text-green-500" },
              { icon: File, label: "Work Letter", color: "bg-amber-50 text-amber-500" },
              { icon: Image, label: "Photo", color: "bg-purple-50 text-purple-500" },
              { icon: FileText, label: "Certificate", color: "bg-indigo-50 text-indigo-500" },
              { icon: FileText, label: "Bank Statement", color: "bg-rose-50 text-rose-500" },
            ].map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                onClick={() => uploadDoc(label)}
                className="flex flex-col items-center gap-1.5 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
              >
                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
                  <Icon size={17} />
                </div>
                <span className="text-[10px] text-gray-500 font-semibold text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-2.5 flex gap-2">
            <Shield size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-[10px] text-red-500">All documents stay within Crossing. Never share outside the app.</span>
          </div>
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
          className="w-10 h-10 rounded-xl bg-[#1a56f0] flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>

      {/* PERSONAL INFO ALERT MODAL */}
      {showPersonalInfoAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPersonalInfoAlert(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={26} className="text-red-500" />
              </div>
              <div className="font-black text-gray-800 text-lg mb-1">Policy Violation Detected</div>
              <div className="text-sm text-gray-500 leading-relaxed">
                Your message contains personal contact information (phone number, email, or external platform).
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <div className="text-xs text-red-600 leading-relaxed">
                Sharing personal info outside Crossing removes your Escrow protection. If you transact outside the app, Crossing cannot protect your funds or resolve disputes.
              </div>
            </div>
            <button
              onClick={() => { setShowPersonalInfoAlert(false); setText(""); }}
              className="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl text-sm mb-2"
            >
              I Understand — Delete Message
            </button>
            <button
              onClick={() => setShowPersonalInfoAlert(false)}
              className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm"
            >
              Edit Message
            </button>
          </div>
        </div>
      )}

      {/* DOCUMENT CONFIRM MODAL */}
      {showDocConfirm && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDocConfirm(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pb-10">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText size={22} className="text-[#1a56f0]" />
              </div>
              <div className="font-black text-gray-800 text-lg mb-1">Upload {pendingDoc}?</div>
              <div className="text-sm text-gray-500">
                This document will be securely shared with {chat.name} only.
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex gap-2">
              <Shield size={14} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-700">
                Your document stays within Crossing. The provider cannot download or share it externally.
              </div>
            </div>
            <button
              onClick={confirmUpload}
              className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm mb-2"
            >
              ✓ Confirm Upload
            </button>
            <button
              onClick={() => setShowDocConfirm(false)}
              className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
