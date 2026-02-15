import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { SocketProvider } from './contexts/SocketContext'
import { ChatProvider } from './contexts/ChatContext'
import './index.css'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { SettingsProvider } from './contexts/SettingsContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <SettingsProvider>
            <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <WishlistProvider>
                  <ChatProvider>
                    <ThemeProvider>
                      <Toaster position="top-center" reverseOrder={false} />
                      <App />
                    </ThemeProvider>
                  </ChatProvider>
                </WishlistProvider>
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
          </SettingsProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
)

