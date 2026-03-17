import { useState } from "react";
import Login from "./Login/Login";
import Dashboard from "./Dashboard/Dashboard";

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: number;
  rolNombre: string;
}

function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  if (!usuario) {
    return <Login onLogin={(u: Usuario) => setUsuario(u)} />;
  }

  return <Dashboard usuario={usuario} onLogout={() => setUsuario(null)} />;
}

export default App;