import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [usuario, setUsuario] = useState(null);

  if (!usuario) {
    return <Login onLogin={(u) => setUsuario(u)} />;
  }

  return <Dashboard usuario={usuario} onLogout={() => setUsuario(null)} />;
}

export default App;