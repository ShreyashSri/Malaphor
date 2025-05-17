import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography, CircularProgress, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistory = useRef<Message[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      text: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: chatHistory.current,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        role: 'model',
        text: data.response,
        timestamp: data.timestamp,
      };

      setMessages(prev => [...prev, botMessage]);
      chatHistory.current = [...chatHistory.current, userMessage, botMessage];
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
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
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '800px',
        margin: '0 auto',
        padding: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 2,
        }}
      >
        {/* Chat Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <SmartToyIcon color="primary" />
          <Typography variant="h6">Malaphor Security Assistant</Typography>
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 1,
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              {message.role === 'model' && (
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToyIcon />
                </Avatar>
              )}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1">{message.text}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </Paper>
              {message.role === 'user' && (
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <PersonIcon />
                </Avatar>
              )}
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1, alignSelf: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SmartToyIcon />
              </Avatar>
              <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about security findings, logs, or analysis..."
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chatbot; 