import type { Metadata } from "next";
import ContactPage from "@/components/contact/ContactPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Have a project in mind? Talk to AYNAM about building, automating or modernizing your systems.",
};

export default function Page() {
  return <ContactPage />;
}
