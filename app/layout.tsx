import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Saurabh | Web Developer, Graphic Designer & Video Editor',
  description: 'Portfolio of Saurabh - Web Developer, Graphic Designer, and Video Editor showcasing premium digital creations.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased bg-[#050508] text-slate-100 selection:bg-electric-blue/30 selection:text-electric-blue" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
