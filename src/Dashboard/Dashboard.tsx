import { useState, useEffect } from "react";
import "./Dashboard.css";

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
}

interface DashboardProps {
  usuario: Usuario;
  onLogout: () => void;
}

interface EvidenciaPayload {
  defensa: Defensa;
  imagen: File | null;
  pdf: File | null;
  comentarios: string;
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
};

// ════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════
const fFecha = (f: string) => f ? new Date(f).toLocaleDateString("es-BO", { weekday:"long", day:"numeric", month:"long", year:"numeric" }) : "-";
const fFechaCorta = (f: string) => f ? new Date(f).toLocaleDateString("es-BO", { day:"2-digit", month:"2-digit", year:"numeric" }) : "-";
const fHora  = (f: string) => f ? new Date(f).toLocaleTimeString("es-BO", { hour:"2-digit", minute:"2-digit" }) : "-";

// ════════════════════════════════════════════════════════
// TOPBAR
// ════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════
// BOTTOM NAV
// ════════════════════════════════════════════════════════
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
// MODAL
// ════════════════════════════════════════════════════════
function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
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

// ════════════════════════════════════════════════════════
// VISTA: INICIO
// ════════════════════════════════════════════════════════
function VistaInicio({ usuario, defensas, loading, onDetalle, onEvidencia }: {
  usuario: Usuario; defensas: Defensa[]; loading: boolean;
  onDetalle: (d: Defensa) => void; onEvidencia: (d: Defensa) => void;
}) {
  const [tabActiva, setTabActiva] = useState<string>("nuevas");

  const counts = {
    nuevas:      defensas.filter(d => d.estadoAsignacion === "pendiente").length,
    pendientes:  defensas.filter(d => d.estadoAsignacion === "aceptada").length,
    completadas: defensas.filter(d => d.estadoAsignacion === "completada").length,
  };

  const listaFiltrada = {
    nuevas:      defensas.filter(d => d.estadoAsignacion === "pendiente"),
    pendientes:  defensas.filter(d => d.estadoAsignacion === "aceptada"),
    completadas: defensas.filter(d => d.estadoAsignacion === "completada"),
  };

  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <section className="welcome">
          <h1 className="welcome__title">Bienvenida/o</h1>
          <p className="welcome__name">{usuario.nombre} {usuario.apellido}</p>
        </section>

        <section className="stats">
          {[
            { key:"nuevas",      label:"Nuevas",      ico:icons.bell,      cls:"blue"   },
            { key:"pendientes",  label:"Pendientes",  ico:icons.calendar,  cls:"yellow" },
            { key:"completadas", label:"Completadas", ico:icons.checkCirc, cls:"green"  },
          ].map(({ key, label, ico, cls }) => (
            <button key={key} className="stat-card" onClick={() => setTabActiva(key)}>
              <div className={`stat-card__icon stat-card__icon--${cls}`}><Ico d={ico} size={24}/></div>
              <span className="stat-card__num">{loading ? "…" : counts[key as keyof typeof counts]}</span>
              <span className="stat-card__label">{label}</span>
            </button>
          ))}
        </section>

        {/* Tabs */}
        <div className="tabs">
          {["nuevas","pendientes","completadas"].map(tab => (
            <button key={tab}
              className={`tabs__btn ${tabActiva === tab ? "tabs__btn--active" : ""}`}
              onClick={() => setTabActiva(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Lista según tab activa */}
        {loading ? <Spinner/> : (
          <section className="defensas-list">
            {listaFiltrada[tabActiva as keyof typeof listaFiltrada].length === 0
              ? <Vacio texto={`No hay defensas ${tabActiva}`}/>
              : listaFiltrada[tabActiva as keyof typeof listaFiltrada].map(d => (
                <div key={d.idDefensa} className="inv-card">
                  <h3 className="inv-card__nombre">{d.nombreEstudiante} {d.apellidoEstudiante}</h3>
                  <p className="inv-card__titulo">{d.titulo}</p>
                  <div className="inv-card__meta">
                    <span className="defensa-meta__item"><Ico d={icons.calendar} size={13}/> {fFechaCorta(d.fecha)}</span>
                    <span className="defensa-meta__item"><Ico d={icons.bell} size={13}/> {fHora(d.fecha)}</span>
                  </div>
                  <div className="inv-card__meta">
                    <span className="defensa-meta__item"><Ico d={icons.pin} size={13}/> {d.lugar || "Sin lugar"}</span>
                  </div>
                  {tabActiva === "nuevas" && (
                    <button className="btn-primary" onClick={() => onDetalle(d)}>Ver detalle</button>
                  )}
                  {tabActiva === "pendientes" && (
                    <button className="btn-primary" onClick={() => onEvidencia(d)}>
                      <Ico d={icons.upload} size={16}/> Completar defensa
                    </button>
                  )}
                  {tabActiva === "completadas" && (
                    <span className={`badge ${d.estadoPago === "pagado" ? "badge--pagado" : "badge--pend-pago"}`}>
                      {d.estadoPago === "pagado" ? "Pago realizado" : "Pendiente"}
                    </span>
                  )}
                </div>
              ))
            }
          </section>
        )}
      </main>
    </>
  );
}

// ════════════════════════════════════════════════════════
// VISTA: NUEVAS
// ════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════
// VISTA: DETALLE CONVOCATORIA
// ════════════════════════════════════════════════════════
function VistaDetalle({ usuario, defensa, onBack, onAceptar, onRechazar }: {
  usuario: Usuario; defensa: Defensa;
  onBack: () => void;
  onAceptar: (id: number) => Promise<void>;
  onRechazar: (id: number, justificacion: string) => Promise<void>;
}) {
  const [modalRechazo, setModalRechazo] = useState(false);
  const [justificacion, setJustificacion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAceptar = async () => {
    setLoading(true);
    await onAceptar(defensa.idAsignacion);
    setLoading(false);
  };

  const handleConfirmarRechazo = async () => {
    if (!justificacion.trim()) return;
    setLoading(true);
    await onRechazar(defensa.idAsignacion, justificacion);
    setLoading(false);
    setModalRechazo(false);
  };

  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <button className="btn-back" onClick={onBack}><Ico d={icons.back} size={16}/> Volver</button>
        <h2 className="page-title" style={{ marginBottom: 24 }}>Detalle de Convocatoria</h2>

        <div className="detail-section">
          <h4 className="detail-section__title">Información del Estudiante</h4>
          <div className="detail-field">
            <span className="detail-field__label">Nombre completo</span>
            <span className="detail-field__value">{defensa.nombreEstudiante} {defensa.apellidoEstudiante}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Título de tesis</span>
            <span className="detail-field__value">{defensa.titulo}</span>
          </div>
        </div>

        <div className="detail-section">
          <h4 className="detail-section__title">Fecha y Hora</h4>
          <div className="detail-field">
            <span className="detail-field__label">Fecha</span>
            <span className="detail-field__value">{fFecha(defensa.fecha)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Hora</span>
            <span className="detail-field__value">{fHora(defensa.fecha)}</span>
          </div>
        </div>

        <div className="detail-section">
          <h4 className="detail-section__title">Ubicación</h4>
          <div className="detail-field">
            <span className="detail-field__label">Lugar</span>
            <span className="detail-field__value">{defensa.lugar || "Sin lugar"}</span>
          </div>
        </div>

        <div className="detail-actions">
          <button className="btn-primary" onClick={handleAceptar} disabled={loading}>
            <Ico d={icons.check} size={16}/> Aceptar convocatoria
          </button>
          <button className="btn-danger" onClick={() => setModalRechazo(true)} disabled={loading}>
            <Ico d={icons.close} size={16}/> Rechazar
          </button>
        </div>
      </main>

      {modalRechazo && (
        <Modal title="Rechazar Convocatoria"
          subtitle="Por favor, proporciona un justificativo para rechazar esta convocatoria."
          onClose={() => setModalRechazo(false)}>
          <div className="modal__body">
            <label className="form__label">Justificativo del rechazo *</label>
            <textarea className="form__textarea"
              placeholder="Ej. Conflicto de horario con otra defensa..."
              value={justificacion}
              onChange={e => setJustificacion(e.target.value)}/>
          </div>
          <div className="modal__footer">
            <button className="btn-outline" onClick={() => setModalRechazo(false)}>Cancelar</button>
            <button className="btn-danger" onClick={handleConfirmarRechazo} disabled={!justificacion.trim()}>
              Confirmar rechazo
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════
// VISTA: PENDIENTES
// ════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════
// VISTA: EVIDENCIA
// ════════════════════════════════════════════════════════
function VistaEvidencia({ usuario, defensa, onBack, onEnviar }: {
  usuario: Usuario; defensa: Defensa;
  onBack: () => void;
  onEnviar: (payload: EvidenciaPayload) => Promise<void>;
}) {
  const [imagen, setImagen]      = useState<File | null>(null);
  const [pdf, setPdf]            = useState<File | null>(null);
  const [comentarios, setComent] = useState<string>("");
  const [loading, setLoading]    = useState<boolean>(false);

  const handleEnviar = async () => {
    setLoading(true);
    await onEnviar({ defensa, imagen, pdf, comentarios });
    setLoading(false);
  };

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
          <input type="file" accept="image/*" className="file-input"
            onChange={e => setImagen(e.target.files?.[0] ?? null)}/>
          <p className="file-hint">Fotografía del acta de defensa o evidencia del asistente</p>
        </div>

        <div className="detail-section">
          <h4 className="detail-section__title">Subir Archivo PDF del Informe</h4>
          <input type="file" accept=".pdf" className="file-input"
            onChange={e => setPdf(e.target.files?.[0] ?? null)}/>
          <p className="file-hint">Informe de la defensa en formato PDF</p>
        </div>

        <div className="detail-section">
          <h4 className="detail-section__title">Comentarios</h4>
          <textarea className="form__textarea"
            placeholder="Observaciones adicionales sobre la defensa..."
            value={comentarios}
            onChange={e => setComent(e.target.value)}/>
        </div>

        <button className="btn-primary btn-primary--full" onClick={handleEnviar} disabled={loading}>
          {loading ? <span className="btn-spinner"/> : <Ico d={icons.upload} size={16}/>}
          {loading ? " Enviando..." : " Enviar evidencia"}
        </button>
      </main>
    </>
  );
}

// ════════════════════════════════════════════════════════
// VISTA: COMPLETADAS
// ════════════════════════════════════════════════════════
function VistaCompletadas({ usuario, defensas, loading }: {
  usuario: Usuario; defensas: Defensa[]; loading: boolean;
}) {
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
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Perfil de tesis</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0
                  ? <tr><td colSpan={4} style={{ textAlign:"center", color:"#9aa5b4", padding:"32px" }}>Sin registros</td></tr>
                  : lista.map(d => (
                    <tr key={d.idDefensa}>
                      <td className="td-bold">{d.nombreEstudiante} {d.apellidoEstudiante}</td>
                      <td className="td-truncate">{d.titulo}</td>
                      <td>{fFechaCorta(d.fecha)}</td>
                      <td>
                        <span className={`badge ${d.estadoPago === "pagado" ? "badge--pagado" : "badge--pend-pago"}`}>
                          {d.estadoPago === "pagado" ? "Pago realizado" : "Pendiente"}
                        </span>
                      </td>
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

// ════════════════════════════════════════════════════════
// VISTA: PERFIL
// ════════════════════════════════════════════════════════
function VistaPerfil({ usuario, onLogout }: { usuario: Usuario; onLogout: () => void }) {
  const [modalPass, setModalPass] = useState(false);
  const [notifs, setNotifs]       = useState(true);
  const [passForm, setPassForm]   = useState({ actual:"", nueva:"", confirmar:"" });
  const [passMsg, setPassMsg]     = useState("");

  const handleChangePass = async () => {
    if (passForm.nueva !== passForm.confirmar) {
      setPassMsg("Las contraseñas no coinciden"); return;
    }
    const res = await fetch(`${API}/usuario/${usuario.id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual: passForm.actual, nueva: passForm.nueva }),
    });
    const data = await res.json();
    if (data.ok) {
      setPassMsg("Contraseña actualizada ✓");
      setTimeout(() => { setModalPass(false); setPassMsg(""); setPassForm({ actual:"", nueva:"", confirmar:"" }); }, 1500);
    } else {
      setPassMsg(data.mensaje || "Error al cambiar contraseña");
    }
  };

  return (
    <>
      <Topbar usuario={usuario}/>
      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">Mi Perfil</h2>
          <p className="page-sub">Gestiona tu información personal</p>
        </div>

        <div className="profile-avatar-row">
          <div className="profile-avatar"><Ico d={icons.user} size={32}/></div>
          <div>
            <p className="profile-nombre">{usuario.nombre} {usuario.apellido}</p>
            <p className="profile-rol">{usuario.rolNombre}</p>
          </div>
        </div>

        <div className="detail-section">
          <h4 className="detail-section__title"><Ico d={icons.user} size={14}/> Información Personal</h4>
          <div className="profile-field">
            <span className="detail-field__label">Nombre completo</span>
            <span className="detail-field__value">{usuario.nombre} {usuario.apellido}</span>
          </div>
          <div className="profile-field">
            <span className="detail-field__label"><Ico d={icons.mail} size={13}/> Correo electrónico</span>
            <span className="detail-field__value">{usuario.correo}</span>
          </div>
          <div className="profile-field">
            <span className="detail-field__label"><Ico d={icons.phone} size={13}/> Teléfono</span>
            <span className="detail-field__value">{usuario.telefono || "No registrado"}</span>
          </div>
        </div>

        <div className="detail-section">
          <h4 className="detail-section__title"><Ico d={icons.lock} size={14}/> Seguridad</h4>
          <button className="btn-outline btn-outline--full" onClick={() => setModalPass(true)}>
            <Ico d={icons.lock} size={16}/> Cambiar contraseña
          </button>
        </div>

        <div className="detail-section">
          <h4 className="detail-section__title"><Ico d={icons.bell} size={14}/> Notificaciones</h4>
          <div className="toggle-row">
            <div>
              <p className="toggle-label">Activar notificaciones</p>
              <p className="toggle-sub">Recibir alertas de nuevas convocatorias</p>
            </div>
            <button className={`toggle ${notifs ? "toggle--on" : ""}`} onClick={() => setNotifs(!notifs)}>
              <span className="toggle__knob"/>
            </button>
          </div>
        </div>

        <button className="btn-logout-full" onClick={onLogout}>
          <Ico d={icons.logout} size={18}/> Cerrar sesión
        </button>
      </main>

      {modalPass && (
        <Modal title="Cambiar Contraseña"
          subtitle="Ingresa tu contraseña actual y la nueva contraseña."
          onClose={() => setModalPass(false)}>
          <div className="modal__body">
            {(["actual","nueva","confirmar"] as const).map(k => (
              <div key={k} className="form__group" style={{ marginBottom: 14 }}>
                <label className="form__label">
                  {k === "actual" ? "Contraseña actual" : k === "nueva" ? "Nueva contraseña" : "Confirmar nueva contraseña"}
                </label>
                <input type="password" className="form__input"
                  value={passForm[k]}
                  onChange={e => setPassForm({ ...passForm, [k]: e.target.value })}/>
              </div>
            ))}
            {passMsg && <p className={`${passMsg.includes("✓") ? "form__msg--ok" : "form__error"}`}>{passMsg}</p>}
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
// SPINNER / VACÍO
// ════════════════════════════════════════════════════════
function Spinner() {
  return <div className="loading"><div className="loading__spinner"/><p>Cargando...</p></div>;
}
function Vacio({ texto }: { texto: string }) {
  return <div className="empty">{texto}</div>;
}

// ════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════
export default function Dashboard({ usuario, onLogout }: DashboardProps) {
  const [nav, setNav]             = useState<string>("inicio");
  const [defensas, setDefensas]   = useState<Defensa[]>([]);
  const [loading, setLoading]     = useState<boolean>(true);
  const [detalle, setDetalle]     = useState<Defensa | null>(null);
  const [evidencia, setEvidencia] = useState<Defensa | null>(null);

  const cargarDefensas = () => {
    setLoading(true);
    const url = usuario.rol === 0
      ? `${API}/defensas`
      : `${API}/defensas/${usuario.id}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { if (d.ok) setDefensas(d.defensas); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarDefensas(); }, [usuario]);

  const handleAceptar = async (idAsignacion: number) => {
    await fetch(`${API}/asignacion/${idAsignacion}/estado`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "aceptada" }),
    });
    setDetalle(null); setNav("pendientes"); cargarDefensas();
  };

  const handleRechazar = async (idAsignacion: number, justificacion: string) => {
    await fetch(`${API}/asignacion/${idAsignacion}/estado`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "rechazada", justificacion }),
    });
    setDetalle(null); setNav("nuevas"); cargarDefensas();
  };

  const handleEvidencia = async ({ defensa, comentarios }: EvidenciaPayload) => {
    await fetch(`${API}/asignacion/${defensa.idAsignacion}/completar`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentarios }),
    });
    setEvidencia(null); setNav("completadas"); cargarDefensas();
  };

  const handleNav = (key: string) => {
    setDetalle(null); setEvidencia(null); setNav(key);
  };

  const renderVista = () => {
    if (detalle) return (
      <VistaDetalle usuario={usuario} defensa={detalle}
        onBack={() => setDetalle(null)}
        onAceptar={handleAceptar}
        onRechazar={handleRechazar}/>
    );
    if (evidencia) return (
      <VistaEvidencia usuario={usuario} defensa={evidencia}
        onBack={() => setEvidencia(null)}
        onEnviar={handleEvidencia}/>
    );
    switch (nav) {
      case "inicio":      return <VistaInicio      usuario={usuario} defensas={defensas} loading={loading} onDetalle={d => setDetalle(d)} onEvidencia={d => setEvidencia(d)}/>;
      case "nuevas":      return <VistaNuevas      usuario={usuario} defensas={defensas} loading={loading} onDetalle={d => setDetalle(d)}/>;
      case "pendientes":  return <VistaPendientes  usuario={usuario} defensas={defensas} loading={loading} onEvidencia={d => setEvidencia(d)}/>;
      case "completadas": return <VistaCompletadas usuario={usuario} defensas={defensas} loading={loading}/>;
      case "perfil":      return <VistaPerfil      usuario={usuario} onLogout={onLogout}/>;
      default:            return null;
    }
  };

  return (
    <div className="dashboard">
      {renderVista()}
      <BottomNav active={nav} onChange={handleNav}/>
    </div>
  );
}