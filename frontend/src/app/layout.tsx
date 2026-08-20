import type { Metadata } from "next";
import "./globals.css";
import "../../github-markdown-css/github-markdown-light.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "JobPilot | Career workspace",
  description: "Set up your JobPilot profile and job preferences.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
