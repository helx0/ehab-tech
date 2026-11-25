import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

document.documentElement.style.setProperty('--glow-bg-url', `url(${import.meta.env.BASE_URL}glow-bg.svg)`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
