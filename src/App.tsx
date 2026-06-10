import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DialLockPage from './pages/DialLockPage'
import PadlockPage from './pages/PadlockPage'
import NumberLockPage from './pages/NumberLockPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/locks/dial" element={<DialLockPage />} />
      <Route path="/locks/padlock" element={<PadlockPage />} />
      <Route path="/locks/number" element={<NumberLockPage />} />
    </Routes>
  )
}
