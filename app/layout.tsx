import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CommonGround AI | Victim-centered RJ practice copilot',
  description:
    'A transparent restorative-justice AI lab with hybrid RAG, cited guidance, safety gates, human approval, evaluations, and observable LangGraph traces.',
  openGraph: {
    title: 'CommonGround AI | Victim-centered RJ practice copilot',
    description:
      'Explore a live LangGraph workflow with hybrid retrieval, claim-level citations, safety gates, human approval, and executable evaluations.',
    type: 'website',
    url: 'https://commonground-rj-ai.siva-babu.chatgpt.site',
    images: [
      {
        url: 'https://commonground-rj-ai.siva-babu.chatgpt.site/og.jpg',
        width: 1200,
        height: 628,
        alt: 'CommonGround AI restorative justice practice copilot',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommonGround AI | Victim-centered RJ practice copilot',
    description:
      'Explore a live LangGraph workflow with hybrid retrieval, claim-level citations, safety gates, human approval, and executable evaluations.',
    images: ['https://commonground-rj-ai.siva-babu.chatgpt.site/og.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
