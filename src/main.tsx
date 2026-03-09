import { createRoot } from 'react-dom/client'
import './index.css'
import App from './pages/Home.tsx'
import Graphs from './pages/Graphs.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ContextProvider } from './components/context-provider.tsx'

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <ContextProvider>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/graphs" element={<Graphs />} />
            </Routes>
        </ContextProvider>
    </BrowserRouter>
)
