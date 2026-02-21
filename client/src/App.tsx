import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar, Container } from 'react-bootstrap';
import FeedPage from './pages/FeedPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar bg="dark" data-bs-theme="dark" className="shadow-sm sticky-top">
        <Container>
          <Navbar.Brand href="/feed" className="fw-bold fs-4">ShlakshukGram</Navbar.Brand>
        </Container>
      </Navbar>
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<FeedPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
