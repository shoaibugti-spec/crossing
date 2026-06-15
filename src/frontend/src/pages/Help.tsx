import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Shield } from "lucide-react";

const FAQ_CATEGORIES = [
  {
    category: "Account & KYC",
    items: [
      {
        q: "How do I verify my identity (KYC)?",
        a: "Go to your profile and click on 'KYC Verification'. Upload a valid government-issued ID (passport, CNIC, or national ID) along with a selfie holding the document. Our team reviews submissions within 1-2 business days.",
      },
      {
        q: "What are the different verification levels?",
        a: "Level 0 (Basic): Email/phone verified. Level 1 (Document Verified): Government ID submitted and reviewed. Level 2 (Fully Verified): Video verification completed. Higher levels unlock more platform features.",
      },
      {
        q: "Can I use the platform without KYC verification?",
        a: "You can browse listings without verification. However, to message sellers, unlock contact information, or start transactions, you'll need at least Level 1 verification.",
      },
      {
        q: "My KYC was rejected. What should I do?",
        a: "Review the rejection reason provided by our moderators. Common issues include blurry images, expired documents, or missing selfie. Resubmit with clearer, up-to-date documents.",
      },
    ],
  },
  {
    category: "Listings",
    items: [
      {
        q: "How do I post a visa service listing?",
        a: "Click 'Post Ad' in the navigation. Follow the 4-step wizard: Basic Info, Pricing, Requirements, and Preview. Your ad can be saved as a draft or published immediately (subject to KYC approval).",
      },
      {
        q: "What information should I include in my listing?",
        a: "Include a clear title, visa type, destination country, detailed description of your service, processing timeline, fees, and a checklist of documents required from the buyer.",
      },
      {
        q: "How are listings ranked in search results?",
        a: "Listings are ranked based on relevance, seller verification level, trust score, ratings, and activity. Verified sellers with higher ratings typically appear higher in results.",
      },
    ],
  },
  {
    category: "Payments & Escrow",
    items: [
      {
        q: "How does the escrow payment system work?",
        a: "When you initiate a transaction, funds are held securely by Crossing in escrow. The seller receives payment only after you confirm the service is delivered. If there's a dispute, funds remain frozen until resolved.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept credit/debit cards, bank transfers, and selected local payment wallets. Cryptocurrency payments are also supported via our crypto gateway.",
      },
      {
        q: "When are funds released to the seller?",
        a: "Funds are released when: (1) The buyer confirms service completion, (2) 14 days pass after delivery without a dispute, or (3) A dispute is resolved in the seller's favor.",
      },
      {
        q: "What are the platform fees?",
        a: "Crossing charges a 5% service fee on completed transactions. This covers escrow management, KYC verification, dispute resolution, and platform maintenance.",
      },
    ],
  },
  {
    category: "Safety & Disputes",
    items: [
      {
        q: "How do I report a suspicious user or listing?",
        a: "Click the '...' menu on any listing or user profile and select 'Report'. Provide details about your concern. Our moderation team reviews reports within 24 hours.",
      },
      {
        q: "How do I file a dispute?",
        a: "Go to the Disputes section and click 'File Dispute'. Enter the transaction ID, describe the issue clearly, and attach any evidence. Disputes must be filed within 30 days of the transaction.",
      },
      {
        q: "How long does dispute resolution take?",
        a: "Simple disputes are typically resolved within 3-5 business days. Complex cases involving document review may take up to 14 business days. Both parties are notified at each stage.",
      },
      {
        q: "What happens if the seller doesn't deliver?",
        a: "If the seller fails to deliver within the agreed timeframe, you can open a dispute. If resolved in your favor, you'll receive a full refund of the escrowed amount.",
      },
    ],
  },
  {
    category: "Legal & Compliance",
    items: [
      {
        q: "Is it legal to use Crossing for visa facilitation?",
        a: "Crossing is a platform connecting individuals with licensed visa consultants and agents. We require all sellers to be legitimately licensed in their jurisdiction. Crossing does not provide immigration legal advice.",
      },
      {
        q: "What activities are prohibited on Crossing?",
        a: "Prohibited activities include: facilitating illegal immigration, document forgery, misrepresentation of qualifications, money laundering, and any service that violates immigration law in the destination country.",
      },
      {
        q: "How is my personal data protected?",
        a: "KYC documents are encrypted at rest and in transit. We only retain personal data as required by our verification obligations and applicable laws. You can request data deletion under our privacy policy.",
      },
    ],
  },
];

export function Help() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Help & Safety Center
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Find answers to common questions about using Crossing safely and
          effectively
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { icon: "🪪", label: "KYC Verification", href: "#kyc" },
          { icon: "📋", label: "Posting Ads", href: "#listings" },
          { icon: "💳", label: "Payments", href: "#payments" },
          { icon: "⚖️", label: "Disputes", href: "#disputes" },
        ].map(({ icon, label, href }) => (
          <a
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 p-4 bg-card border border-border/60 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </a>
        ))}
      </div>

      {/* FAQ Accordion by category */}
      <div className="space-y-6">
        {FAQ_CATEGORIES.map((cat) => (
          <div
            key={cat.category}
            id={cat.category.toLowerCase().replace(/\s+/g, "-")}
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="badge-navy text-xs">
                {cat.category}
              </Badge>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {cat.items.map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`${cat.category}-${i}`}
                  className="bg-card border border-border/60 rounded-xl px-5 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground py-4 hover:no-underline">
                    <div className="flex items-start gap-2 text-left">
                      <HelpCircle
                        size={14}
                        className="text-muted-foreground shrink-0 mt-0.5"
                      />
                      {item.q}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                      {item.a}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      {/* Contact section */}
      <div className="mt-10 text-center bg-muted/30 rounded-xl p-8 border border-border/60">
        <h3 className="font-display font-bold text-lg text-foreground mb-2">
          Still need help?
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          Our support team is available 24/7 to help you with any issues
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            Report a Problem
          </button>
        </div>
      </div>
    </div>
  );
}
