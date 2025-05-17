import React from 'react';
import { ModeToggle } from "./ui/mode-toggle";

interface HeaderProps {
  apiStatus: boolean;
}

export default function Header({ apiStatus }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Malaphor</h1>
          <div className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-6">
            <a href="https://github.com/your-username/Malaphor" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/80">
              GitHub
            </a>
            <a href="/docs" className="hover:text-foreground/80">
              Documentation
            </a>
          </nav>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
} 