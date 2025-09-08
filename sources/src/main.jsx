import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import './index.css'
import App from './App.tsx'
import { TokenStoreProvider } from './store/TokenStore.tsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HeroUIProvider>
      <TokenStoreProvider>
        <App />
      </TokenStoreProvider>
    </HeroUIProvider>
  </StrictMode>,
)
