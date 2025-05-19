"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSimulationContext } from "../context/SimulationContext"

interface WelcomePromptProps {
  onSimulationStart?: (townName: string, diseaseName: string) => void
}

const VictoryMessage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    // Play victory sound when component mounts
    const victorySound = new Audio("/resources/victory.mp3")
    victorySound.volume = 0.5
    victorySound.play().catch((err) => console.error("Error playing victory sound:", err))

    return () => {
      // Cleanup: stop the sound if component unmounts
      victorySound.pause()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-700 text-center">
        <h2 className="text-3xl font-bold mb-4 text-green-400">Victory!</h2>
        <p className="text-xl text-white mb-6">
          The disease has been defeated! Your town is now safe and sound... until the next outbreak!
        </p>
        <p className="text-lg text-gray-300 mb-8">"Power Puff Girls saved the day!"</p>
        <button
          onClick={onClose}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}

const WelcomePrompt: React.FC<WelcomePromptProps> = ({ onSimulationStart }) => {
  const [showPrompt, setShowPrompt] = useState(true)
  const [showVictory, setShowVictory] = useState(false)
  const [townName, setTownName] = useState("")
  const [diseaseName, setDiseaseName] = useState("")
  const { simulationState } = useSimulationContext()
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Show victory message when simulation is finished
    if (simulationState.isFinished && !showVictory) {
      // Stop background audio when victory is achieved
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause()
        backgroundAudioRef.current = null
      }
      setShowVictory(true)
    }
  }, [simulationState.isFinished, showVictory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (townName.trim() && diseaseName.trim()) {
      // Create and play audio
      const audio = new Audio("/resources/background.mp3")
      audio.loop = true
      audio.volume = 0.3
      audio.play().catch((err) => console.error("Error playing audio:", err))
      backgroundAudioRef.current = audio

      // Call the callback with town and disease names
      if (onSimulationStart) {
        onSimulationStart(townName, diseaseName)
      }

      setShowPrompt(false)
    }
  }

  if (showVictory) {
    return <VictoryMessage onClose={() => setShowVictory(false)} />
  }

  if (!showPrompt) {
    return null // No longer need to show the title here as it will be in the Header
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white">Welcome to Disease Simulation</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="townName">
              Town Name
            </label>
            <input
              id="townName"
              type="text"
              value={townName}
              onChange={(e) => setTownName(e.target.value)}
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:border-blue-500"
              required
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="diseaseName">
              Disease Name
            </label>
            <input
              id="diseaseName"
              type="text"
              value={diseaseName}
              onChange={(e) => setDiseaseName(e.target.value)}
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
            disabled={!townName.trim() || !diseaseName.trim()}
          >
            Start Simulation
          </button>
        </form>
      </div>
    </div>
  )
}

export default WelcomePrompt
