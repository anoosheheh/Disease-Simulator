import SimulationContainer from './components/SimulationContainer';
import Header from './components/Header';
import Footer from './components/Footer';
import { SimulationProvider } from './context/SimulationContext'; // Import the provider
import WelcomePrompt from './components/WelcomePrompt';

function App() {
  return (
    <SimulationProvider> {/* Wrap the app with the provider */}
      <WelcomePrompt />
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Header />
        <main className="flex-1 p-4">
          <SimulationContainer />
        </main>
        <Footer />
      </div>
    </SimulationProvider>
  );
}

export default App;