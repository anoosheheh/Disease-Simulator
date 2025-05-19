"use client"

import { useState } from "react"
import SimulationContainer from "./components/SimulationContainer"
import Header from "./components/Header"
import Footer from "./components/Footer"
import { SimulationProvider } from "./context/SimulationContext"
import WelcomePrompt from "./components/WelcomePrompt"

function App() {
  const [simulationInfo, setSimulationInfo] = useState<{
    townName: string
    diseaseName: string
  } | null>(null)

  const handleSimulationStart = (townName: string, diseaseName: string) => {
    setSimulationInfo({ townName, diseaseName })
  }

  return (
    <SimulationProvider>
      <WelcomePrompt onSimulationStart={handleSimulationStart} />
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Header townName={simulationInfo?.townName} diseaseName={simulationInfo?.diseaseName} />
        <main className="flex-1 p-4">
          <SimulationContainer />
        </main>
        <Footer />
      </div>
    </SimulationProvider>
  )
}

export default App
