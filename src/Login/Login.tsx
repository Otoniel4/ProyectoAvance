import { useState } from "react";
import "./Login.css";

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: number;
  rolNombre: string;
}

interface LoginProps {
  onLogin: (usuario: Usuario) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [correo, setCorreo]     = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError]       = useState<string>("");
  const [loading, setLoading]   = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const data = await res.json();

      if (data.ok) {
        onLogin(data.usuario);
      } else {
        setError(data.mensaje || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg">
      <div className="card">

        {/* Cabecera azul */}
        <div className="card__header">
          <div className="icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </div>
          <h1 className="card__title">Colegio de Marketing</h1>
          <p className="card__subtitle">Sistema de Gestión de Defensas de Tesis</p>
        </div>

        {/* Formulario */}
        <div className="card__body">
          <form className="form" onSubmit={handleSubmit}>

            <div className="form__group">
              <label className="form__label" htmlFor="correo">
                Correo electrónico
              </label>
              <input
                id="correo"
                className="form__input"
                type="email"
                placeholder="ejemplo@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form__group">
              <label className="form__label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                className="form__input"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="form__error">{error}</p>}

            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-login__spinner" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              )}
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}