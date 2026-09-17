"use client";

/*
 * The internal CRM (/admin/*) lives in the same Next app but must never show
 * the public site chrome (nav, footer, cursor, page transitions). We branch on
 * pathname in one client wrapper so the root layout stays single and simple.
 */
import { usePathname } from "next/navigation";
import { TransitionProvider } from "@/components/motion/TransitionProvider";
import NavBar from "@/components/navigation/NavBar";
import Footer from "@/components/footer/Footer";
import Cursor from "@/components/ui/Cursor";
import ScrollProgress from "@/components/ui/ScrollProgress";

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <main id="main">{children}</main>;
  }

  return (
    <TransitionProvider>
      <NavBar />
      <main id="main">{children}</main>
      <Footer />
      <Cursor />
      <ScrollProgress />
    </TransitionProvider>
  );
}
