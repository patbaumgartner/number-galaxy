import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import HallOfFamePage from './pages/HallOfFamePage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
    return (
        <BrowserRouter basename="/math-invaders">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/hall-of-fame" element={<HallOfFamePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
