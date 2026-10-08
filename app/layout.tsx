import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlowMesh AI — Speak once. Let AI coordinate the work.',
  description: 'Autonomous Collaborative Multi-Agent Workflow Platform powered by Omi Voice, Qdrant Vector Memory, and Lyzr Orchestration.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07090e] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] pointer-events-none z-0" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
