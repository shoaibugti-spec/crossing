import { ArrowLeft, Send, Paperclip, FileText, Lock, CheckCircle, AlertTriangle, Shield, X, Image, File } from "lucide-react";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";

// ══════════════════════════════════════════════
// CROSSING SAFETY ENGINE — Personal Info Detection
// ══════════════════════════════════════════════
const BLOCKED_PATTERNS = [
  // Phone numbers
  /(\+?\d[\d\s\-\(\)]{7,}\d)/,
  // Email addresses
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  // Apps & Platforms
  /\b(whatsapp|whats\s*app|wp|w\.a|watsapp)\b/i,
  /\b(telegram|tele\s*gram|tg)\b/i,
  /\b(signal|imo|wechat|we\s*chat|viber|skype|snapchat|line\s*app)\b/i,
  /\b(instagram|insta|facebook|fb|twitter|tiktok)\b/i,
  /\b(messenger|direct\s*message|dm\s*me)\b/i,
  // Contact requests
  /\b(phone\s*number|mobile\s*number|cell\s*number|contact\s*number)\b/i,
  /\b(my\s*number|my\s*contact|my\s*phone|my\s*mobile|my\s*cell)\b/i,
  /\b(call\s*me|text\s*me|ping\s*me|reach\s*me|message\s*me)\b/i,
  /\b(email\s*me|email\s*address|my\s*email|send\s*email)\b/i,
  /\b(send\s*me\s*your|share\s*your|give\s*me\s*your)\b/i,
  /\b(outside|direct\s*contact|personal\s*contact|private\s*contact)\b/i,
  /\b(contact\s*outside|talk\s*outside|chat\s*outside|meet\s*outside)\b/i,
  // Payment outside
  /\b(send\s*money|transfer\s*money|pay\s*me|payment\s*outside)\b/i,
  /\b(bank\s*transfer|direct\s*payment|cash\s*app|paypal|easypaisa|jazzcash)\b/i,
  /\b(crypto\s*wallet|bitcoin\s*address|btc\s*address|usdt\s*address)\b/i,
  // Urdu/Roman Urdu patterns
  /\b(apna\s*number|mera\s*number|whatsapp\s*karo|call\s*karo)\b/i,
  /\b(bahar|app\s*ke\s*bahar|direct\s*baat|personal\s*baat)\b/i,
  // @ handles
  /@[A-Za-z0-9_.]{2,}/,
  // Suspicious short codes
  /\b\d{4,5}\b.*\b\d{4,5}\b/,
];

const VIOLATION_MESSAGES: Record<string, string> = {
  phone: "Phone number detected",
  email: "Email address detected",
  app: "External app mentioned",
  contact: "External contact request",
  payment: "External payment request",
  urdu: "Personal contact request detected",
  handle: "Social media handle detected",
};

function detectViolation(text: string): string | null {
  const lower = text.toLowerCase();

  if (/(\+?\d[\d\s\-\(\)]{7,}\d)/.test(text)) return "phone";
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text)) return "email";
  if (/\b(whatsapp|whats\s*app|telegram|signal|imo|wechat|viber|skype|snapchat|messenger|instagram|facebook|tiktok)\b/i.test(text)) return "app";
  if (/\b(phone\s*number|mobile\s*number|call\s*me|text\s*me|email\s*me|send\s*me\s*your|share\s*your|give\s*me\s*your|contact\s*outside|outside)\b/i.test(text)) return "contact";
  if (/\b(send\s*money|transfer\s*money|pay\s*me|paypal|easypaisa|jazzcash|bank\s*transfer|crypto\s*wallet|btc\s*address)\b/i.test(text)) return "payment";
  if (/\b(apna\s*number|mera\s*number|whatsapp\s*karo|call\s*karo|bahar|direct\s*baat)\b/i.test(text)) return "urdu";
  if (/@[A-Za-z0-9_.]{2,}/.test(text)) return "handle";

  return null;
}

const CHATS: Record<string, {
  name: string; role: string; avatar: string; verified: boolean;
  orderId: string; orderTitle: string; orderAmount: number;
  messages: { id: number; from: "me" | "them"; text: string; time: string; type?: string; file?: string }[];
}> = {
  "1": {
    name: "ImmigrationPro", role: "Visa Provider · 🇨🇦 Canada",
    avatar: "IP", verified: true, orderId: "TXN-001",
    orderTitle: "Canada Express Entry — PR", orderAmount: 499,
    messages: [
      { id: 1, from: "them", text: "السلام علیکم! I received your escrow payment. Let's start your Canada PR application.", time: "10:00 AM" },
      { id: 2, from: "them", text: "🌐 Translated from Arabic", time: "10:00 AM", type: "translate" },
      { id: 3, from: "me", text: "Wa alaikum assalam! What documents do you need?", time: "10:02 AM" },
      { id: 4, from: "them", text: "Please upload through this chat:\n1. Passport (all pages)\n2. IELTS result\n3. Educational certificates\n4. Work experience letters", time: "10:05 AM" },
    ],
  },
  "2": {
    name: "Global Edu", role: "Study Visa · 🇬🇧 UK",
    avatar: "GE", verified: true, orderId: "TXN-002",
    orderTitle: "UK Student Visa", orderAmount: 299,
    messages: [
      { id: 1, from: "them", text: "Hello! Your UK student visa application submitted to embassy.", time: "9:00 AM" },
      { id: 2, from: "me", text: "Thank you! How long will it take?", time: "9:05 AM" },
      { id: 3, from: "them", text: "Usually 3-4 weeks. I will update you immediately.", time: "9:07 AM" },
    ],
  },
  "3": {
    name: "Rafique Jobs", role: "Work Visa · 🇦🇪 UAE",
    avatar: "RJ", verified: true, orderId: "TXN-003",
    orderTitle: "UAE Work Visa — IT Sector", orderAmount: 199,
    messages: [
      { id: 1, from: "them", text: "Hello! Please upload your documents to proceed.", time: "11:00 AM" },
    ],
  },
};

const QUICK_REPLIES = [
  "What documents do you need?",
  "Please send an update",
  "I have uploaded the documents",
  "How long will it take?",
];

export function ChatView() {
  const { id } = useParams({ from: "/messages/$id" });
  const navigate = useNavigate();
  const chat = CHATS[id] ?? CHATS["1"];

  const [messages, setMessages] = useState(chat.messages);
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [showPolicyBanner, setShowPolicyBanner] = useState(true);
  const [showEscrowBanner, setShowEscrowBanner] = useState(true);
  const [violation, setViolation] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [showSuspendWarning, setShowSuspendWarning] = useState(false);
  const [showDocConfirm, setShowDocConfirm] = useState(false);
  const [pendingDoc, setPendingDoc] = useState("");
  const [docsSubmitted, setDocsSubmitted] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;

    const v = detectViolation(text);
    if (v) {
      setViolation(v);
      setViolationCount((c) => {
        const next = c + 1;
        if (next >= 3) setShowSuspendWarning(true);
        return next;
      });
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
    setMessages((m) => [...m, {
      id: m.length + 1, from: "me" as const,
      text: `📎 Document uploaded: ${pendingDoc}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "doc", file: pendingDoc,
    }]);
    setTimeout(() => {
      setMessages((m) => [...m, {
        id: m.length + 1, from: "them" as const,
        text: `✅ Received: ${pendingDoc}. I will review and confirm shortly.`,
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
          <div className="text-xs text-gray-400">{chat.role}</div>
        </div>
        <Link to="/transactions">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5 text-center">
            <div className="text-[10px] font-bold text-amber-600">🔒 ${chat.orderAmount}</div>
            <div className="text-[9px] text-amber-400">Escrow</div>
          </div>
        </Link>
      </div>

      {/* ESCROW BANNER */}
      {showEscrowBanner && (
        <div className="mx-3 mt-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0">
          <Lock size={12} className="text-[#1a56f0] flex-shrink-0" />
          <span className="text-[11px] text-blue-700 flex-1 font-semibold">
            🔒 {chat.orderTitle} · #{chat.orderId} · Escrow Active
          </span>
          <button onClick={() => setShowEscrowBanner(false)}>
            <X size={13} className="text-blue-300" />
          </button>
        </div>
      )}

      {/* POLICY BANNER */}
      {showPolicyBanner && (
        <div className="mx-3 mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex-shrink-0">
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[11px] font-black text-red-600 mb-0.5">
                ⚠️ Crossing Safety Policy — Please Read
              </div>
              <div className="text-[10px] text-red-500 leading-relaxed">
                Do NOT share phone numbers, emails, WhatsApp, Telegram or any external contact. All documents must be uploaded through this app only. Violations will result in account suspension and loss of Escrow protection.
              </div>
            </div>
            <button onClick={() => setShowPolicyBanner(false)} className="flex-shrink-0 mt-0.5">
              <X size={14} className="text-red-300" />
            </button>
          </div>
        </div>
      )}

      {/* VIOLATION COUNT WARNING */}
      {violationCount > 0 && violationCount < 3 && (
        <div className="mx-3 mt-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0">
          <AlertTriangle size={13} className="text-orange-500 flex-shrink-0" />
          <span className="text-[11px] text-orange-600 font-semibold flex-1">
            Warning {violationCount}/3 — Account will be suspended on 3rd violation
          </span>
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 bg-[#F2F3F7]">
        {messages.map((msg) => {
          if (msg.type === "translate") {
            return (
              <div key={msg.id} className="self-center bg-purple-50 border border-purple-100 rounded-xl px-3 py-1.5">
                <span className="text-[11px] text-purple-600">🌐 {msg.text}</span>
              </div>
            );
          }
          if (msg.type === "doc") {
            return (
              <div key={msg.id} className="flex flex-col gap-0.5 items-end">
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

      {/* DOCS STATUS */}
      {docsSubmitted.length > 0 && (
        <div className="mx-3 mb-1 bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex-shrink-0">
          <div className="text-[11px] font-bold text-green-600 mb-1">✅ Uploaded ({docsSubmitted.length})</div>
          <div className="flex flex-wrap gap-1">
            {docsSubmitted.map((d) => (
              <span key={d} className="text-[10px] bg-white border border-green-100 text-green-600 px-2 py-0.5 rounded-full">{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* QUICK REPLIES */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 flex-shrink-0 scrollbar-none bg-white border-t border-gray-50">
        {QUICK_REPLIES.map((q) => (
          <button key={q} onClick={() => setText(q)}
            className="flex-shrink-0 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#1a56f0]/40 hover:text-[#1a56f0] transition-all">
            {q}
          </button>
        ))}
      </div>

      {/* ATTACH MENU */}
      {showAttach && (
        <div className="mx-4 mb-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex-shrink-0">
          <div className="text-xs font-bold text-gray-600 mb-3">📎 Upload Document — In-App Only</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: FileText, label: "Passport", color: "bg-blue-50 text-blue-500" },
              { icon: File, label: "IELTS Result", color: "bg-green-50 text-green-500" },
              { icon: File, label: "Work Letter", color: "bg-amber-50 text-amber-500" },
              { icon: Image, label: "Photo", color: "bg-purple-50 text-purple-500" },
              { icon: FileText, label: "Certificate", color: "bg-indigo-50 text-indigo-500" },
              { icon: FileText, label: "Bank Statement", color: "bg-rose-50 text-rose-500" },
            ].map(({ icon: Icon, label, color }) => (
              <button key={label} onClick={() => uploadDoc(label)}
                className="flex flex-col items-center gap-1.5 py-3 bg-gray-50 rounded-xl hover:bg-gray-100">
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
        <button onClick={() => setShowAttach(!showAttach)}
          className={`p-2 rounded-xl transition-all ${showAttach ? "bg-[#1a56f0] text-white" : "bg-gray-50 text-gray-400"}`}>
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
        <button onClick={send} disabled={!text.trim()}
          className="w-10 h-10 rounded-xl bg-[#1a56f0] flex items-center justify-center flex-shrink-0 disabled:opacity-40">
          <Send size={16} className="text-white" />
        </button>
      </div>

      {/* ══ VIOLATION MODAL ══ */}
      {violation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={30} className="text-red-500" />
              </div>
              <div className="font-black text-gray-800 text-lg mb-1">
                🚫 Policy Violation
              </div>
              <div className="text-sm font-semibold text-red-500 mb-2">
                {VIOLATION_MESSAGES[violation]}
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                Sharing personal contact information is strictly prohibited on Crossing. This protects you from fraud and ensures your Escrow funds remain safe.
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
              <div className="text-xs font-black text-red-600 mb-2">Why this is blocked:</div>
              <div className="flex flex-col gap-1.5">
                {[
                  "Sharing contact info removes Escrow protection",
                  "Fraud risk increases 90% outside the platform",
                  "Crossing cannot resolve disputes outside the app",
                  "Repeated violations lead to account suspension",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <X size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] text-red-500">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-center">
              <div className="text-xs font-black text-amber-600">
                ⚠️ Violation {violationCount} of 3
              </div>
              <div className="text-[10px] text-amber-500 mt-0.5">
                Account suspended on 3rd violation
              </div>
            </div>

            <button
              onClick={() => { setViolation(null); setText(""); }}
              className="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl text-sm mb-2"
            >
              I Understand — Clear Message
            </button>
            <button
              onClick={() => setViolation(null)}
              className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm"
            >
              Edit Message
            </button>
          </div>
        </div>
      )}

      {/* ══ SUSPEND WARNING MODAL ══ */}
      {showSuspendWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield size={30} className="text-red-600" />
              </div>
              <div className="font-black text-red-600 text-xl mb-1">
                Account Warning
              </div>
              <div className="text-sm text-gray-600 leading-relaxed">
                You have reached 3 policy violations. Your account has been flagged and is under admin review.
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <div className="text-xs text-red-600 leading-relaxed font-semibold">
                Crossing Safety Team has been notified. Your Escrow funds are safe and protected. If this was a mistake, contact our support team immediately.
              </div>
            </div>
            <Link to="/help">
              <button className="w-full bg-[#1a56f0] text-white font-bold py-3.5 rounded-2xl text-sm mb-2">
                Contact Support
              </button>
            </Link>
            <button
              onClick={() => setShowSuspendWarning(false)}
              className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* ══ DOCUMENT CONFIRM MODAL ══ */}
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
                Shared securely with {chat.name} only through Crossing.
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex gap-2">
              <Shield size={14} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-700">
                Your document is encrypted and stays within Crossing. The provider cannot share it externally.
              </div>
            </div>
            <button onClick={confirmUpload}
              className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm mb-2">
              ✓ Confirm Upload
            </button>
            <button onClick={() => setShowDocConfirm(false)}
              className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
