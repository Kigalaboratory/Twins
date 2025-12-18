import ChatInterface from './components/ChatInterface'

function App() {
    return (
        <div className="app-container">
            <header className="app-header">
                <h1>High-Fidelity Persona Extraction</h1>
                <p className="subtitle">Active Interview Module</p>
            </header>
            <main>
                <ChatInterface />
            </main>
        </div>
    )
}

export default App
