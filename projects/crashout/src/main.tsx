import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// No StrictMode: the duel runs a single requestAnimationFrame loop and emits
// analytics; double-invoking effects in dev would double-count both.
createRoot(document.getElementById('root')!).render(<App />);
