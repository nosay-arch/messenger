import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/main.scss';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  console.log("Root Rendering")
  root.render(<App />);
}
