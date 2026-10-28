import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { WishlistProvider } from './hooks/useWishlist';
import { ChatProvider } from './hooks/useChat';
import './styles/style.css';
import './styles/app.css';
import './styles/chat.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WishlistProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </WishlistProvider>
    </BrowserRouter>
  </StrictMode>,
);
