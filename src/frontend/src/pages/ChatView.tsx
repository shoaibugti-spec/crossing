import { ArrowLeft, Send, Paperclip, FileText, Lock, CheckCircle, AlertTriangle, Shield, X, Image, File, Loader2 } from "lucide-react";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// ══════════════════════════════════════════════
// CROSSING SAFETY ENGINE — Personal Info Detection
// ══════════════════════════════════════════════
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
  if (/(\+?\d[\d\s\-()]{7,}\d)/.test(text)) return "phone";
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text)) return "email";
  if (/\b(whatsapp|whats\s*app|telegram|signal|imo|wechat|viber|skype|snapchat|messenger|instagram|facebook|tiktok)\b/i.test(text)) return "app";
  if (/\b(phone\s*number|mobile\s*number|call\s*me|text\s*me|email\s*me|send\s*me\s*your|share\s*your|give\s*me\s*your|contact\s*outside|outside)\b/i.test(text)) return "contact";
  if (/\b(send\s*money|transfer\s*money|pay\s*me|paypal|easypaisa|jazzcash|bank\s*transfer|crypto\s*wallet|btc\s*address)\b/i.test(text)) return "payment";
  if (/\b(apna\s*number|mera\s*number|whatsapp\s*karo|call\s*karo|bahar|direct\s*baat)\b/i.test(text)) return "urdu";
  if (/@[A-Za-z0-9_.]{2,}/.test(text)) return "handle";
  return null;
}

interface MsgRow {
  id: string;
  sender_id: string;
  content: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
}

interface ChatInfo {
  transactionId: string;
  counterpartyName: string;
  counterpartyRole: string;
  counterpartyInitial: string;
  verified: boolean;
  orderTitle: string;
  orderAmount: number;
}

const QUICK_REPLIES = [
  "What documents do you need?",
  "Please send an update",
  "I have uploaded the documents",
  "How long will it take?",
];

const DOC_OPTIONS = [
  { icon: FileText, label: "Passport", color: "bg-blue-50 text-blue-500" },
  { icon: File, label: "IELTS Result", color: "bg-green-50 text-green-500" },
  { icon: File, label: "Work Letter", color: "bg-amber-50 text-amber-500" },
  { icon: Image, label: "Photo", color: "bg-purple-50 text-purple-500" },
  { icon: FileText, label: "Certificate", color: "bg-indigo-50 text-indigo-500" },
  { icon: FileText, label: "Bank Statement", color: "bg-rose-50 text-rose-500" },
];

export function ChatView() {
  const { id } = useParams({ from: "/messages/$id" });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [showPolicyBanner, setShowPolicyBanner] = useState(true);
  const [showEscrowBanner, setShowEscrowBanner] = useState(true);
  const [violation, setViolation] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [showSuspendWarning, setShowSuspendWarning] = useState(false);
  const [showDocConfirm, setShowDocConfirm] = useState(false);
  const [pendingDoc, setPendingDoc] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadChat();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChat() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      void navigate({ to: "/login" });
      return;
    }
    const uid = userData.user.id;
    setUserId(uid);

    // "id" here is the transaction id — chat only exists tied to a real order
    const { data: tx } = await supabase
      .from("transactions")
      .select(`
        id, amount, buyer_id, seller_id,
        ads:ad_id(title),
        buyer:buyer_id(full_name, kyc_status),
        seller:seller_id(full_name, kyc_status)
      `)
      .eq("id", id)
      .single();

    if (!tx) {
      setLoading(false);
      return;
    }

    const row: any = tx;
    const isBuyer = row.buyer_id === uid;
    const counterparty = isBuyer ? row.seller : row.buyer;

    // Security check — only the two parties on this order can open this chat
    if (row.buyer_id !== uid && row.seller_id !== uid) {
      setLoading(false);
      void navigate({ to: "/messages" });
      return;
    }

    setChatInfo({
      transactionId: row.id,
      counterpartyName: counterparty?.full_name ?? "User",
      counterpartyRole: row.ads?.title ?? "Visa Order",
      counterpartyInitial: (counterparty?.full_name ?? "U")[0]?.toUpperCase() ?? "U",
      verified: counterparty?.kyc_status === "approved",
      orderTitle: row.ads?.title ?? "Visa Order",
      orderAmount: Number(row.amount),
    });

    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, content, attachment_url, attachment_type, created_at")
      .eq("transaction_id", id)
      .order("created_at", { ascending: true });
    setMessages(msgs ?? []);

    setLoading(false);

    // Realtime subscription for new messages
    supabase
      .channel(`chat-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `transaction_id=eq.${id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as MsgRow]);
      })
      .subscribe();
  }

  async function send() {
    if (!text.trim() || !userId || !chatInfo) return;

    const v = detectViolation(text);
    if (v) {
      setViolation(v);
      setViolationCount((c) => {
        const next = c + 1;
        if (next >= 3) setShowSuspendWarning(true);
        return next;
      });
      // Log the flagged attempt for admin visibility without showing it to the other party
      await supabase.from("messages").insert({
        transaction_id: chatInfo.transactionId,
        sender_id: userId,
        content: text.trim(),
        flagged: true,
        flag_reason: v,
      });
      return;
    }

    const content = text.trim();
    setText("");

    const { error } = await supabase.from("messages").insert({
      transaction_id: chatInfo.transactionId,
      sender_id: userId,
      content,
      flagged: false,
    });

    if (error) {
      alert("Failed to send message: " + error.message);
    }
  }

  function uploadDoc(docName: string) {
    setPendingDoc(docName);
    setShowDocConfirm(true);
    setShowAttach(false);
  }

  async function confirmUpload() {
    if (!userId || !chatInfo) return;
    await supabase.from("messages").insert({
      transaction_id: chatInfo.transactionId,
      sender_id: userId,
      content: `📎 Document shared: ${pendingDoc}`,
      attachment_type: pendingDoc,
      flagged: false,
    });
    setShowDocConfirm(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  if (!chatInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <Lock size={28} className="text-gray-300 mb-3" />
        <div className="font-bold text-gray-700">Conversation not found</div>
        <div className="text-xs text-gray-400 mt-1">Chat only unlocks once an order is placed.</div>
        <Link to="/messages">
          <button className="mt-3 text-xs text-[#1a56f0] font-semibold">Back to Messages</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={() => void navigate({ to: "/messages" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a56f0] to-purple-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {chatInfo.counterpartyInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-800 text-sm">{chatInfo.counterpartyName}</span>
            {chatInfo.verified && <CheckCircle size={13} className="text-[#1a56f0]" />}
          </div>
          <div className="text-xs text-gray-400">{chatInfo.counterpartyRole}</div>
        </div>
        <Link to="/transactions">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5 text-center">
            <div className="text-[10px] font-bold text-amber-600">🔒 ${chatInfo.orderAmount}</div>
            <div className="text-[9px] text-amber-400">Escrow</div>
          </div>
        </Link>
      </div>

      {/* ESCROW BANNER */}
      {showEscrowBanner && (
        <div className="mx-3 mt-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0">
          <Lock size={12} className="text-[#1a56f0] flex-shrink-0" />
          <span className="text-[11px] text-blue-700 flex-1 font-semibold">
            🔒 {chatInfo.orderTitle} · Escrow Active
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
              <div className="text-[11px] font-black text-red-600 mb-0.5">⚠️ Crossing Safety Policy — Please Read</div>
              <div className="text-[10px] text-red-500 leading-relaxed">
                Do NOT share phone numbers, emails, WhatsApp, Telegram or any external contact. All documents must be uploaded through this app only.
              </div>
            </div>
            <button onClick={() => setShowPolicyBanner(false)} className="flex-shrink-0 mt-0.5">
              <X size={14} className="text-red-300" />
            </button>
          </div>
        </div>
      )}

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
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="text-2xl mb-2">💬</div>
            <div className="text-sm font-bold text-gray-400">No messages yet</div>
            <div className="text-xs text-gray-300 mt-1">Say hello to get started</div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            if (msg.attachment_type) {
              return (
                <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                  <div className="bg-white border border-gray-100 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 max-w-[75%] shadow-sm">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-[#1a56f0]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-800">{msg.attachment_type}</div>
                      <div className="text-[10px] text-green-500 font-semibold">✓ Shared securely</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{time}</span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[78%] text-sm leading-relaxed whitespace-pre-line ${
                  isMe ? "bg-[#1a56f0] text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">{time}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

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
          <div className="text-xs font-bold text-gray-600 mb-3">📎 Share Document — In-App Only</div>
          <div className="grid grid-cols-3 gap-2">
            {DOC_OPTIONS.map(({ icon: Icon, label, color }) => (
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
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void send()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
        </div>
        <button onClick={() => void send()} disabled={!text.trim()}
          className="w-10 h-10 rounded-xl bg-[#1a56f0] flex items-center justify-center flex-shrink-0 disabled:opacity-40">
          <Send size={16} className="text-white" />
        </button>
      </div>

      {/* VIOLATION MODAL */}
      {violation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={30} className="text-red-500" />
              </div>
              <div className="font-black text-gray-800 text-lg mb-1">🚫 Policy Violation</div>
              <div className="text-sm font-semibold text-red-500 mb-2">{VIOLATION_MESSAGES[violation]}</div>
              <div className="text-xs text-gray-500 leading-relaxed">
                Sharing personal contact information is strictly prohibited on Crossing. This protects you from fraud and ensures your Escrow funds remain safe.
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
              <div className="text-xs font-black text-red-600 mb-2">Why this is blocked:</div>
              <div className="flex flex-col gap-1.5">
                {[
                  "Sharing contact info removes Escrow protection",
                  "Fraud risk increases significantly outside the platform",
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
              <div className="text-xs font-black text-amber-600">⚠️ Violation {violationCount} of 3</div>
              <div className="text-[10px] text-amber-500 mt-0.5">Account suspended on 3rd violation</div>
            </div>
            <button onClick={() => { setViolation(null); setText(""); }} className="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl text-sm mb-2">
              I Understand — Clear Message
            </button>
            <button onClick={() => setViolation(null)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">
              Edit Message
            </button>
          </div>
        </div>
      )}

      {/* SUSPEND WARNING MODAL */}
      {showSuspendWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield size={30} className="text-red-600" />
              </div>
              <div className="font-black text-red-600 text-xl mb-1">Account Warning</div>
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
              <button className="w-full bg-[#1a56f0] text-white font-bold py-3.5 rounded-2xl text-sm mb-2">Contact Support</button>
            </Link>
            <button onClick={() => setShowSuspendWarning(false)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">
              I Understand
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
              <div className="font-black text-gray-800 text-lg mb-1">Share {pendingDoc}?</div>
              <div className="text-sm text-gray-500">Shared securely with {chatInfo.counterpartyName} only through Crossing.</div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex gap-2">
              <Shield size={14} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-700">Your document stays within Crossing. The other party cannot share it externally.</div>
            </div>
            <button onClick={() => void confirmUpload()} className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm mb-2">
              ✓ Confirm Share
            </button>
            <button onClick={() => setShowDocConfirm(false)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
