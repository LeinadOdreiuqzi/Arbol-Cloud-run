"use client";
import { MDXProvider } from "@mdx-js/react";
import WikiLink from "../navigation/WikiLink";

const components = {
  WikiLink,
};

export default function MdxPage({ children }: { children: React.ReactNode }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
