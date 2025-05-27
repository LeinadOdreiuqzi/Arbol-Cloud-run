"use client";
import Link from "next/link";

export default function WikiLink({ children }: { children: string }) {
  const label = children.trim();
  const slug = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <Link href={`/notes/${slug}`} className="wiki-link-main">
      {label}
    </Link>
  );
}
