import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { AdDetail } from "./pages/AdDetail";
import { AdminDashboard } from "./pages/AdminDashboard";
import { BrowseAds } from "./pages/BrowseAds";
import { ChatView } from "./pages/ChatView";
import { Disputes } from "./pages/Disputes";
import { Help } from "./pages/Help";
import { KYCFlow } from "./pages/KYCFlow";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Messages } from "./pages/Messages";
import { MyAds } from "./pages/MyAds";
import { Notifications } from "./pages/Notifications";
import { PostAd } from "./pages/PostAd";
import { ProfilePage } from "./pages/ProfilePage";
import { Settings } from "./pages/Settings";
import { SetupServices } from "./pages/SetupServices";
import { Signup } from "./pages/Signup";
import { Transactions } from "./pages/Transactions";
import { Wallet } from "./pages/Wallet";

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
      <Toaster position="top-right" richColors />
    </Layout>
  ),
});

// Route definitions
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const adsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ads",
  component: BrowseAds,
  validateSearch: (search: Record<string, string>) => ({
    q: search.q ?? "",
    country: search.country ?? "",
    type: search.type ?? "",
  }),
});

const adDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ads/$id",
  component: AdDetail,
});

const postAdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/post-ad",
  component: PostAd,
});

const setupServicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup-services",
  component: SetupServices,
});

const myAdsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-ads",
  component: MyAds,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: Messages,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages/$id",
  component: ChatView,
});

const kycRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kyc",
  component: KYCFlow,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$id",
  component: ProfilePage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: Wallet,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: Transactions,
});

const disputesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/disputes",
  component: Disputes,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: Notifications,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminDashboard,
});

const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/help",
  component: Help,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: Signup,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adsRoute,
  adDetailRoute,
  postAdRoute,
  setupServicesRoute,
  myAdsRoute,
  messagesRoute,
  chatRoute,
  kycRoute,
  profileRoute,
  walletRoute,
  transactionsRoute,
  disputesRoute,
  notificationsRoute,
  adminRoute,
  helpRoute,
  settingsRoute,
  loginRoute,
  signupRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
