import { ErrorBoundary, LocationProvider, Route, Router } from 'preact-iso';
import { Footer } from './components/footer';
import { Nav } from './components/nav';
import { Examples } from './routes/examples';
import { Home } from './routes/home';
import { NotFound } from './routes/not-found';

export function App() {
  return (
    <LocationProvider>
      <div class="min-h-screen flex flex-col">
        <Nav />
        <main class="flex-1">
          <ErrorBoundary>
            <Router>
              <Route path="/" component={Home} />
              <Route path="/examples" component={Examples} />
              <Route default component={NotFound} />
            </Router>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </LocationProvider>
  );
}
