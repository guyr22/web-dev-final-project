import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import FeedPage from './pages/FeedPage';

function App() {
  return (
    <BrowserRouter>
      <Container fluid className="p-0">
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<FeedPage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  )
}

export default App
