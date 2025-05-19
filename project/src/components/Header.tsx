import type React from "react"

interface HeaderProps {
  townName?: string
  diseaseName?: string
}

const Header: React.FC<HeaderProps> = ({ townName, diseaseName }) => {
  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src="/resources/mojojojo.png"
            alt="Mojo Jojo"
            width={28}
            height={28}
            className="rounded-full"
          />
          <h1 className="text-xl font-bold">Mojo Jojo Simulation</h1>
        </div>
        <div className="flex flex-col items-end">
          {townName && diseaseName ? (
            <>
              <span className="text-xl font-semibold text-green-400">{townName}</span>
              <span className="text-base text-red-400">Fighting {diseaseName}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Visualizing infectious diseases in social networks</span>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
