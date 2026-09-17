import type { Metadata } from "next";
import ServicesPage from "@/components/services/ServicesPage";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Web & product development, AI & automation, business software and legacy system modernization — delivered by a small, senior team.",
};

export default function Page() {
  return <ServicesPage />;
}
