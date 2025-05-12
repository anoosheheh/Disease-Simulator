# Disease Spread Simulation in Social Networks

A web application that simulates the spread of infectious diseases through social networks. This project combines React for the frontend with Flask for the backend to create an interactive visualization of how diseases spread through populations.

## Features

- Interactive graph visualization using D3.js
- Customizable disease parameters (transmission rate, recovery rate, mortality)
- Medicine/intervention system
- Different node states (healthy, infected, recovered, deceased)
- Statistics tracking
- Custom graph import functionality
- Random graph generation

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, D3.js
- **Backend**: Flask, NetworkX
- **Data Visualization**: D3.js Force Simulation

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- pip

### Installation

1. Clone the repository

2. Install frontend dependencies
   ```
   npm install
   ```

3. Install backend dependencies
   ```
   cd backend
   pip install -r requirements.txt
   ```

### Running the Application

1. Start both frontend and backend (from the project root)
   ```
   npm run start
   ```

2. Open http://localhost:5173 in your browser

## Usage

1. The application starts with a randomly generated social network
2. Use the control panel to:
   - Start/pause the simulation
   - Step through the simulation day by day
   - Adjust disease parameters
   - Enable/disable medicine interventions
3. Upload your own graph (JSON format) or generate a new random graph
4. Watch the disease spread through the network and analyze the statistics

## Graph JSON Format

Custom graph uploads should follow this format:

```json
{
  "nodes": [
    {
      "id": "1",
      "age": 45,
      "status": "healthy"
    },
    ...
  ],
  "links": [
    {
      "source": "1",
      "target": "2",
      "weight": 0.7
    },
    ...
  ]
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.