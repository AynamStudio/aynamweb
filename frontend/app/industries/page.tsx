import type { Metadata } from "next";
import IndustriesPage from "@/components/industries/IndustriesPage";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Software built for real industries: manufacturing, automotive, education, finance, healthcare and technology.",
};

export default function Page() {
  return <IndustriesPage />;
}
