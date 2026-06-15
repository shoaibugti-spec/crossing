# Crossing

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- Full MVP web app for the Crossing visa marketplace platform
- User roles: Buyer, Seller, Admin/Moderator
- Authentication system with role selection (Buyer / Seller / Both)
- Ad listing system: create, browse, search, filter by country/visa type/price/verification level
- Ad detail page with seller info, requirements, pricing, contact unlock CTA
- In-app messaging / conversation system (1:1 chat between buyer and seller)
- KYC verification flow: document upload (ID/passport + selfie), status tracking
- Moderator/Admin dashboard: KYC review queue, user management, ad management, dispute management
- Dispute filing and tracking flow
- User profile pages: public profile with verification badges, ratings, reviews
- Reviews and ratings system (post-transaction)
- Wallet/balance and transaction history UI
- Notifications center
- Help & Safety Center with FAQs
- Settings page

### Modify
N/A (new project)

### Remove
N/A (new project)

## Implementation Plan

### Backend (Motoko)
1. User management: create/get/update users with roles (buyer, seller, admin, moderator)
2. Ad management: CRUD for ads with fields: title, category, country, visa_type, price, currency, requirements, status (draft/active/expired)
3. Conversation & messaging: create conversations between two users, send/get messages
4. KYC document submissions: submit KYC record, update status (pending/approved/rejected), get user KYC status
5. Reviews: submit review with rating + comment for a transaction participant
6. Disputes: file dispute with reason and evidence description, update status
7. Transactions: record a transaction between buyer and seller for an ad
8. Notifications: store and retrieve notifications per user
9. Admin queries: get KYC queue, get all users, get all ads, get disputes list

### Frontend (React + TypeScript)
1. App shell: top nav, sidebar/bottom nav, routing
2. Landing/Home page: hero, search bar, quick filters, featured ads grid
3. Auth pages: sign up (email + role selection), login
4. Browse Ads page: ad cards with filters and search
5. Ad Detail page: images placeholder, requirements list, seller card with verification badge, "Message Seller" / "Unlock Contact" CTA
6. Post Ad wizard: multi-step form (title, category, country, visa type, price, requirements, docs)
7. My Ads page: tabs for active / draft / expired
8. Conversations list + Chat view with message bubbles and file attachment button
9. KYC flow pages: upload ID doc, upload selfie, status page (pending/approved/rejected)
10. Profile page: public view + edit mode, verification badges, reviews list, trust score
11. Reviews: leave review modal after transaction
12. Wallet & Payments: balance card, transaction history list, deposit/withdraw actions
13. Transactions & Escrow: status view per transaction
14. Disputes: file dispute form, dispute status view
15. Notifications center: list of notifications
16. Admin dashboard: stats cards, KYC queue table, users table, ads table, disputes table
17. Help & Safety Center: FAQ accordion
18. Settings: account settings, privacy settings
