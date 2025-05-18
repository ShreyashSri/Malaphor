import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Link from 'next/link'
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material'
import ChatBotWrapper from '../components/chatbot-wrapper'

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Malaphor - Cloud Threat Hunting",
  description: "AI-Enhanced Threat Hunting for Cloud Environments",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
  )
}
