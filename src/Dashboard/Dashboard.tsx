import { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import mammoth from "mammoth";
const API = `http://${window.location.hostname}:5000/api`;

// ════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════
interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: number;
  rolNombre: string;
}

interface Defensa {
  idDefensa: number;
  idAsignacion: number;
  fecha: string;
  lugar: string;
  estado: string;
  estadoAsignacion: string;
  estadoPago?: string;
  titulo: string;
  nombreEstudiante: string;
  apellidoEstudiante: string;
  nombreDelegado?: string;
  apellidoDelegado?: string;
  direccion?: string;
  enlaceGoogleMaps?: string;
  observaciones?: string;
}

interface Delegado {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  activo: number;
  defensasAsignadas?: number;
}

interface Pago {
  idPago: number;
  idDefensa: number;
  monto: number;
  estado: string;
  fechaPago: string | null;
  nombreEstudiante: string;
  apellidoEstudiante: string;
  nombreDelegado?: string;
  apellidoDelegado?: string;
  fecha: string;
}

interface DashboardProps {
  usuario: Usuario;
  onLogout: () => void;
}

// ════════════════════════════════════════════════════════
// ICONOS
// ════════════════════════════════════════════════════════
const Ico = ({ d, size = 22 }: { d: React.ReactNode; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const icons: Record<string, React.ReactNode> = {
  home:      <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  doc:       <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  check:     <polyline points="20 6 9 17 4 12"/>,
  user:      <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  bell:      <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  calendar:  <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  checkCirc: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  back:      <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  upload:    <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  lock:      <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  mail:      <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  phone:     <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
  pin:       <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
  close:     <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  eye:       <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  edit:      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>,
  dollar:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  filter:    <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  userPlus:  <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>,
};

// ════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════
const fFecha = (f: string) => f ? new Date(f).toLocaleDateString("es-BO", { weekday:"long", day:"numeric", month:"long", year:"numeric" }) : "-";
const fFechaCorta = (f: string) => f ? new Date(f).toLocaleDateString("es-BO", { day:"2-digit", month:"2-digit", year:"numeric" }) : "-";
const fHora = (f: string) => f ? new Date(f).toLocaleTimeString("es-BO", { hour:"2-digit", minute:"2-digit" }) : "-";

function BadgeEstado({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    pendiente:  "badge--pendiente",
    aceptada:   "badge--aceptada",
    rechazada:  "badge--rechazada",
    completada: "badge--completada",
    completado: "badge--completada",
    convocada:  "badge--convocada",
    "sin asignar": "badge--sin-asignar",
  };
  const labels: Record<string, string> = {
    pendiente:  "Pendiente",
    aceptada:   "Aceptada",
    rechazada:  "Rechazada",
    completada: "Completada",
    completado: "Completada",
    convocada:  "Convocada",
    "sin asignar": "Sin asignar",
  };
  const cls = map[estado?.toLowerCase()] || "badge--pendiente";
  return <span className={`badge ${cls}`}>{labels[estado?.toLowerCase()] || estado}</span>;
}

// ════════════════════════════════════════════════════════
// COMPONENTES COMPARTIDOS
// ════════════════════════════════════════════════════════
function Spinner() {
  return <div className="loading"><div className="loading__spinner"/><p>Cargando...</p></div>;
}
function Vacio({ texto }: { texto: string }) {
  return <div className="empty">{texto}</div>;
}

function Modal({ title, subtitle, onClose, children, wide }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${wide ? "modal--wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <h3 className="modal__title">{title}</h3>
            {subtitle && <p className="modal__sub">{subtitle}</p>}
          </div>
          <button className="modal__close" onClick={onClose}><Ico d={icons.close} size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Topbar({ usuario, onBack }: { usuario: Usuario; onBack?: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        {onBack && (
          <button className="topbar__back" onClick={onBack}>
            <Ico d={icons.back} size={20}/>
          </button>
        )}
        <div>
          <span className="topbar__title">Colegio de Marketing</span>
          <span className="topbar__sub">Portal {usuario.rolNombre}</span>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ active, onChange }: { active: string; onChange: (key: string) => void }) {
  const items = [
    { key:"inicio",      label:"Inicio",      d: icons.home },
    { key:"nuevas",      label:"Nuevas",      d: icons.doc },
    { key:"pendientes",  label:"Pendientes",  d: icons.doc },
    { key:"completadas", label:"Completadas", d: icons.check },
    { key:"perfil",      label:"Perfil",      d: icons.user },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(({ key, label, d }) => (
        <button key={key}
          className={`bottom-nav__item ${active === key ? "bottom-nav__item--active" : ""}`}
          onClick={() => onChange(key)}>
          <Ico d={d} size={22}/><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ════════════════════════════════════════════════════════
// VISTAS DELEGADO
// ════════════════════════════════════════════════════════
function VistaInicio({ usuario, defensas, loading, onNav }: {
  usuario: Usuario; defensas: Defensa[]; loading: boolean; onNav: (k: string) => void;
}) {
  const counts = {
    nuevas:      defensas.filter(d => d.estadoAsignacion === "pendiente").length,
    pendientes:  defensas.filter(d => d.estadoAsignacion === "aceptada").length,
    completadas: defensas.filter(d => d.estadoAsignacion === "completada").length,
  };
  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <section className="welcome">
          <h1 className="welcome__title">Bienvenida/o</h1>
          <p className="welcome__name">{usuario.nombre} {usuario.apellido}</p>
          <span className="welcome__rol">{usuario.rolNombre}</span>
        </section>
        <section className="stats">
          {([
            { key:"nuevas",      label:"Nuevas",      ico:icons.bell,      cls:"blue"   },
            { key:"pendientes",  label:"Pendientes",  ico:icons.calendar,  cls:"yellow" },
            { key:"completadas", label:"Completadas", ico:icons.checkCirc, cls:"green"  },
          ] as const).map(({ key, label, ico, cls }) => (
            <button key={key} className="stat-card" onClick={() => onNav(key)}>
              <div className={`stat-card__icon stat-card__icon--${cls}`}><Ico d={ico} size={24}/></div>
              <span className="stat-card__num">{loading ? "…" : counts[key]}</span>
              <span className="stat-card__label">{label}</span>
            </button>
          ))}
        </section>
      </main>
    </>
  );
}

function VistaNuevas({ usuario, defensas, loading, onDetalle }: {
  usuario: Usuario; defensas: Defensa[]; loading: boolean; onDetalle: (d: Defensa) => void;
}) {
  const lista = defensas.filter(d => d.estadoAsignacion === "pendiente");
  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">Nuevas Convocatorias</h2>
          <p className="page-sub">Revisa y acepta las invitaciones</p>
        </div>
        {loading ? <Spinner/> : lista.length === 0 ? <Vacio texto="No hay nuevas convocatorias"/> :
          lista.map(d => (
            <div key={d.idDefensa} className="inv-card">
              <div className="inv-card__head">
                <div>
                  <h3 className="inv-card__nombre">{d.nombreEstudiante} {d.apellidoEstudiante}</h3>
                  <p className="inv-card__titulo">{d.titulo}</p>
                </div>
                <span className="badge badge--nueva">Nueva</span>
              </div>
              <div className="inv-card__meta">
                <p><Ico d={icons.calendar} size={14}/> <strong>Fecha:</strong> {fFecha(d.fecha)}</p>
                <p><Ico d={icons.bell} size={14}/> <strong>Hora:</strong> {fHora(d.fecha)}</p>
                <p><Ico d={icons.pin} size={14}/> <strong>Lugar:</strong> {d.lugar || "Sin lugar"}</p>
              </div>
              <button className="btn-primary" onClick={() => onDetalle(d)}>Ver detalle</button>
            </div>
          ))
        }
      </main>
    </>
  );
}

function VistaDetalle({ usuario, defensa, onBack, onAceptar, onRechazar }: {
  usuario: Usuario; defensa: Defensa;
  onBack: () => void;
  onAceptar: (id: number) => Promise<void>;
  onRechazar: (id: number, j: string) => Promise<void>;
}) {
  const [modalRechazo, setModalRechazo] = useState(false);
  const [justificacion, setJustificacion] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <button className="btn-back" onClick={onBack}><Ico d={icons.back} size={16}/> Volver</button>
        <h2 className="page-title" style={{ marginBottom: 24 }}>Detalle de Convocatoria</h2>
        <div className="detail-section">
          <h4 className="detail-section__title">Información del Estudiante</h4>
          <div className="detail-field"><span className="detail-field__label">Nombre completo</span><span className="detail-field__value">{defensa.nombreEstudiante} {defensa.apellidoEstudiante}</span></div>
          <div className="detail-field"><span className="detail-field__label">Título de tesis</span><span className="detail-field__value">{defensa.titulo}</span></div>
        </div>
        <div className="detail-section">
          <h4 className="detail-section__title">Fecha y Hora</h4>
          <div className="detail-field"><span className="detail-field__label">Fecha</span><span className="detail-field__value">{fFecha(defensa.fecha)}</span></div>
          <div className="detail-field"><span className="detail-field__label">Hora</span><span className="detail-field__value">{fHora(defensa.fecha)}</span></div>
        </div>
        <div className="detail-section">
          <h4 className="detail-section__title">Ubicación</h4>
          <div className="detail-field"><span className="detail-field__label">Lugar</span><span className="detail-field__value">{defensa.lugar || "Sin lugar"}</span></div>
          {defensa.direccion && <div className="detail-field"><span className="detail-field__label">Dirección</span><span className="detail-field__value">{defensa.direccion}</span></div>}
          {defensa.enlaceGoogleMaps && (
            <div className="detail-field">
              <span className="detail-field__label">Google Maps</span>
              <a className="detail-field__value" href={defensa.enlaceGoogleMaps} target="_blank" rel="noreferrer" style={{color:"var(--navy)"}}>Ver ubicación →</a>
            </div>
          )}
        </div>
        {defensa.observaciones && (
          <div className="detail-section">
            <h4 className="detail-section__title">Observaciones</h4>
            <p style={{fontSize:".9rem",color:"#4a5568",lineHeight:1.6}}>{defensa.observaciones}</p>
          </div>
        )}
        <div className="detail-actions">
          <button className="btn-primary" disabled={loading} onClick={async () => { setLoading(true); await onAceptar(defensa.idAsignacion); setLoading(false); }}>
            <Ico d={icons.check} size={16}/> Aceptar convocatoria
          </button>
          <button className="btn-danger" disabled={loading} onClick={() => setModalRechazo(true)}>
            <Ico d={icons.close} size={16}/> Rechazar
          </button>
        </div>
      </main>
      {modalRechazo && (
        <Modal title="Rechazar Convocatoria" subtitle="Proporciona un justificativo." onClose={() => setModalRechazo(false)}>
          <div className="modal__body">
            <label className="form__label">Justificativo *</label>
            <textarea className="form__textarea" placeholder="Ej. Conflicto de horario..."
              value={justificacion} onChange={e => setJustificacion(e.target.value)}/>
          </div>
          <div className="modal__footer">
            <button className="btn-outline" onClick={() => setModalRechazo(false)}>Cancelar</button>
            <button className="btn-danger" disabled={justificacion.trim().length < 10} onClick={async () => {
              setLoading(true); await onRechazar(defensa.idAsignacion, justificacion); setLoading(false); setModalRechazo(false);
            }}>Confirmar rechazo</button>
            {justificacion.trim().length > 0 && justificacion.trim().length < 10 && (
              <p className="form__error" style={{marginTop:6}}>Mínimo 10 caracteres ({justificacion.trim().length}/10)</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

function VistaPendientes({ usuario, defensas, loading, onEvidencia }: {
  usuario: Usuario; defensas: Defensa[]; loading: boolean; onEvidencia: (d: Defensa) => void;
}) {
  const lista = defensas.filter(d => d.estadoAsignacion === "aceptada");
  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">Defensas Pendientes</h2>
          <p className="page-sub">Defensas aceptadas por completar</p>
        </div>
        {loading ? <Spinner/> : lista.length === 0 ? <Vacio texto="No hay defensas pendientes"/> :
          lista.map(d => (
            <div key={d.idDefensa} className="inv-card">
              <h3 className="inv-card__nombre">{d.nombreEstudiante} {d.apellidoEstudiante}</h3>
              <p className="inv-card__titulo">{d.titulo}</p>
              <div className="inv-card__meta">
                <p><strong>Fecha:</strong> {fFechaCorta(d.fecha)}</p>
                <p><strong>Hora:</strong> {fHora(d.fecha)}</p>
                <p><strong>Lugar:</strong> {d.lugar || "Sin lugar"}</p>
              </div>
              <button className="btn-primary" onClick={() => onEvidencia(d)}>
                <Ico d={icons.upload} size={16}/> Completar defensa
              </button>
            </div>
          ))
        }
      </main>
    </>
  );
}

function VistaEvidencia({ usuario, defensa, onBack, onEnviar }: {
  usuario: Usuario; defensa: Defensa; onBack: () => void; onEnviar: (p: any) => Promise<void>;
}) {
  const [imagen, setImagen]      = useState<File | null>(null);
  const [pdf, setPdf]            = useState<File | null>(null);
  const [comentarios, setComent] = useState("");
  const [loading, setLoading]    = useState(false);
  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <button className="btn-back" onClick={onBack}><Ico d={icons.back} size={16}/> Volver</button>
        <h2 className="page-title">Subir Evidencia</h2>
        <p className="page-sub" style={{ marginBottom: 20 }}>{defensa.nombreEstudiante} {defensa.apellidoEstudiante}</p>
        <div className="detail-section">
          <h4 className="detail-section__title">Información de la Defensa</h4>
          <p className="ev-info"><strong>Título:</strong> {defensa.titulo}</p>
          <p className="ev-info"><strong>Fecha:</strong> {fFechaCorta(defensa.fecha)}</p>
          <p className="ev-info"><strong>Hora:</strong> {fHora(defensa.fecha)}</p>
          <p className="ev-info"><strong>Lugar:</strong> {defensa.lugar}</p>
        </div>
        <div className="detail-section">
          <h4 className="detail-section__title">Subir Imagen de Asistencia</h4>
          <input type="file" accept="image/*" className="file-input" onChange={e => setImagen(e.target.files?.[0] ?? null)}/>
          <p className="file-hint">Fotografía del acta de defensa</p>
        </div>
        <div className="detail-section">
          <h4 className="detail-section__title">Subir Archivo PDF del Informe</h4>
          <input type="file" accept=".pdf" className="file-input" onChange={e => setPdf(e.target.files?.[0] ?? null)}/>
          <p className="file-hint">Informe de la defensa en formato PDF</p>
        </div>
        <div className="detail-section">
          <h4 className="detail-section__title">Comentarios</h4>
          <textarea className="form__textarea" placeholder="Observaciones adicionales..."
            value={comentarios} onChange={e => setComent(e.target.value)}/>
        </div>
        <button className="btn-primary btn-primary--full" disabled={loading} onClick={async () => {
          setLoading(true); await onEnviar({ defensa, imagen, pdf, comentarios }); setLoading(false);
        }}>
          {loading ? <span className="btn-spinner"/> : <Ico d={icons.upload} size={16}/>}
          {loading ? " Enviando..." : " Enviar evidencia"}
        </button>
      </main>
    </>
  );
}

function VistaCompletadas({ usuario, defensas, loading }: { usuario: Usuario; defensas: Defensa[]; loading: boolean }) {
  const lista = defensas.filter(d => d.estadoAsignacion === "completada");
  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">Defensas Completadas</h2>
          <p className="page-sub">Historial de defensas realizadas</p>
        </div>
        {loading ? <Spinner/> :
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Estudiante</th><th>Perfil de tesis</th><th>Fecha</th><th>Estado</th></tr></thead>
              <tbody>
                {lista.length === 0
                  ? <tr><td colSpan={4} style={{ textAlign:"center", color:"#9aa5b4", padding:"32px" }}>Sin registros</td></tr>
                  : lista.map(d => (
                    <tr key={d.idDefensa}>
                      <td className="td-bold">{d.nombreEstudiante} {d.apellidoEstudiante}</td>
                      <td className="td-truncate">{d.titulo}</td>
                      <td>{fFechaCorta(d.fecha)}</td>
                      <td><span className={`badge ${d.estadoPago === "pagado" ? "badge--pagado" : "badge--pend-pago"}`}>{d.estadoPago === "pagado" ? "Pago realizado" : "Pendiente"}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        }
      </main>
    </>
  );
}

function VistaPerfil({ usuario, onLogout }: { usuario: Usuario; onLogout: () => void }) {
  const [modalPass, setModalPass] = useState(false);
  const [notifs, setNotifs]       = useState(true);
  const [passForm, setPassForm]   = useState({ actual:"", nueva:"", confirmar:"" });
  const [passMsg, setPassMsg]     = useState("");

  useEffect(() => {
    fetch(`${API}/usuario/${usuario.id}/notificaciones`)
      .then(r => r.json())
      .then(d => { if (d.ok) setNotifs(!!d.notificaciones); })
      .catch(() => {});
  }, [usuario.id]);

  const toggleNotifs = async () => {
    const nuevo = !notifs;
    setNotifs(nuevo);
    await fetch(`${API}/usuario/${usuario.id}/notificaciones`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificaciones: nuevo }),
    }).catch(() => {});
  };

  const handleChangePass = async () => {
    if (!passForm.actual) { setPassMsg("Ingresa tu contraseña actual"); return; }
    if (passForm.nueva.length < 6) { setPassMsg("La nueva contraseña debe tener al menos 6 caracteres"); return; }
    if (passForm.nueva === passForm.actual) { setPassMsg("La nueva contraseña debe ser diferente a la actual"); return; }
    if (passForm.nueva !== passForm.confirmar) { setPassMsg("Las contraseñas no coinciden"); return; }
    const res = await fetch(`${API}/usuario/${usuario.id}/password`, {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ actual: passForm.actual, nueva: passForm.nueva }),
    });
    const data = await res.json();
    if (data.ok) {
      setPassMsg("Contraseña actualizada ✓");
      setTimeout(() => { setModalPass(false); setPassMsg(""); setPassForm({ actual:"", nueva:"", confirmar:"" }); }, 1500);
    } else { setPassMsg(data.mensaje || "Error"); }
  };

  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <div className="page-header"><h2 className="page-title">Mi Perfil</h2><p className="page-sub">Gestiona tu información personal</p></div>
        <div className="profile-avatar-row">
          <div className="profile-avatar"><Ico d={icons.user} size={32}/></div>
          <div><p className="profile-nombre">{usuario.nombre} {usuario.apellido}</p><p className="profile-rol">{usuario.rolNombre}</p></div>
        </div>
        <div className="detail-section">
          <h4 className="detail-section__title">Información Personal</h4>
          <div className="profile-field"><span className="detail-field__label">Nombre completo</span><span className="detail-field__value">{usuario.nombre} {usuario.apellido}</span></div>
          <div className="profile-field"><span className="detail-field__label">Correo electrónico</span><span className="detail-field__value">{usuario.correo}</span></div>
          <div className="profile-field"><span className="detail-field__label">Teléfono</span><span className="detail-field__value">{usuario.telefono || "No registrado"}</span></div>
        </div>
        <div className="detail-section">
          <h4 className="detail-section__title">Seguridad</h4>
          <button className="btn-outline btn-outline--full" onClick={() => setModalPass(true)}><Ico d={icons.lock} size={16}/> Cambiar contraseña</button>
        </div>
        <div className="detail-section">
          <h4 className="detail-section__title">Notificaciones</h4>
          <div className="toggle-row">
            <div><p className="toggle-label">Activar notificaciones</p><p className="toggle-sub">Recibir alertas de nuevas convocatorias</p></div>
            <button className={`toggle ${notifs ? "toggle--on" : ""}`} onClick={toggleNotifs}><span className="toggle__knob"/></button>
          </div>
        </div>
        <button className="btn-logout-full" onClick={onLogout}><Ico d={icons.logout} size={18}/> Cerrar sesión</button>
      </main>
      {modalPass && (
        <Modal title="Cambiar Contraseña" subtitle="Ingresa tu contraseña actual y la nueva." onClose={() => setModalPass(false)}>
          <div className="modal__body">
            {(["actual","nueva","confirmar"] as const).map(k => (
              <div key={k} className="form__group" style={{ marginBottom:14 }}>
                <label className="form__label">{k==="actual"?"Contraseña actual":k==="nueva"?"Nueva contraseña":"Confirmar nueva contraseña"}</label>
                <input type="password" className="form__input" value={passForm[k]} onChange={e => setPassForm({...passForm,[k]:e.target.value})}/>
              </div>
            ))}
            {passMsg && <p className={passMsg.includes("✓") ? "form__msg--ok" : "form__error"}>{passMsg}</p>}
          </div>
          <div className="modal__footer">
            <button className="btn-outline" onClick={() => setModalPass(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleChangePass}>Cambiar contraseña</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════
// VISTAS ADMIN
// ════════════════════════════════════════════════════════
function VistaAdminDashboard({ defensas, onNav }: { defensas: Defensa[]; onNav: (k: string) => void }) {
  const hoy = new Date();
  const defensasHoy   = defensas.filter(x => { const fx = new Date(x.fecha); return fx.toDateString() === hoy.toDateString(); }).length;
  const sinAsignar    = defensas.filter(x => !x.nombreDelegado).length;
  const completadas   = defensas.filter(x => x.estado === "completada").length;
  const proximas      = [...defensas].sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).slice(0,5);

  const cards = [
    { label:"Defensas hoy",           value: defensasHoy,       tone:"blue",   ico: icons.calendar },
    { label:"Defensas sin asignar",   value: sinAsignar,        tone:"orange", ico: icons.bell },
    { label:"Convocatorias enviadas", value: defensas.length,   tone:"purple", ico: icons.doc },
    { label:"Defensas completadas",   value: completadas,       tone:"green",  ico: icons.checkCirc },
    { label:"Pagos pendientes",       value: defensas.filter(x => x.estadoPago === "pendiente").length, tone:"yellow", ico: icons.dollar },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div><h2 className="admin-page-title">Dashboard</h2><p className="admin-page-sub">Resumen general del sistema de defensas de tesis</p></div>
      </div>
      <div className="admin-cards">
        {cards.map(c => (
          <div key={c.label} className="admin-card">
            <div className="admin-card__top">
              <span className="admin-card__label">{c.label}</span>
              <div className={`admin-card__ico admin-card__ico--${c.tone}`}><Ico d={c.ico} size={16}/></div>
            </div>
            <div className="admin-card__value">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="admin-panel">
        <div className="admin-panel__head">
          <div><h3 className="page-title">Próximas defensas</h3><p className="page-sub">Defensas programadas para los próximos días</p></div>
          <button className="btn-outline" onClick={() => onNav("admin_defensas")}>Ver todas</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Estudiante</th><th>Título de tesis</th><th>Fecha</th><th>Hora</th><th>Lugar</th><th>Delegado asignado</th><th>Estado</th></tr></thead>
            <tbody>
              {proximas.length === 0
                ? <tr><td colSpan={7} style={{textAlign:"center",color:"#9aa5b4",padding:"32px"}}>Sin registros</td></tr>
                : proximas.map(x => (
                  <tr key={x.idDefensa}>
                    <td className="td-bold">{x.nombreEstudiante} {x.apellidoEstudiante}</td>
                    <td className="td-truncate">{x.titulo}</td>
                    <td>{fFechaCorta(x.fecha)}</td>
                    <td>{fHora(x.fecha)}</td>
                    <td className="td-truncate">{x.lugar || "-"}</td>
                    <td>{x.nombreDelegado ? `${x.nombreDelegado} ${x.apellidoDelegado}` : <span style={{color:"#9aa5b4"}}>—</span>}</td>
                    <td><BadgeEstado estado={x.estadoAsignacion || x.estado}/></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function VistaAdminDefensas({ defensas, loading, delegados, onIrCrear, onRecargar }: {
  defensas: Defensa[]; loading: boolean; delegados: Delegado[];
  onIrCrear: () => void; onRecargar: () => void;
}) {
  const [busqueda, setBusqueda]       = useState("");
  const [filtroDelegado, setFiltro]   = useState("");
  const [modalAsignar, setModalAsignar] = useState<Defensa | null>(null);
  const [modalVer, setModalVer]         = useState<Defensa | null>(null);
  const [busqDelegado, setBusqDelegado] = useState("");
  const [delegadoSel, setDelegadoSel]   = useState<Delegado | null>(null);
  const [msgAsignar, setMsgAsignar]     = useState("");

  const filtradas = defensas.filter(d => {
    const nombre = `${d.nombreEstudiante} ${d.apellidoEstudiante}`.toLowerCase();
    const matchBusq = !busqueda || nombre.includes(busqueda.toLowerCase());
    const matchDel = !filtroDelegado || `${d.nombreDelegado} ${d.apellidoDelegado}`.includes(filtroDelegado);
    return matchBusq && matchDel;
  });

  const delegadosFiltrados = delegados.filter(d =>
    `${d.nombre} ${d.apellido}`.toLowerCase().includes(busqDelegado.toLowerCase())
  );

  const handleAsignar = async () => {
    if (!delegadoSel || !modalAsignar) return;
    setMsgAsignar("");
    try {
      const res = await fetch(`${API}/defensas/${modalAsignar.idDefensa}/asignar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idDelegado: delegadoSel.idUsuario }),
      });
      const data = await res.json();
      if (data.ok) { setModalAsignar(null); setDelegadoSel(null); setBusqDelegado(""); onRecargar(); }
      else setMsgAsignar(data.error || "Error al asignar");
    } catch { setMsgAsignar("Sin conexión"); }
  };

  const handleEliminar = async (idDefensa: number) => {
    if (!window.confirm("¿Eliminar esta defensa?")) return;
    await fetch(`${API}/defensas/${idDefensa}`, { method: "DELETE" });
    onRecargar();
  };

  return (
    <>
      <div className="admin-page-head">
        <div><h2 className="admin-page-title">Gestión de Defensas</h2><p className="admin-page-sub">Administra todas las defensas de tesis</p></div>
        <button className="btn-primary" onClick={onIrCrear}><Ico d={icons.plus} size={16}/> Nueva Defensa</button>
      </div>

      {/* Filtros */}
      <div className="admin-panel" style={{marginBottom:16}}>
        <div className="filtros-row">
          <Ico d={icons.filter} size={16}/>
          <span style={{fontWeight:600,fontSize:".9rem"}}>Filtros</span>
        </div>
        <div className="filtros-inputs">
          <div className="search-wrap">
            <Ico d={icons.search} size={15}/>
            <input className="form__input search-input" placeholder="Buscar por estudiante..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}/>
          </div>
          <select className="form__input" value={filtroDelegado} onChange={e => setFiltro(e.target.value)} style={{maxWidth:200}}>
            <option value="">Todos los delegados</option>
            {delegados.map(d => <option key={d.idUsuario} value={`${d.nombre} ${d.apellido}`}>{d.nombre} {d.apellido}</option>)}
          </select>
          <button className="btn-outline" onClick={() => { setBusqueda(""); setFiltro(""); }}>Limpiar filtros</button>
        </div>
        <p className="filtros-count">Mostrando {filtradas.length} de {defensas.length} defensas</p>
      </div>

      <div className="admin-panel">
        {loading ? <Spinner/> :
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Estudiante</th><th>Perfil de tesis</th><th>Fecha</th><th>Hora</th>
                  <th>Lugar</th><th>Delegado</th><th>Estado</th><th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0
                  ? <tr><td colSpan={8} style={{textAlign:"center",color:"#9aa5b4",padding:"32px"}}>Sin defensas</td></tr>
                  : filtradas.map(d => (
                    <tr key={d.idDefensa}>
                      <td className="td-bold">{d.nombreEstudiante} {d.apellidoEstudiante}</td>
                      <td className="td-truncate">{d.titulo}</td>
                      <td>{fFechaCorta(d.fecha)}</td>
                      <td>{fHora(d.fecha)}</td>
                      <td className="td-truncate">{d.lugar || "-"}</td>
                      <td>{d.nombreDelegado ? `${d.nombreDelegado} ${d.apellidoDelegado}` : <span style={{color:"#9aa5b4"}}>—</span>}</td>
                      <td><BadgeEstado estado={d.estadoAsignacion || d.estado}/></td>
                      <td>
                        <div className="acciones-row">
                          <button className="btn-primary btn-sm" onClick={() => { setModalAsignar(d); setBusqDelegado(""); setDelegadoSel(null); }}>Asignar</button>
                          <button className="btn-danger btn-sm" onClick={() => handleEliminar(d.idDefensa)}>Eliminar</button>
                          <button className="btn-icon" title="Ver" onClick={() => setModalVer(d)}><Ico d={icons.eye} size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      {modalVer && (
        <Modal title="Detalle de Defensa" subtitle={modalVer.titulo} onClose={() => setModalVer(null)} wide>
          <div className="modal__body">
            {[
              ["Estudiante",  `${modalVer.nombreEstudiante} ${modalVer.apellidoEstudiante}`],
              ["Título",      modalVer.titulo],
              ["Fecha",       fFecha(modalVer.fecha)],
              ["Hora",        fHora(modalVer.fecha)],
              ["Lugar",       modalVer.lugar || "—"],
              ["Delegado",    modalVer.nombreDelegado ? `${modalVer.nombreDelegado} ${modalVer.apellidoDelegado}` : "Sin asignar"],
              ["Estado",      modalVer.estadoAsignacion || modalVer.estado],
              ["Pago",        modalVer.estadoPago === "pagado" ? "Pagado" : "Pendiente"],
            ].map(([label, val]) => (
              <div key={label} className="detail-field" style={{marginBottom:10}}>
                <span className="detail-field__label">{label}</span>
                <span className="detail-field__value">{val}</span>
              </div>
            ))}
          </div>
          <div className="modal__footer">
            <button className="btn-outline" onClick={() => setModalVer(null)}>Cerrar</button>
          </div>
        </Modal>
      )}

      {modalAsignar && (
        <Modal title="Asignar delegada/o" subtitle="Asignar a una defensa" onClose={() => setModalAsignar(null)}>
          <div className="modal__body">
            <label className="form__label">Nombre</label>
            <div className="search-wrap" style={{marginBottom:12}}>
              <Ico d={icons.search} size={15}/>
              <input className="form__input search-input" placeholder="Buscar delegada/o..."
                value={busqDelegado} onChange={e => { setBusqDelegado(e.target.value); setDelegadoSel(null); }}/>
            </div>
            <div className="delegados-lista">
              {delegadosFiltrados.map(d => (
                <button key={d.idUsuario} type="button"
                  className={`delegado-item ${delegadoSel?.idUsuario === d.idUsuario ? "delegado-item--sel" : ""}`}
                  onClick={() => setDelegadoSel(d)}>
                  <div className="delegado-avatar">{d.nombre[0]}{d.apellido[0]}</div>
                  <div><p className="delegado-nombre">{d.nombre} {d.apellido}</p><p className="delegado-correo">{d.correo}</p></div>
                </button>
              ))}
              {delegadosFiltrados.length === 0 && <p style={{color:"#9aa5b4",textAlign:"center",padding:"16px 0"}}>Sin resultados</p>}
            </div>
            {msgAsignar && <p className="form__error" style={{marginTop:8}}>{msgAsignar}</p>}
          </div>
          <div className="modal__footer">
            <button className="btn-outline" onClick={() => setModalAsignar(null)}>Cancelar</button>
            <button className="btn-primary" disabled={!delegadoSel} onClick={handleAsignar}>Confirmar asignación</button>
          </div>
        </Modal>
      )}
    </>
  );
}


function VistaAdminDelegados() {
  const [loading, setLoading]     = useState(true);
  const [delegados, setDelegados] = useState<Delegado[]>([]);
  const [error, setError]         = useState("");
  const [modal, setModal]         = useState<{ mode: "new" | "edit"; delegado?: Delegado } | null>(null);
  const [form, setForm]           = useState({ nombre:"", apellido:"", correo:"", telefono:"", password:"" });
  const [errors, setErrors]       = useState({ nombre:"", apellido:"", correo:"", telefono:"", password:"" });

  const limpiarFormulario = () => {
    setForm({ nombre:"", apellido:"", correo:"", telefono:"", password:"" });
    setErrors({ nombre:"", apellido:"", correo:"", telefono:"", password:"" });
  };

  const cargar = () => {
    setLoading(true);
    setError("");
    fetch(`${API}/admin/delegados`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setDelegados(d.delegados || []);
        else setError(d.mensaje || "Error");
      })
      .catch(() => setError("Sin conexión"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const validarForm = () => {
    const nuevosErrores = {
      nombre: "",
      apellido: "",
      correo: "",
      telefono: "",
      password: "",
    };

    const nombre = form.nombre.trim();
    const apellido = form.apellido.trim();
    const correo = form.correo.trim();
    const telefono = form.telefono.trim();
    const password = form.password;

    if (!nombre) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    } else if (nombre.length < 2) {
      nuevosErrores.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
      nuevosErrores.nombre = "El nombre solo debe contener letras";
    }

    if (!apellido) {
      nuevosErrores.apellido = "El apellido es obligatorio";
    } else if (apellido.length < 2) {
      nuevosErrores.apellido = "El apellido debe tener al menos 2 caracteres";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(apellido)) {
      nuevosErrores.apellido = "El apellido solo debe contener letras";
    }

    if (!correo) {
      nuevosErrores.correo = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = "Ingresa un correo válido";
    }

    if (!telefono) {
      nuevosErrores.telefono = "El teléfono es obligatorio";
    } else if (!/^\d{7,15}$/.test(telefono)) {
      nuevosErrores.telefono = "El teléfono debe tener entre 7 y 15 dígitos";
    }

    if (modal?.mode === "new") {
      if (!password.trim()) {
        nuevosErrores.password = "La contraseña es obligatoria";
      } else if (password.length < 6) {
        nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres";
      }
    } else {
      if (password.trim() && password.length < 6) {
        nuevosErrores.password = "La nueva contraseña debe tener al menos 6 caracteres";
      }
    }

    setErrors(nuevosErrores);
    return !Object.values(nuevosErrores).some(v => v);
  };

  const save = async () => {
    if (!validarForm()) return;

    try {
      if (modal?.mode === "new") {
        const res = await fetch(`${API}/admin/delegados`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            correo: form.correo.trim(),
            telefono: form.telefono.trim(),
            password: form.password,
          }),
        });
        const d = await res.json();
        if (!d.ok) throw new Error(d.mensaje || "Error");
      } else if (modal?.mode === "edit" && modal.delegado) {
        const payload: any = {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          correo: form.correo.trim(),
          telefono: form.telefono.trim(),
        };

        if (form.password.trim()) {
          payload.password = form.password;
        }

        const res = await fetch(`${API}/admin/delegados/${modal.delegado.idUsuario}`, {
          method:"PUT",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const d = await res.json();
        if (!d.ok) throw new Error(d.mensaje || "Error");
      }

      setModal(null);
      limpiarFormulario();
      cargar();
    } catch (e: any) {
      setError(e.message || "Error");
    }
  };

  const setActivo = async (id: number, activo: boolean) => {
    await fetch(`${API}/admin/usuario/${id}/activo`, {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ activo }),
    });
    cargar();
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2 className="admin-page-title">Gestión de Delegados</h2>
          <p className="admin-page-sub">Administra los delegados registrados</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            limpiarFormulario();
            setModal({ mode:"new" });
          }}
        >
          <Ico d={icons.userPlus} size={16}/> Asignar delegado
        </button>
      </div>

      <div className="admin-panel">
        <h3 className="page-title" style={{ marginBottom:16 }}>Todos los delegados</h3>

        {loading ? <Spinner/> : (
          <>
            {error && <p className="form__error" style={{ marginBottom:12 }}>{error}</p>}

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Defensas asignadas</th>
                  </tr>
                </thead>
                <tbody>
                  {delegados.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign:"center", color:"#9aa5b4", padding:"32px" }}>
                          Sin delegados
                        </td>
                      </tr>
                    )
                    : delegados.map(d => (
                      <tr
                        key={d.idUsuario}
                        style={{ cursor:"pointer" }}
                        onClick={() => {
                          setForm({
                            nombre: d.nombre || "",
                            apellido: d.apellido || "",
                            correo: d.correo || "",
                            telefono: d.telefono || "",
                            password: "",
                          });
                          setErrors({ nombre:"", apellido:"", correo:"", telefono:"", password:"" });
                          setModal({ mode:"edit", delegado:d });
                        }}
                      >
                        <td className="td-bold">{d.nombre} {d.apellido}</td>
                        <td>{d.correo}</td>
                        <td>{d.telefono || "-"}</td>
                        <td>
                          <span className={`badge ${d.activo ? "badge--aceptada" : "badge--rechazada"}`}>
                            {d.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          <span className="badge-count">{d.defensasAsignadas ?? 0}</span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modal && (
        <Modal
          title={modal.mode === "new" ? "Nuevo delegado" : "Editar delegado"}
          onClose={() => {
            setModal(null);
            limpiarFormulario();
          }}
        >
          <div className="modal__body">
            <div className="form__group" style={{ marginBottom:12 }}>
              <label className="form__label">Nombre *</label>
              <input
                className="form__input"
                type="text"
                value={form.nombre}
                onChange={e => {
                  const value = e.target.value;
                  setForm({ ...form, nombre: value });
                  setErrors({ ...errors, nombre: "" });
                }}
              />
              {errors.nombre && <p className="form__error" style={{ marginTop:6 }}>{errors.nombre}</p>}
            </div>

            <div className="form__group" style={{ marginBottom:12 }}>
              <label className="form__label">Apellido *</label>
              <input
                className="form__input"
                type="text"
                value={form.apellido}
                onChange={e => {
                  const value = e.target.value;
                  setForm({ ...form, apellido: value });
                  setErrors({ ...errors, apellido: "" });
                }}
              />
              {errors.apellido && <p className="form__error" style={{ marginTop:6 }}>{errors.apellido}</p>}
            </div>

            <div className="form__group" style={{ marginBottom:12 }}>
              <label className="form__label">Correo *</label>
              <input
                className="form__input"
                type="email"
                value={form.correo}
                onChange={e => {
                  const value = e.target.value;
                  setForm({ ...form, correo: value });
                  setErrors({ ...errors, correo: "" });
                }}
              />
              {errors.correo && <p className="form__error" style={{ marginTop:6 }}>{errors.correo}</p>}
            </div>

            <div className="form__group" style={{ marginBottom:12 }}>
              <label className="form__label">Telefono *</label>
              <input
                className="form__input"
                type="text"
                inputMode="numeric"
                value={form.telefono}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, telefono: value });
                  setErrors({ ...errors, telefono: "" });
                }}
              />
              {errors.telefono && <p className="form__error" style={{ marginTop:6 }}>{errors.telefono}</p>}
            </div>

            <div className="form__group" style={{ marginBottom:12 }}>
              <label className="form__label">
                {modal.mode === "new" ? "Contraseña *" : "Nueva contraseña (opcional)"}
              </label>
              <input
                className="form__input"
                type="password"
                value={form.password}
                onChange={e => {
                  const value = e.target.value;
                  setForm({ ...form, password: value });
                  setErrors({ ...errors, password: "" });
                }}
              />
              {errors.password && <p className="form__error" style={{ marginTop:6 }}>{errors.password}</p>}
            </div>

            {modal.mode === "edit" && modal.delegado && (
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                {modal.delegado.activo ? (
                  <button
                    className="btn-outline"
                    type="button"
                    onClick={() => {
                      setActivo(modal.delegado!.idUsuario, false);
                      setModal(null);
                      limpiarFormulario();
                    }}
                  >
                    Desactivar
                  </button>
                ) : (
                  <button
                    className="btn-outline"
                    type="button"
                    onClick={() => {
                      setActivo(modal.delegado!.idUsuario, true);
                      setModal(null);
                      limpiarFormulario();
                    }}
                  >
                    Activar
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="modal__footer">
            <button
              className="btn-outline"
              onClick={() => {
                setModal(null);
                limpiarFormulario();
              }}
            >
              Cancelar
            </button>

            <button className="btn-primary" onClick={save}>
              Guardar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function VistaAdminCrearDefensa({ onBack, onCreada }: { onBack: () => void; onCreada: () => void }) {
  const [form, setForm] = useState({
    nombreCompleto: "", titulo: "", fecha: "", hora: "",
    lugar: "", direccion: "", enlaceGoogleMaps: "", observaciones: "",
  });
  const [errors, setErrors] = useState({
    nombreCompleto: "", titulo: "", fecha: "", hora: "", lugar: "", direccion: "",
  });
  const [archivos, setArchivos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const agregarArchivos = (e: { target: HTMLInputElement }) => {
    if (!e.target.files) return;
    const nuevos = Array.from(e.target.files);
    setArchivos(prev => {
      const nombresExistentes = new Set(prev.map(f => f.name));
      return [...prev, ...nuevos.filter(f => !nombresExistentes.has(f.name))];
    });
    e.target.value = "";
  };

  const quitarArchivo = (nombre: string) =>
    setArchivos(prev => prev.filter(f => f.name !== nombre));

  const previsualizarArchivo = async (archivo: File) => {
    const ext = archivo.name.split(".").pop()?.toLowerCase();

    if (ext === "docx") {
      const buffer = await archivo.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <style>body{font-family:Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;line-height:1.7;color:#1a202c;}
        h1,h2,h3{color:#1d3d6b;}</style></head>
        <body>${result.value}</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } else if (ext === "doc") {
      alert("Los archivos .doc (formato antiguo) no pueden previsualizarse en el navegador.\nConvierte el archivo a .docx o .pdf para poder verlo.");
    } else {
      const url = URL.createObjectURL(archivo);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const setField = (k: keyof typeof form) =>
    (e: { target: { value: string } }) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const validar = () => {
    const e = { nombreCompleto:"", titulo:"", fecha:"", hora:"", lugar:"", direccion:"" };
    const nombre = form.nombreCompleto.trim();
    if (!nombre) e.nombreCompleto = "El nombre es obligatorio";
    else if (nombre.split(" ").filter(Boolean).length < 2) e.nombreCompleto = "Ingresa nombre y apellido";
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) e.nombreCompleto = "Solo se permiten letras";
    if (!form.titulo.trim()) e.titulo = "El título es obligatorio";
    if (!form.fecha) e.fecha = "La fecha es obligatoria";
    if (!form.hora) e.hora = "La hora es obligatoria";
    if (!form.lugar.trim()) e.lugar = "El lugar es obligatorio";
    if (!form.direccion.trim()) e.direccion = "La dirección es obligatoria";
    setErrors(e);
    return !Object.values(e).some(v => v);
  };

  const handleSubmit = async () => {
    if (!validar()) return;
    setSending(true); setError("");
    try {
      const partes = form.nombreCompleto.trim().split(" ").filter(Boolean);
      const estudianteNombre   = partes[0];
      const estudianteApellido = partes.slice(1).join(" ");
      const res = await fetch(`${API}/defensas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estudianteNombre,
          estudianteApellido,
          titulo:           form.titulo.trim(),
          fecha:            `${form.fecha}T${form.hora}`,
          lugar:            form.lugar.trim(),
          direccion:        form.direccion.trim(),
          enlaceGoogleMaps: form.enlaceGoogleMaps.trim(),
          observaciones:    form.observaciones.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error al crear la defensa");
      onCreada();
    } catch (e: any) {
      setError(e.message || "Sin conexión");
    } finally { setSending(false); }
  };

  return (
    <>
      <div className="crear-defensa-back">
        <button className="btn-back-crear" onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>
      </div>

      <div className="admin-page-head" style={{ marginTop: 8 }}>
        <div>
          <h2 className="admin-page-title">Nueva Defensa</h2>
          <p className="admin-page-sub">Completa el formulario para crear una nueva defensa</p>
        </div>
      </div>

      <div className="admin-panel crear-defensa-panel">
        <div className="crear-defensa-section-head">
          <h3 className="crear-defensa-section-title">Información de la Defensa</h3>
          <p className="crear-defensa-section-sub">Los campos marcados con * son obligatorios</p>
        </div>

        <div className="crear-defensa-fields">
          {/* Nombre completo */}
          <div className="form__group">
            <label className="form__label">Nombre del estudiante *</label>
            <input className="form__input" value={form.nombreCompleto} onChange={setField("nombreCompleto")}
              placeholder="Ej: María González Pérez"/>
            {errors.nombreCompleto && <p className="form__error">{errors.nombreCompleto}</p>}
          </div>

          {/* Título */}
          <div className="form__group">
            <label className="form__label">Título o perfil de tesis *</label>
            <textarea className="form__input form__textarea" value={form.titulo}
              onChange={setField("titulo")} rows={3}
              placeholder="Ej: Estrategias de Marketing Digital en Redes Sociales"/>
            {errors.titulo && <p className="form__error">{errors.titulo}</p>}
          </div>

          {/* Fecha y Hora en grid */}
          <div className="crear-defensa-row">
            <div className="form__group">
              <label className="form__label">Fecha *</label>
              <input className="form__input" type="date" value={form.fecha} onChange={setField("fecha")}/>
              {errors.fecha && <p className="form__error">{errors.fecha}</p>}
            </div>
            <div className="form__group">
              <label className="form__label">Hora *</label>
              <input className="form__input" type="time" value={form.hora} onChange={setField("hora")}/>
              {errors.hora && <p className="form__error">{errors.hora}</p>}
            </div>
          </div>

          {/* Lugar */}
          <div className="form__group">
            <label className="form__label">Lugar *</label>
            <input className="form__input" value={form.lugar} onChange={setField("lugar")}
              placeholder="Ej: Auditorio Principal"/>
            {errors.lugar && <p className="form__error">{errors.lugar}</p>}
          </div>

          {/* Dirección */}
          <div className="form__group">
            <label className="form__label">Dirección *</label>
            <input className="form__input" value={form.direccion} onChange={setField("direccion")}
              placeholder="Ej: Av. Heroínas #1234, Cochabamba"/>
            {errors.direccion && <p className="form__error">{errors.direccion}</p>}
          </div>

          {/* Google Maps */}
          <div className="form__group">
            <label className="form__label">Enlace de Google Maps</label>
            <input className="form__input" value={form.enlaceGoogleMaps} onChange={setField("enlaceGoogleMaps")}
              placeholder="https://maps.google.com/..."/>
          </div>

          {/* Documentos */}
          <div className="form__group">
            <label className="form__label">Subir documentos</label>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg"
              style={{ display:"none" }} onChange={agregarArchivos}/>
            <button type="button" className="btn-elegir-archivo"
              onClick={() => fileInputRef.current?.click()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Elegir archivos
            </button>
            {archivos.length > 0 && (
              <ul className="archivos-lista">
                {archivos.map(f => (
                  <li key={f.name} className="archivos-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="archivos-nombre archivos-nombre--link"
                      onClick={() => previsualizarArchivo(f)}
                      title="Clic para previsualizar">{f.name}</span>
                    <span className="archivos-size">({(f.size / 1024).toFixed(0)} KB)</span>
                    <button type="button" className="archivos-quitar"
                      onClick={() => quitarArchivo(f.name)} title="Quitar archivo">✕</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="form__hint">Puedes subir perfil de tesis, documentos de aprobación, etc.</p>
          </div>

          {/* Observaciones */}
          <div className="form__group">
            <label className="form__label">Observaciones</label>
            <textarea className="form__input form__textarea" value={form.observaciones}
              onChange={setField("observaciones")} rows={3}
              placeholder="Notas adicionales, requerimientos especiales, etc."/>
          </div>
        </div>

        {error && <p className="form__error" style={{ marginTop: 8 }}>{error}</p>}

        <div className="crear-defensa-actions">
          <button className="btn-primary" onClick={handleSubmit} disabled={sending}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {sending ? "Guardando..." : "Crear defensa"}
          </button>
          <button className="btn-outline" onClick={onBack} disabled={sending}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

function VistaAdminPagos() {
  const [pagos, setPagos]   = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const cargar = () => {
    setLoading(true);
    fetch(`${API}/admin/pagos`).then(r=>r.json())
      .then(d => { if(d.ok) setPagos(d.pagos||[]); else setError(d.error||"Error"); })
      .catch(() => setError("Sin conexión")).finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const marcarPagado = async (idPago: number) => {
    await fetch(`${API}/admin/pagos/${idPago}/pagar`, { method:"PUT" });
    cargar();
  };

  const pendientes  = pagos.filter(p => p.estado === "pendiente");
  const completados = pagos.filter(p => p.estado === "pagado");

  return (
    <>
      <div className="admin-page-head">
        <div><h2 className="admin-page-title">Pagos Pendientes</h2><p className="admin-page-sub">Gestiona los pagos de las defensas completadas</p></div>
      </div>

      <div className="admin-cards" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
        {[
          { label:"Pagos pendientes",  value: pendientes.length,  tone:"yellow", ico: icons.bell },
          { label:"Pagos completados", value: completados.length, tone:"green",  ico: icons.checkCirc },
          { label:"Total de defensas", value: pagos.length,       tone:"blue",   ico: icons.dollar },
        ].map(c => (
          <div key={c.label} className="admin-card">
            <div className="admin-card__top">
              <span className="admin-card__label">{c.label}</span>
              <div className={`admin-card__ico admin-card__ico--${c.tone}`}><Ico d={c.ico} size={16}/></div>
            </div>
            <div className="admin-card__value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-panel">
        <h3 className="page-title" style={{marginBottom:16}}>Defensas con pagos pendientes</h3>
        {loading ? <Spinner/> : error ? <p className="form__error">{error}</p> :
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Estudiante</th><th>Delegado</th><th>Fecha de defensa</th><th>Estado de pago</th><th>Acción</th></tr></thead>
              <tbody>
                {pendientes.length === 0
                  ? <tr><td colSpan={5} style={{textAlign:"center",color:"#9aa5b4",padding:"32px"}}>Sin pagos pendientes</td></tr>
                  : pendientes.map(p => (
                    <tr key={p.idPago}>
                      <td className="td-bold">{p.nombreEstudiante} {p.apellidoEstudiante}</td>
                      <td>{p.nombreDelegado ? `${p.nombreDelegado} ${p.apellidoDelegado}` : "-"}</td>
                      <td>{fFechaCorta(p.fecha)}</td>
                      <td><span className="badge badge--pend-pago">Pendiente de pago</span></td>
                      <td>
                        <button className="btn-pago" onClick={() => marcarPagado(p.idPago)}>
                          <Ico d={icons.dollar} size={15}/> Marcar como pagado
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </>
  );
}

function AdminSidebar({ usuario, active, onChange, onLogout }: {
  usuario: Usuario; active: string; onChange: (k: string) => void; onLogout: () => void;
}) {
  const items = [
    { key:"admin_dashboard",    label:"Dashboard",            ico: icons.home },
    { key:"admin_defensas",     label:"Gestión de Defensas",  ico: icons.doc },
    { key:"admin_delegados",    label:"Gestión de Delegados", ico: icons.users },
    { key:"admin_invitaciones", label:"Invitaciones",         ico: icons.mail },
    { key:"admin_pagos",        label:"Pagos Pendientes",     ico: icons.dollar },
  ];
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div className="admin-brand__title">Colegio de Marketing</div>
        <div className="admin-brand__sub">Panel Administrador</div>
      </div>
      <div className="admin-menu">
        {items.map(it => (
          <button key={it.key} type="button"
            className={`admin-menu__item ${active === it.key ? "admin-menu__item--active" : ""}`}
            onClick={() => onChange(it.key)}>
            <span className="admin-menu__ico"><Ico d={it.ico} size={16}/></span>
            {it.label}
          </button>
        ))}
      </div>
      <div className="admin-user">
        <div className="admin-user__avatar">{usuario.nombre?.[0]}{usuario.apellido?.[0]}</div>
        <div>
          <div className="admin-user__name">{usuario.nombre} {usuario.apellido}</div>
        </div>
      </div>
      <button className="admin-logout" onClick={onLogout} type="button">
        <Ico d={icons.logout} size={18}/> Cerrar sesión
      </button>
    </aside>
  );
}

// ════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════
export default function Dashboard({ usuario, onLogout }: DashboardProps) {
  const [nav, setNav]             = useState(usuario.rol === 0 ? "admin_dashboard" : "inicio");
  const [defensas, setDefensas]   = useState<Defensa[]>([]);
  const [delegados, setDelegados] = useState<Delegado[]>([]);
  const [loading, setLoading]     = useState(true);
  const [detalle, setDetalle]     = useState<Defensa | null>(null);
  const [evidencia, setEvidencia] = useState<Defensa | null>(null);

  const cargarDefensas = () => {
    setLoading(true);
    const url = usuario.rol === 0 ? `${API}/admin/defensas` : `${API}/defensas/${usuario.id}`;
    fetch(url).then(r=>r.json()).then(d => { if(d.ok) setDefensas(d.defensas); }).catch(console.error).finally(() => setLoading(false));
  };

  const cargarDelegados = () => {
    if (usuario.rol !== 0) return;
    fetch(`${API}/admin/delegados/detalle`).then(r=>r.json()).then(d => { if(d.ok) setDelegados(d.delegados||[]); }).catch(console.error);
  };

  useEffect(() => { cargarDefensas(); cargarDelegados(); }, [usuario]);

  const handleAceptar = async (id: number) => {
    await fetch(`${API}/asignacion/${id}/estado`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({estado:"aceptada"}) });
    setDetalle(null); setNav("pendientes"); cargarDefensas();
  };

  const handleRechazar = async (id: number, justificacion: string) => {
    await fetch(`${API}/asignacion/${id}/estado`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({estado:"rechazada",justificacion}) });
    setDetalle(null); setNav("nuevas"); cargarDefensas();
  };

  const handleEvidencia = async ({ defensa, imagen, pdf, comentarios }: any) => {
    const fd = new FormData();
    if (imagen) fd.append("imagen", imagen);
    if (pdf)    fd.append("pdf", pdf);
    if (comentarios) fd.append("comentarios", comentarios);
    await fetch(`${API}/asignacion/${defensa.idAsignacion}/completar`, { method: "PUT", body: fd });
    setEvidencia(null); setNav("completadas"); cargarDefensas();
  };

  const handleNav = (key: string) => { setDetalle(null); setEvidencia(null); setNav(key); };

  // ── Render Admin ─────────────────────────────────────
  if (usuario.rol === 0) {
    const renderAdmin = () => {
      switch(nav) {
        case "admin_dashboard":    return <VistaAdminDashboard defensas={defensas} onNav={handleNav}/>;
        case "admin_delegados":    return <VistaAdminDelegados/>;
        case "admin_pagos":        return <VistaAdminPagos/>;
        case "admin_crear":        return <VistaAdminCrearDefensa onBack={() => setNav("admin_defensas")} onCreada={() => { cargarDefensas(); setNav("admin_defensas"); }}/>;
        case "admin_defensas":
        default:
          return <VistaAdminDefensas defensas={defensas} loading={loading} delegados={delegados} onIrCrear={() => setNav("admin_crear")} onRecargar={() => { cargarDefensas(); cargarDelegados(); }}/>;
      }
    };
    return (
      <div className="admin-shell">
        <AdminSidebar usuario={usuario} active={nav} onChange={handleNav} onLogout={onLogout}/>
        <div className="admin-content">{renderAdmin()}</div>
      </div>
    );
  }

  // ── Render Delegado ───────────────────────────────────
  const renderDelegado = () => {
    if (detalle) return <VistaDetalle usuario={usuario} defensa={detalle} onBack={() => setDetalle(null)} onAceptar={handleAceptar} onRechazar={handleRechazar}/>;
    if (evidencia) return <VistaEvidencia usuario={usuario} defensa={evidencia} onBack={() => setEvidencia(null)} onEnviar={handleEvidencia}/>;
    switch(nav) {
      case "inicio":      return <VistaInicio      usuario={usuario} defensas={defensas} loading={loading} onNav={handleNav}/>;
      case "nuevas":      return <VistaNuevas      usuario={usuario} defensas={defensas} loading={loading} onDetalle={d => setDetalle(d)}/>;
      case "pendientes":  return <VistaPendientes  usuario={usuario} defensas={defensas} loading={loading} onEvidencia={d => setEvidencia(d)}/>;
      case "completadas": return <VistaCompletadas usuario={usuario} defensas={defensas} loading={loading}/>;
      case "perfil":      return <VistaPerfil      usuario={usuario} onLogout={onLogout}/>;
      default:            return null;
    }
  };

  return (
    <div className="dashboard">
      {renderDelegado()}
      <BottomNav active={nav} onChange={handleNav}/>
    </div>
  );
}