import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/theme-provider';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import Link from 'next/link';
import ChatBotWrapper from '../components/chatbot-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Malaphor - Cloud Security Analysis',
  description: 'Analyze your cloud security logs with AI',
  generator: 'Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Malaphor
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
                  Home
                </Link>
                <Link href="/security" style={{ color: 'white', textDecoration: 'none' }}>
                  Security Analysis
                </Link>
              </Box>
            </Toolbar>
          </AppBar>
          <Container maxWidth="lg" sx={{ mt: 4 }}>
            {children}
          </Container>
          <ChatBotWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}
