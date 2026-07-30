"use client";
import dynamic from "next/dynamic";

const MiseApp = dynamic(() => import("@/components/MiseApp"), { ssr: false });

export default function Page() {
  return <MiseApp />;
}

