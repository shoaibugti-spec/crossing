import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageCircle, Shield, Mail, HeadphonesIcon, Globe, X } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const FAQS = [
  {
    category: "Payments & Escrow", icon: "🔒",
    questions: [
      { q: "How does Escrow work?", a: "When you deposit funds, they are locked in Crossingate Escrow — not sent to the provider. Funds are only released after you confirm receipt of your visa. If anything goes wrong, file a dispute for a full refund." },
      { q: "What currency do you use?", a: "Crossingate uses USDT (Tether) on TRC-20 network. Fast, borderless, low fees. No bank account needed." },
      { q: "When are funds released to the provider?", a: "Only after you click 'Confirm Visa Received' in the Transactions page. Never confirm before receiving your documents." },
      { q: "What if I want a refund?", a: "File a dispute if visa is rejected or provider fails to deliver. Admin reviews evidence and issues refund if fraud or failure is confirmed." },
      { q: "What is the Crossingate service fee?", a: "Crossingate charges a flat $72 service fee per transaction. This covers escrow protection, dispute resolution, and platform maintenance." },
    ],
  },
  {
    category: "Verification & KYC", icon: "✅",
    questions: [
      { q: "Why do I need to verify my identity?", a: "KYC builds trust between buyers and sellers. Verified users can access Escrow payments, post ads, and are protected from fraud." },
      { q: "How long does KYC take?", a: "Level 3 (Identity) takes 24-48 hours for admin review. Make sure photos are clear and well-lit for faster approval." },
      { q: "What documents are accepted?", a: "Passport, National ID card, or Driving License. Must be valid, clearly readable, and match your registered name." },
      { q: "My KYC was rejected — what do I do?", a: "Check the rejection reason shown on your KYC page. Retake photos in good lighting, make sure your face and document are both clearly visible in the selfie, then resubmit." },
      { q: "Is my data safe?", a: "Yes. All documents are encrypted and stored securely. They are only used for identity verification and never shared with third parties." },
    ],
  },
  {
    category: "Visa Providers", icon: "🏢",
    questions: [
      { q: "How are providers verified?", a: "Providers complete full KYC including business registration, trade license, office address, and security deposit. All verified by our admin team." },
      { q: "What if a provider disappears after payment?", a: "Your funds are safe in Escrow — provider never receives money until you confirm delivery. File a dispute immediately if they stop responding." },
      { q: "Can I negotiate the price?", a: "Yes! Use in-app chat to message the provider before depositing. Chat unlocks automatically after you place an order." },
      { q: "How do I become a provider?", a: "Sign up as Visa Provider → Complete KYC → Setup Services → Pay Security Deposit → Post your first ad. Admin reviews and approves each step." },
    ],
  },
  {
    category: "Disputes & Safety", icon: "⚖️",
    questions: [
      { q: "How do I file a dispute?", a: "Go to Transactions → find your order → tap 'Raise Issue'. Describe the problem and submit. Admin will review within 24 hours." },
      { q: "How long does a dispute take?", a: "Most disputes resolved within 3-7 business days. Complex cases up to 14 days. Escrow funds remain locked during review." },
      { q: "What evidence should I provide?", a: "Screenshots of chat, documents submitted, promises made by provider, and timeline of events. More evidence = faster resolution." },
      { q: "Can I cancel an order?", a: "Yes, but only before the first document is submitted. Once any document is submitted, the transaction is locked and you must raise a dispute to resolve issues." },
    ],
  },
  {
    category: "Account & Settings", icon: "⚙️",
    questions: [
      { q: "How do I change my password?", a: "Go to Login page → tap 'Forgot Password' → enter your email → follow the reset link sent to your inbox." },
      { q: "How do I deposit funds?", a: "Go to Wallet → Deposit → send USDT to our TRC-20 address → upload payment screenshot → Admin confirms within 24 hours." },
      { q: "How do I withdraw funds?", a: "Go to Wallet → Withdraw → enter your USDT TRC-20 address and amount → Admin processes within 24-48 hours." },
      { q: "Can I use Crossingate on mobile?", a: "Yes! Crossingate is a Progressive Web App (PWA). Tap 'Install' when prompted to add it to your home screen for the best experience." },
    ],
  },
];

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ur", label: "اردو", flag: "🇵🇰" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
];

const TRANSLATIONS: Record<string, any> = {
  en: { hero: "How can we help?", heroSub: "Find answers or chat with our support team", searchPlaceholder: "Search help articles...", stillNeedHelp: "Still need help?", liveChat: "Live Chat Support", liveChatSub: "Available 24/7 · Usually replies in minutes", emailSupport: "Email Support", emailSub: "info@crossingate.com · 24h response", fileDispute: "File a Dispute", disputeSub: "For payment and fraud issues", noResults: "No results found" },
  ur: { hero: "ہم آپ کی کیسے مدد کر سکتے ہیں؟", heroSub: "سوالات کے جوابات یا ہماری ٹیم سے چیٹ کریں", searchPlaceholder: "سوالات تلاش کریں...", stillNeedHelp: "ابھی بھی مدد چاہیے؟", liveChat: "لائیو چیٹ سپورٹ", liveChatSub: "24/7 دستیاب · چند منٹوں میں جواب", emailSupport: "ای میل سپورٹ", emailSub: "info@crossingate.com · 24 گھنٹے میں جواب", fileDispute: "شکایت درج کریں", disputeSub: "ادائیگی اور فراڈ کے مسائل کے لیے", noResults: "کوئی نتیجہ نہیں ملا" },
  ar: { hero: "كيف يمكننا مساعدتك؟", heroSub: "ابحث عن الإجابات أو تحدث مع فريق الدعم", searchPlaceholder: "ابحث في مقالات المساعدة...", stillNeedHelp: "هل لا تزال بحاجة إلى مساعدة؟", liveChat: "دعم الدردشة المباشرة", liveChatSub: "متاح 24/7 · يرد عادةً في دقائق", emailSupport: "دعم البريد الإلكتروني", emailSub: "info@crossingate.com · رد خلال 24 ساعة", fileDispute: "تقديم نزاع", disputeSub: "لمشاكل الدفع والاحتيال", noResults: "لم يتم العثور على نتائج" },
  hi: { hero: "हम आपकी कैसे मदद कर सकते हैं?", heroSub: "जवाब खोजें या हमारी टीम से चैट करें", searchPlaceholder: "सहायता लेख खोजें...", stillNeedHelp: "अभी भी मदद चाहिए?", liveChat: "लाइव चैट सपोर्ट", liveChatSub: "24/7 उपलब्ध · मिनटों में जवाब", emailSupport: "ईमेल सपोर्ट", emailSub: "info@crossingate.com · 24 घंटे में जवाब", fileDispute: "विवाद दर्ज करें", disputeSub: "भुगतान और धोखाधड़ी के मुद्दों के लिए", noResults: "कोई परिणाम नहीं मिला" },
};

interface ChatMsg {
  id: string;
  text: string;
  from_role: "user" | "admin";
  created_at: string;
}

export function Help() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [lang, setLang] = useState("en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];
  const rtl = lang === "ar" || lang === "ur";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showChat]);

  async function openChat() {
    setShowChat(true);
    setChatLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setChatLoading(false);
      void navigate({ to: "/login" });
      return;
    }

    const uid = userData.user.id;
    const email = userData.user.email ?? "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", uid)
      .single();
    const name = profile?.full_name ?? "User";

    // If already have conversation
    if (conversationId) {
      await loadMessages(conversationId);
      setChatLoading(false);
      return;
    }

    // Check existing conversation
    const { data: existing } = await supabase
      .from("support_messages")
      .select("id, conversation_id")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.conversation_id) {
      setConversationId(existing.conversation_id);
      await loadMessages(existing.conversation_id);
      subscribeToReplies(existing.conversation_id);
      setChatLoading(false);
      return;
    }

    // Create new conversation with random UUID
    const newConvId = crypto.randomUUID();

    const { data: newMsg, error: msgError } = await supabase
      .from("support_messages")
      .insert({
        user_id: uid,
        user_name: name,
        user_email: email,
        message: "Chat started",
        status: "open",
        conversation_id: newConvId,
      })
      .select("id, conversation_id")
      .single();

    if (msgError || !newMsg) {
      console.error("Support message error:", msgError);
      setChatLoading(false);
      return;
    }

    // Welcome reply from admin
    await supabase.from("support_replies").insert({
      conversation_id: newMsg.conversation_id,
      message_id: newMsg.id,
      text: "👋 Welcome to Crossingate Support! How can we help you today?",
      from_role: "admin",
      user_id: null,
    });

    setConversationId(newMsg.conversation_id);
    await loadMessages(newMsg.conversation_id);
    subscribeToReplies(newMsg.conversation_id);
    setChatLoading(false);
  }

  async function loadMessages(convId: string) {
    const { data, error } = await supabase
      .from("support_replies")
      .select("id, text, from_role, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load messages error:", error);
      return;
    }
    if (data) setChatMessages(data as ChatMsg[]);
  }

  function subscribeToReplies(convId: string) {
    supabase
      .channel(`support_user_${convId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_replies",
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMsg;
        setChatMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();
  }

  async function sendMessage() {
    if (!chatInput.trim() || !conversationId || sending) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    setSending(true);
    const text = chatInput.trim();
    setChatInput("");

    // Get message_id for this conversation
    const { data: msgRow } = await supabase
      .from("support_messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("support_replies").insert({
      conversation_id: conversationId,
      message_id: msgRow?.id ?? null,
      text,
      from_role: "user",
      user_id: userData.user.id,
    });

    if (error) {
      console.error("Send error:", error);
      setChatInput(text);
      setSending(false);
      return;
    }

    // Update last message in support_messages
    await supabase
      .from("support_messages")
      .update({ message: text, status: "open" })
      .eq("conversation_id", conversationId);

    setSending(false);
  }

  const filtered = FAQS.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (q) => !search || q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0);

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Help & Safety Center</span>
        <div className="ml-auto relative">
          <button onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-1.5 bg-[#E8F0EF] text-[#004B49] text-xs font-bold px-3 py-1.5 rounded-xl">
            <Globe size={13} />
            {LANGUAGES.find((l) => l.code === lang)?.flag} {LANGUAGES.find((l) => l.code === lang)?.label}
          </button>
          {showLangPicker && (
            <div className="absolute right-0 top-9 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 w-40">
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors ${lang === l.code ? "bg-[#E8F0EF] text-[#004B49]" : "text-gray-700 hover:bg-gray-50"}`}>
                  <span>{l.flag}</span>{l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* HERO */}
      <div className="bg-gradient-to-br from-[#00302e] via-[#004B49] to-[#005c59] px-6 py-7 text-center relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#D4AF37]/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-3">
            <HeadphonesIcon size={22} className="text-[#D4AF37]" />
          </div>
          <div className="text-white font-black text-lg mb-1" dir={rtl ? "rtl" : "ltr"}>{t.hero}</div>
          <div className="text-white/60 text-xs mb-4" dir={rtl ? "rtl" : "ltr"}>{t.heroSub}</div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
            <Search size={16} className="text-white/50 flex-shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              dir={rtl ? "rtl" : "ltr"} />
            {search && <button onClick={() => setSearch("")}><X size={14} className="text-white/50" /></button>}
          </div>
        </div>
      </div>

      {/* QUICK LINKS */}
      <div className="mx-4 mt-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: "🔒", label: "Escrow", to: "/wallet" },
            { icon: "⚖️", label: "Disputes", to: "/disputes" },
            { icon: "✅", label: "KYC", to: "/kyc" },
            { icon: "💳", label: "Wallet", to: "/wallet" },
          ].map(({ icon, label, to }) => (
            <Link key={label} to={to as "/"}>
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-[10px] font-bold text-gray-700">{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQS */}
      <div className="mx-4 mt-4 flex flex-col gap-4">
        {search && (
          <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Search size={13} className="text-[#004B49]" />
            <span className="text-xs text-[#004B49] font-semibold">
              {filtered.reduce((n, c) => n + c.questions.length, 0)} results for "{search}"
            </span>
            <button onClick={() => setSearch("")} className="ml-auto"><X size={13} className="text-[#004B49]" /></button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm font-bold text-gray-500">{t.noResults}</div>
            <div className="text-xs text-gray-400 mt-1">Try different keywords or contact support below</div>
            <button onClick={() => void openChat()}
              className="mt-4 bg-[#004B49] text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 mx-auto">
              <MessageCircle size={14} /> Chat with Support
            </button>
          </div>
        ) : (
          filtered.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{cat.icon}</span>
                <span className="text-sm font-black text-gray-800">{cat.category}</span>
                <span className="ml-auto text-[10px] text-gray-400 font-semibold">{cat.questions.length} articles</span>
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                {cat.questions.map((item, i) => (
                  <div key={item.q}>
                    <button onClick={() => setOpenQ(openQ === item.q ? null : item.q)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                      <span className="text-sm font-semibold text-gray-700 flex-1 pr-2">{item.q}</span>
                      {openQ === item.q
                        ? <ChevronUp size={16} className="text-[#004B49] flex-shrink-0" />
                        : <ChevronDown size={16} className="text-gray-300 flex-shrink-0" />}
                    </button>
                    {openQ === item.q && (
                      <div className="px-4 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3 bg-gray-50/50">
                        {item.a}
                      </div>
                    )}
                    {i < cat.questions.length - 1 && <div className="h-px bg-gray-100 mx-4" />}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CONTACT */}
      <div className="mx-4 mt-6">
        <div className="font-black text-gray-800 text-sm mb-3" dir={rtl ? "rtl" : "ltr"}>{t.stillNeedHelp}</div>
        <div className="flex flex-col gap-2.5">

          <button onClick={() => void openChat()}
            className="w-full flex items-center gap-3 bg-gradient-to-r from-[#004B49] to-[#005c59] rounded-2xl px-4 py-4 shadow-lg shadow-[#004B49]/20">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={18} className="text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-black text-white">{t.liveChat}</div>
              <div className="text-xs text-white/70">{t.liveChatSub}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          </button>

          <a href="mailto:info@crossingate.com"
            className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#E8F0EF] flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-[#004B49]" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-gray-800">{t.emailSupport}</div>
              <div className="text-xs text-gray-400">{t.emailSub}</div>
            </div>
          </a>

          <button onClick={() => void navigate({ to: "/disputes" })}
            className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-red-400" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-gray-800">{t.fileDispute}</div>
              <div className="text-xs text-gray-400">{t.disputeSub}</div>
            </div>
          </button>
        </div>
      </div>

      {/* ── LIVE CHAT PANEL ── */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChat(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl flex flex-col" style={{ height: "85vh" }}>

            {/* Chat header */}
            <div className="bg-gradient-to-r from-[#004B49] to-[#005c59] px-5 py-4 rounded-t-3xl flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center">
                <HeadphonesIcon size={18} className="text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <div className="text-white font-black text-sm">Crossingate Support</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-white/60 text-[10px]">Online · Admin replies in minutes</span>
                </div>
              </div>
              <button onClick={() => setShowChat(false)}><X size={20} className="text-white/70" /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[#F4F6F6]">
              {chatLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#004B49] flex items-center justify-center">
                      <HeadphonesIcon size={16} className="text-[#D4AF37]" />
                    </div>
                    <span className="text-xs text-gray-400">Connecting...</span>
                  </div>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-xs text-gray-400">No messages yet. Say hello! 👋</span>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.from_role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.from_role === "admin" && (
                      <div className="w-7 h-7 rounded-xl bg-[#004B49] flex items-center justify-center mr-2 flex-shrink-0 mt-auto">
                        <HeadphonesIcon size={13} className="text-[#D4AF37]" />
                      </div>
                    )}
                    <div className={`max-w-[78%] flex flex-col gap-0.5 ${msg.from_role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.from_role === "user"
                          ? "bg-[#004B49] text-white rounded-br-sm"
                          : "bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-400 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick replies */}
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
              {["How does Escrow work?", "KYC rejected", "Request refund", "File dispute", "Withdraw funds"].map((q) => (
                <button key={q} onClick={() => setChatInput(q)}
                  className="flex-shrink-0 text-[10px] font-semibold text-[#004B49] bg-[#E8F0EF] px-3 py-1.5 rounded-full whitespace-nowrap border border-[#004B49]/15">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !sending && void sendMessage()}
                placeholder="Type your message..."
                disabled={chatLoading}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49] disabled:opacity-50"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!chatInput.trim() || sending || chatLoading}
                className="w-11 h-11 rounded-2xl bg-[#004B49] flex items-center justify-center flex-shrink-0 disabled:opacity-40 shadow-lg shadow-[#004B49]/20">
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
