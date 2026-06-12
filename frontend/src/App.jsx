import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import ModelMetrics from './pages/ModelMetrics';
import './index.css';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-primary">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/model" element={<ModelMetrics />} />
                    <Route path="/report" element={<Report />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
