import './App.css'
import { BrowserRouter } from 'react-router-dom'
import RoutesIndex from './routes/index'
import { MyProvider } from './context/ContextProvider'

function App() {

  return (
    <div>
      <MyProvider>
      <BrowserRouter>
      
            <RoutesIndex />

      </BrowserRouter>
      </MyProvider>
      

    </div>
  )
}

export default App
