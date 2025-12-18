import ChatInterface from './components/ChatInterface'
import './styles/main.css'

function App() {
    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-left">
                    <h1>High-Fidelity Persona Extraction</h1>
                    <p className="subtitle">Active Interview Module</p>
                </div>
            </header>
            <main>
                <ChatInterface />
            </main>
        </div>
    )
}

export default App
