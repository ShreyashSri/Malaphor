import React from 'react';
import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Chatbot from './components/Chatbot';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth={false} sx={{ height: '100vh', p: 0 }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Chatbot />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 