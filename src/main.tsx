import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AuthLayer from './components/AuthLayer.tsx';
import { LoadingProvider } from './contexts/LoadingContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoadingProvider>
      <AuthLayer>
        <App />
      </AuthLayer>
    </LoadingProvider>
  </StrictMode>,
);
