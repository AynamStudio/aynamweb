import type { Metadata } from "next";
import WorkPage from "@/components/work/WorkPage";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Real work, real results. CITN ERP modernization — a 2009-era C++ / MS SQL Server system rebuilt into a modern, scalable platform.",
};

export default function Page() {
  return <WorkPage />;
}
