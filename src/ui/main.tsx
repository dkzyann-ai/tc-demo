import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThreeScreenApp } from './ThreeScreenApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode><ThreeScreenApp /></StrictMode>,
);
