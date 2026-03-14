import { useState } from "react";
import "./Dashboard.css";

// ── Iconos SVG inline ──────────────────────────────────────────
const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconDate = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// ── Íconos bottom nav ─────────────────────────────────────────
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconDoc = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconCheckNav = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// ── Datos de ejemplo ───────────────────────────────────────────
const DATA = {
  nuevas: [
    { id: 1, nombre: "María González Pérez", titulo: "Estrategias de Marketing Digital en Redes Sociales", fecha: "05/03/2026", hora: "10:00", lugar: "Auditorio Principal" },
    { id: 2, nombre: "Roberto Jiménez Flores", titulo: "Branding Personal en el Siglo XXI", fecha: "08/03/2026", hora: "09:00", lugar: "Aula Magna" },
  ],
  pendientes: [
    { id: 3, nombre: "Ana Torres Quispe", titulo: "Neuromarketing aplicado al consumidor boliviano", fecha: "10/03/2026", hora: "11:00", lugar: "Sala de Conferencias" },
    { id: 4, nombre: "Luis Vargas Medina", titulo: "Marketing de contenidos en PyMEs", fecha: "12/03/2026", hora: "14:00", lugar: "Auditorio B" },
  ],
  completadas: [
    { id: 5, nombre: "Carla Rojas Suárez", titulo: "Impacto del e-commerce en mercados emergentes", fecha: "01/03/2026", hora: "09:30", lugar: "Sala A" },
    { id: 6, nombre: "Marco Salinas Pérez", titulo: "Publicidad programática y Big Data", fecha: "02/03/2026", hora: "10:00", lugar: "Auditorio Principal" },
    { id: 7, nombre: "Valeria Choque Lima", titulo: "Fidelización del cliente en retail", fecha: "03/03/2026", hora: "15:00", lugar: "Sala de Conferencias" },
    { id: 8, nombre: "Diego Mamani Cruz", titulo: "Estrategia omnicanal en marcas locales", fecha: "04/03/2026", hora: "08:30", lugar: "Aula Magna" },
    { id: 9, nombre: "Sofía Aliaga Bernal", titulo: "Influencer marketing en Bolivia", fecha: "04/03/2026", hora: "11:30", lugar: "Sala B" },
  ],
};

// ── Tarjeta de defensa ─────────────────────────────────────────
function DefensaCard({ defensa }) {
  return (
    <div className="defensa-card">
      <h3 className="defensa-nombre">{defensa.nombre}</h3>
      <p className="defensa-titulo">{defensa.titulo}</p>
      <div className="defensa-meta">
        <span className="defensa-meta__item"><IconDate /> {defensa.fecha}</span>
        <span className="defensa-meta__item"><IconClock /> {defensa.hora}</span>
      </div>
      <div className="defensa-meta">
        <span className="defensa-meta__item"><IconPin /> {defensa.lugar}</span>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("nuevas");
  const [activeNav, setActiveNav] = useState("inicio");

  const tabs = ["nuevas", "pendientes", "completadas"];

  return (
    <div className="dashboard">

      {/* Top navbar */}
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__title">Colegio de Marketing</span>
          <span className="topbar__sub">Portal Delegado</span>
        </div>
      </header>

      {/* Contenido scrollable */}
      <main className="main-content">

        {/* Bienvenida */}
        <section className="welcome">
          <h1 className="welcome__title">Bienvenida/o</h1>
          <p className="welcome__name">Carlos Mendoza</p>
        </section>

        {/* Tarjetas de estadísticas */}
        <section className="stats">
          <div className="stat-card stat-card--blue">
            <div className="stat-card__icon stat-card__icon--blue"><IconBell /></div>
            <span className="stat-card__num">{DATA.nuevas.length}</span>
            <span className="stat-card__label">Nuevas</span>
          </div>
          <div className="stat-card stat-card--yellow">
            <div className="stat-card__icon stat-card__icon--yellow"><IconCalendar /></div>
            <span className="stat-card__num">{DATA.pendientes.length}</span>
            <span className="stat-card__label">Pendientes</span>
          </div>
          <div className="stat-card stat-card--green">
            <div className="stat-card__icon stat-card__icon--green"><IconCheck /></div>
            <span className="stat-card__num">{DATA.completadas.length}</span>
            <span className="stat-card__label">Completadas</span>
          </div>
        </section>

        {/* Tabs */}
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`tabs__btn ${activeTab === tab ? "tabs__btn--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Lista de defensas */}
        <section className="defensas-list">
          {DATA[activeTab].map((d) => (
            <DefensaCard key={d.id} defensa={d} />
          ))}
        </section>

      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {[
          { key: "inicio",      label: "Inicio",      Icon: IconHome },
          { key: "nuevas",      label: "Nuevas",      Icon: IconDoc },
          { key: "pendientes",  label: "Pendientes",  Icon: IconDoc },
          { key: "completadas", label: "Completadas", Icon: IconCheckNav },
          { key: "perfil",      label: "Perfil",      Icon: IconUser },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`bottom-nav__item ${activeNav === key ? "bottom-nav__item--active" : ""}`}
            onClick={() => setActiveNav(key)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}