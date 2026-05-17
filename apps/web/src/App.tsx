import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import AuthPage from './pages/AuthPage';
import SnippetListPage from './pages/SnippetListPage';
import SnippetDetailPage from './pages/SnippetDetailPage';
import SnippetEditorPage from './pages/SnippetEditorPage';
import ProtectedRoute from './components/ProtectedRoute';
import CommandPalette from './components/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#0A0A0A',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '12px',
              },
            }}
          />
          <CommandPalette />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<SnippetListPage />} />
              <Route path="/snippets/new" element={<SnippetEditorPage />} />
              <Route path="/snippets/:id" element={<SnippetDetailPage />} />
              <Route path="/snippets/:id/edit" element={<SnippetEditorPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
