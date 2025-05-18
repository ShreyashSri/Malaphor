import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import ChatBotWrapper from '@/components/chatbot-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Malaphor - AWS Security Analysis',
  description: 'Analyze your AWS CloudTrail logs for security insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <div className="min-h-screen bg-white dark:bg-gray-900">
            <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">Malaphor</h1>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <ChatBotWrapper />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
