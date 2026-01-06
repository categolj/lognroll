import { ThemeToggle } from './components/ui';
import LogViewer from './LogViewer';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-dark-700 dark:bg-dark-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <a href="/" className="flex items-center font-bold text-xl hover:opacity-80 transition-opacity">
              <span className="text-gray-900 dark:text-white">Log</span>
              <span className="text-[#00F7F5]">N</span>
              <span className="text-accent-500">'</span>
              <span className="text-gray-900 dark:text-white">Roll</span>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LogViewer />
      </main>
    </div>
  );
}

export default App;
