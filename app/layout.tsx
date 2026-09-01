import type { Metadata } from 'next';
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
    'A transparent restorative-justice training demo with cited guidance, safeguards, human review, and evaluation traces.',
  openGraph: {
    title: 'CommonGround AI | Victim-centered RJ practice copilot',
    description:
      'Explore cited restorative-justice guidance, safety safeguards, human approval, evaluations, and observable AI traces.',
    type: 'website',
    url: 'https://commonground-rj-ai.siva-babu.chatgpt.site',
    images: [
      {
        url: 'https://commonground-rj-ai.siva-babu.chatgpt.site/og.jpg',
        width: 1536,
        height: 1024,
        alt: 'CommonGround AI restorative justice practice copilot',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommonGround AI | Victim-centered RJ practice copilot',
    description:
      'Explore cited restorative-justice guidance, safety safeguards, human approval, evaluations, and observable AI traces.',
    images: ['https://commonground-rj-ai.siva-babu.chatgpt.site/og.jpg'],
  },
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
