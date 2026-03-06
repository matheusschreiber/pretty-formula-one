import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Graphs from './Graphs.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/graphs" element={<Graphs />} />
    </Routes>
  </BrowserRouter>,
)
