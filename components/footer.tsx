import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-sm text-muted-foreground">
          Built with ❤️ by the Malaphor team. © {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-4">
          <a
            href="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Terms of Service
          </a>
          <a
            href="https://github.com/your-username/Malaphor/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Report an Issue
          </a>
        </div>
      </div>
    </footer>
  );
} 