import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: validar credenciales con backend
    if (onLogin) onLogin();
  };

  return (
    <div className="page-bg">
      <div className="card">

        {/* Cabecera azul */}
        <div className="card__header">
          <div className="icon-wrap">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26" height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h1 className="card__title">Colegio de Marketing</h1>
          <p className="card__subtitle">Sistema de Gestión de Defensas de Tesis</p>
        </div>

        {/* Formulario */}
        <div className="card__body">
          <form className="form" onSubmit={handleSubmit}>

            <div className="form__group">
              <label className="form__label" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                className="form__input"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <button className="btn-login" type="submit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18" height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Iniciar sesión
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}