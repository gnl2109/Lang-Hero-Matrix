
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import ViewCompositionPage from './pages/ViewCompositionPage';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-sky-500 selection:text-white">
          <header className="py-4 bg-slate-800 shadow-md">
            <div className="container mx-auto px-4">
              <h1 className="text-2xl font-bold text-sky-400 flex items-center">
                Langrisser Hero Matrix
              </h1>
            </div>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/view/:encodedData" element={<ViewCompositionPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="py-6 mt-12 text-center text-sm text-slate-400 border-t border-slate-700">
            <p>&copy; {new Date().getFullYear()} Polaris Planner. For Langrisser Mobile fans.</p>
            <p>This is a fan-made tool and not affiliated with ZlongGames.</p>
          </footer>
        </div>
      </HashRouter>
    </AppProvider>
  );
};

export default App;