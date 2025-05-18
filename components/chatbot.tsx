'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Fab, 
  Paper, 
  TextField, 
  IconButton, 
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Send as SendIcon, 
  Close as CloseIcon 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const FloatingButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
}));

const ChatWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(10),
  right: theme.spacing(2),
  width: 350,
  height: 500,
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  boxShadow: theme.shadows[4],
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const MessageBubble = styled(Box)<{ isUser?: boolean }>(({ theme, isUser }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(2),
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[100],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  alignSelf: isUser ? 'flex-end' : 'flex-start',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  gap: theme.spacing(1),
}));

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <FloatingButton
        color="primary"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="chat"
      >
        <ChatIcon />
      </FloatingButton>

      {isOpen && (
        <ChatWindow>
          <ChatHeader>
            <Typography variant="h6">Security Assistant</Typography>
            <IconButton onClick={() => setIsOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </ChatHeader>

          <MessagesContainer>
            {messages.map((message, index) => (
              <MessageBubble key={index} isUser={message.role === 'user'}>
                <Typography variant="body1">{message.content}</Typography>
              </MessageBubble>
            ))}
            {isLoading && (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </MessagesContainer>

          <InputContainer>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              size="small"
            />
            <IconButton 
              color="primary" 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <SendIcon />
            </IconButton>
          </InputContainer>
        </ChatWindow>
      )}
    </>
  );
} 