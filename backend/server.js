require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express  = require("express");
const mysql    = require("mysql2/promise");
const cors     = require("cors");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const webpush  = require("web-push");

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error("[VAPID] ERROR: claves no configuradas en variables de entorno");
} else {
  console.log("[VAPID] Claves cargadas OK. Public:", process.env.VAPID_PUBLIC_KEY.slice(0, 20) + "...");
}
webpush.setVapidDetails(
  "mailto:admin@colegiomarketing.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── Multer: almacenamiento de evidencias ───────────────────────
const uploadsDir = path.join(__dirname, "uploads", "evidencias");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });


const app = express();
app.use(cors({
  origin: (_origin, cb) => cb(null, true),
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Pool de conexión ───────────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               Number(process.env.DB_PORT),
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  ssl:                { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit:    10,
});

// ── Ping ───────────────────────────────────────────────────────
app.get("/api/ping", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1+1 AS result");
    res.json({ ok: true, result: rows[0].result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── LOGIN ──────────────────────────────────────────────────────
// Nota: en producción usa bcrypt para comparar contraseñas
app.post("/api/login", async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ ok: false, mensaje: "Correo y contraseña requeridos" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT idUsuario, rol, nombre, apellido, correo, telefono, activo
       FROM Usuario
       WHERE correo = ? AND hashContrasena = ? AND activo = 1`,
      [correo, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos" });
    }

    const usuario = rows[0];
    const rolNombre = usuario.rol === 0 ? "Admin" : "Delegado";

    res.json({
      ok: true,
      usuario: {
        id:       usuario.idUsuario,
        nombre:   usuario.nombre,
        apellido: usuario.apellido,
        correo:   usuario.correo,
        telefono: usuario.telefono,
        rol:      usuario.rol,
        rolNombre,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Todas las defensas (Admin) — debe ir ANTES de /:idDelegado ──
app.get("/api/defensas/admin", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         d.idDefensa, d.fecha, d.lugar, d.estado,
         d.direccion, d.enlaceGoogleMaps, d.observaciones,
         pt.titulo,
         e.nombre AS nombreEstudiante, e.apellido AS apellidoEstudiante,
         ad.idAsignacion, ad.estado AS estadoAsignacion,
         u.nombre AS nombreDelegado, u.apellido AS apellidoDelegado,
         p.estado AS estadoPago
       FROM Defensa d
       JOIN PerfilTesis pt ON d.idPerfil = pt.idPerfil
       JOIN Estudiante e ON pt.idEstudiante = e.idEstudiante
       LEFT JOIN AsignacionDelegado ad ON d.idDefensa = ad.idDefensa
       LEFT JOIN Usuario u ON ad.idDelegado = u.idUsuario
       LEFT JOIN Pago p ON d.idDefensa = p.idDefensa
       ORDER BY d.fecha DESC`
    );
    res.json({ ok: true, defensas: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Defensas asignadas al delegado ─────────────────────────────
app.get("/api/defensas/:idDelegado", async (req, res) => {
  const { idDelegado } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT
         d.idDefensa,
         d.fecha,
         d.lugar,
         d.estado,
         d.direccion,
         d.enlaceGoogleMaps,
         d.observaciones,
         pt.titulo,
         e.nombre        AS nombreEstudiante,
         e.apellido      AS apellidoEstudiante,
         ad.idAsignacion,
         ad.estado       AS estadoAsignacion,
         p.estado        AS estadoPago
       FROM AsignacionDelegado ad
       JOIN Defensa        d  ON ad.idDefensa   = d.idDefensa
       JOIN PerfilTesis    pt ON d.idPerfil      = pt.idPerfil
       JOIN Estudiante     e  ON pt.idEstudiante = e.idEstudiante
       LEFT JOIN Pago      p  ON d.idDefensa     = p.idDefensa
       WHERE ad.idDelegado = ?
       ORDER BY d.fecha DESC`,
      [idDelegado]
    );
    res.json({ ok: true, defensas: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Todas las defensas (Admin) ─────────────────────────────────
app.get("/api/defensas", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         d.idDefensa,
         d.fecha,
         d.lugar,
         d.estado,
         pt.titulo,
         e.nombre   AS nombreEstudiante,
         e.apellido AS apellidoEstudiante
       FROM Defensa     d
       JOIN PerfilTesis pt ON d.idPerfil      = pt.idPerfil
       JOIN Estudiante  e  ON pt.idEstudiante = e.idEstudiante
       ORDER BY d.fecha DESC`
    );
    res.json({ ok: true, defensas: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));

// ── Actualizar estado de asignación (aceptar/rechazar) ─────────
app.put("/api/asignacion/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado, justificacion } = req.body;
  if (!estado) return res.status(400).json({ ok: false, mensaje: "Estado requerido" });
  try {
    await pool.query(
      "UPDATE AsignacionDelegado SET estado = ?, justificacion = ? WHERE idAsignacion = ?",
      [estado, justificacion || null, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Completar defensa (con archivos) ──────────────────────────
app.put("/api/asignacion/:id/completar",
  upload.fields([{ name: "imagen", maxCount: 1 }, { name: "pdf", maxCount: 1 }]),
  async (req, res) => {
  const { id } = req.params;
  const comentarios = req.body.comentarios || "";
  const files = req.files || {};
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  try {
    await pool.query(
      "UPDATE AsignacionDelegado SET estado = 'completada' WHERE idAsignacion = ?",
      [id]
    );
    const [rows] = await pool.query(
      "SELECT idDefensa FROM AsignacionDelegado WHERE idAsignacion = ?", [id]
    );
    if (rows.length > 0) {
      await pool.query(
        "UPDATE Defensa SET estado = 'completada' WHERE idDefensa = ?",
        [rows[0].idDefensa]
      );
      // Insertar fila por cada archivo subido
      const inserts = [];
      if (files.imagen?.[0]) inserts.push(`${baseUrl}/uploads/evidencias/${files.imagen[0].filename}`);
      if (files.pdf?.[0])    inserts.push(`${baseUrl}/uploads/evidencias/${files.pdf[0].filename}`);
      if (comentarios)       inserts.push(comentarios);
      for (const url of inserts) {
        await pool.query(
          "INSERT INTO Evidencia (idAsignacion, urlArchivo) VALUES (?, ?)",
          [id, url]
        );
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Cambiar contraseña ─────────────────────────────────────────
app.put("/api/usuario/:id/password", async (req, res) => {
  const { id } = req.params;
  const { actual, nueva } = req.body;
  if (!actual || !nueva)
    return res.status(400).json({ ok: false, mensaje: "Campos requeridos" });
  if (nueva.length < 6)
    return res.status(400).json({ ok: false, mensaje: "La nueva contraseña debe tener al menos 6 caracteres" });
  if (actual === nueva)
    return res.status(400).json({ ok: false, mensaje: "La nueva contraseña debe ser diferente a la actual" });
  try {
    const [rows] = await pool.query(
      "SELECT idUsuario FROM Usuario WHERE idUsuario = ? AND hashContrasena = ?",
      [id, actual]
    );
    if (rows.length === 0)
      return res.status(401).json({ ok: false, mensaje: "Contraseña actual incorrecta" });
    await pool.query(
      "UPDATE Usuario SET hashContrasena = ? WHERE idUsuario = ?",
      [nueva, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── ADMIN: Obtener todos los delegados ─────────────────
app.get("/api/admin/delegados", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT idUsuario, nombre, apellido, correo, telefono, activo FROM Usuario WHERE rol = 1"
    );
    res.json({ ok: true, delegados: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── ADMIN: Crear delegado ──────────────────────────────
app.post("/api/admin/delegados", async (req, res) => {
  const { nombre, apellido, correo, telefono, password } = req.body;
  if (!nombre?.trim() || !apellido?.trim() || !correo?.trim() || !password)
    return res.status(400).json({ ok: false, mensaje: "Todos los campos obligatorios son requeridos" });
  try {
    const [exist] = await pool.query("SELECT idUsuario FROM Usuario WHERE correo = ?", [correo.trim()]);
    if (exist.length > 0)
      return res.status(400).json({ ok: false, mensaje: "Ya existe un usuario con ese correo" });
    await pool.query(
      "INSERT INTO Usuario (rol, nombre, apellido, correo, telefono, hashContrasena) VALUES (1, ?, ?, ?, ?, ?)",
      [nombre.trim(), apellido.trim(), correo.trim(), telefono || null, password]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── ADMIN: Editar delegado ─────────────────────────────
app.put("/api/admin/delegados/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, correo, telefono, password } = req.body;
  try {
    const [exist] = await pool.query(
      "SELECT idUsuario FROM Usuario WHERE correo = ? AND idUsuario != ?", [correo?.trim(), id]
    );
    if (exist.length > 0)
      return res.status(400).json({ ok: false, mensaje: "Ese correo ya está en uso por otro usuario" });
    if (password) {
      await pool.query(
        "UPDATE Usuario SET nombre=?, apellido=?, correo=?, telefono=?, hashContrasena=? WHERE idUsuario=?",
        [nombre, apellido, correo, telefono || null, password, id]
      );
    } else {
      await pool.query(
        "UPDATE Usuario SET nombre=?, apellido=?, correo=?, telefono=? WHERE idUsuario=?",
        [nombre, apellido, correo, telefono || null, id]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Notificaciones usuario ─────────────────────────────
app.get("/api/usuario/:id/notificaciones", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT notificaciones FROM Usuario WHERE idUsuario = ?", [id]
    );
    res.json({ ok: true, notificaciones: rows[0]?.notificaciones ?? 1 });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put("/api/usuario/:id/notificaciones", async (req, res) => {
  const { id } = req.params;
  const { notificaciones } = req.body;
  try {
    await pool.query(
      "UPDATE Usuario SET notificaciones = ? WHERE idUsuario = ?", [notificaciones ? 1 : 0, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── ADMIN: Eliminar delegado ───────────────────────────
app.delete("/api/admin/delegados/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE Usuario SET activo = 0 WHERE idUsuario = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── ADMIN: Activar/Desactivar usuario ─────────────────
app.put("/api/admin/usuario/:id/activo", async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    await pool.query("UPDATE Usuario SET activo = ? WHERE idUsuario = ?", [activo ? 1 : 0, id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── ADMIN: Crear defensa completa ──────────────────────
app.post("/api/defensas", async (req, res) => {
  const { estudianteNombre, estudianteApellido, titulo, fecha, lugar,
          direccion, enlaceGoogleMaps, observaciones } = req.body;
  if (!estudianteNombre?.trim() || !estudianteApellido?.trim() || !titulo?.trim() || !fecha || !lugar?.trim())
    return res.status(400).json({ ok: false, error: "Faltan campos obligatorios" });
  if (new Date(fecha) < new Date())
    return res.status(400).json({ ok: false, error: "La fecha de la defensa no puede ser en el pasado" });
  try {
    const [estResult] = await pool.query(
      "INSERT INTO Estudiante (nombre, apellido) VALUES (?, ?)",
      [estudianteNombre, estudianteApellido]
    );
    const idEstudiante = estResult.insertId;

    const [perfResult] = await pool.query(
      "INSERT INTO PerfilTesis (idEstudiante, titulo) VALUES (?, ?)",
      [idEstudiante, titulo]
    );
    const idPerfil = perfResult.insertId;

    await pool.query(
      `INSERT INTO Defensa (idPerfil, fecha, lugar, direccion, enlaceGoogleMaps, observaciones, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
      [idPerfil, fecha, lugar, direccion || null, enlaceGoogleMaps || null, observaciones || null]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Asignar delegado a defensa ─────────────────────────
app.post("/api/defensas/:id/asignar", async (req, res) => {
  const { id } = req.params;
  const { idDelegado } = req.body;
  try {
    const [delegado] = await pool.query(
      "SELECT idUsuario FROM Usuario WHERE idUsuario = ? AND activo = 1 AND rol = 1", [idDelegado]
    );
    if (delegado.length === 0)
      return res.status(400).json({ ok: false, error: "El delegado no está activo o no existe" });
    // Verificar si ya existe asignación
    const [existing] = await pool.query(
      "SELECT idAsignacion FROM AsignacionDelegado WHERE idDefensa = ?", [id]
    );
    if (existing.length > 0) {
      await pool.query(
        "UPDATE AsignacionDelegado SET idDelegado = ?, estado = 'pendiente' WHERE idDefensa = ?",
        [idDelegado, id]
      );
    } else {
      await pool.query(
        "INSERT INTO AsignacionDelegado (idDefensa, idDelegado, estado) VALUES (?, ?, 'pendiente')",
        [id, idDelegado]
      );
    }
    // Notificar al delegado
    const [defensa] = await pool.query(
      `SELECT pt.titulo, e.nombre AS nombreEstudiante, e.apellido AS apellidoEstudiante
       FROM Defensa d
       JOIN PerfilTesis pt ON d.idPerfil = pt.idPerfil
       JOIN Estudiante e ON pt.idEstudiante = e.idEstudiante
       WHERE d.idDefensa = ?`, [id]
    );
    if (defensa.length > 0) {
      const d = defensa[0];
      await notificarUsuario(
        idDelegado,
        "Nueva defensa asignada",
        `${d.nombreEstudiante} ${d.apellidoEstudiante} - ${d.titulo}`
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Eliminar defensa ───────────────────────────────────
app.delete("/api/defensas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM Defensa WHERE idDefensa = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET pagos admin ────────────────────────────────────
app.get("/api/admin/pagos", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         p.idPago, p.monto, p.estado, p.fechaPago,
         d.idDefensa, d.fecha,
         e.nombre AS nombreEstudiante, e.apellido AS apellidoEstudiante,
         u.nombre AS nombreDelegado, u.apellido AS apellidoDelegado
       FROM Pago p
       JOIN Defensa d ON p.idDefensa = d.idDefensa
       JOIN PerfilTesis pt ON d.idPerfil = pt.idPerfil
       JOIN Estudiante e ON pt.idEstudiante = e.idEstudiante
       LEFT JOIN AsignacionDelegado ad ON d.idDefensa = ad.idDefensa
       LEFT JOIN Usuario u ON ad.idDelegado = u.idUsuario
       ORDER BY p.estado ASC, d.fecha DESC`
    );
    res.json({ ok: true, pagos: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Marcar pago como pagado ────────────────────────────
app.put("/api/admin/pagos/:id/pagar", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE Pago SET estado = 'pagado', fechaPago = NOW() WHERE idPago = ?", [id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET delegados con conteo de defensas ───────────────
// Actualiza el endpoint existente para incluir conteo
app.get("/api/admin/delegados/detalle", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         u.idUsuario, u.nombre, u.apellido, u.correo, u.telefono, u.activo,
         COUNT(ad.idAsignacion) AS defensasAsignadas
       FROM Usuario u
       LEFT JOIN AsignacionDelegado ad ON u.idUsuario = ad.idDelegado
       WHERE u.rol = 1
       GROUP BY u.idUsuario
       ORDER BY u.nombre ASC`
    );
    res.json({ ok: true, delegados: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// RECUPERACION DE CONTRASEÑA (código de 6 dígitos)
// ════════════════════════════════════════════════════════

// ── Solicitar código de recuperación ──────────────────
// El backend genera y guarda el código; el frontend lo envía por EmailJS
app.post("/api/recuperar-password", async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ ok: false, mensaje: "Correo requerido" });

  try {
    const [rows] = await pool.query(
      "SELECT idUsuario, nombre FROM Usuario WHERE correo = ? AND activo = 1",
      [correo]
    );

    if (rows.length === 0)
      return res.json({ ok: true, codigo: null, nombre: null });

    const usuario = rows[0];
    const codigo  = Math.floor(100000 + Math.random() * 900000).toString();
    const expira  = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `INSERT INTO ResetPassword (idUsuario, token, expira, usado)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE token = ?, expira = ?, usado = 0`,
      [usuario.idUsuario, codigo, expira, codigo, expira]
    );

    res.json({ ok: true, codigo, nombre: usuario.nombre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Verificar código y resetear contraseña ─────────────
app.post("/api/reset-password", async (req, res) => {
  const { correo, codigo, nuevaPassword } = req.body;
  if (!correo || !codigo || !nuevaPassword)
    return res.status(400).json({ ok: false, mensaje: "Datos incompletos" });

  try {
    const [rows] = await pool.query(
      `SELECT rp.idUsuario, rp.expira, rp.usado
       FROM ResetPassword rp
       JOIN Usuario u ON u.idUsuario = rp.idUsuario
       WHERE u.correo = ? AND rp.token = ?`,
      [correo, codigo]
    );

    if (rows.length === 0)
      return res.status(400).json({ ok: false, mensaje: "Código incorrecto" });

    const reset = rows[0];

    if (reset.usado)
      return res.status(400).json({ ok: false, mensaje: "Este código ya fue usado" });

    if (new Date() > new Date(reset.expira))
      return res.status(400).json({ ok: false, mensaje: "El código ha expirado" });

    await pool.query(
      "UPDATE Usuario SET hashContrasena = ? WHERE idUsuario = ?",
      [nuevaPassword, reset.idUsuario]
    );

    await pool.query(
      "UPDATE ResetPassword SET usado = 1 WHERE idUsuario = ?",
      [reset.idUsuario]
    );

    res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// NOTIFICACIONES PUSH
// ════════════════════════════════════════════════════════

// Clave pública VAPID para el frontend
app.get("/api/push/vapid-public-key", (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// Guardar suscripción de un dispositivo
app.post("/api/push/subscribe", async (req, res) => {
  const { idUsuario, subscription } = req.body;
  if (!idUsuario || !subscription) return res.status(400).json({ ok: false });
  const { endpoint, keys } = subscription;
  try {
    // Borrar todas las suscripciones previas del usuario y registrar la nueva
    await pool.query("DELETE FROM SuscripcionPush WHERE idUsuario = ?", [idUsuario]);
    await pool.query(
      "INSERT INTO SuscripcionPush (idUsuario, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)",
      [idUsuario, endpoint, keys.p256dh, keys.auth]
    );
    console.log(`[Push] Suscripción registrada para usuario ${idUsuario}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(`[Push] Error al guardar suscripción:`, err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Ver suscripciones guardadas (debug)
app.get("/api/push/subs/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;
  const [subs] = await pool.query(
    "SELECT idSuscripcion, endpoint, fechaRegistro FROM SuscripcionPush WHERE idUsuario = ?",
    [idUsuario]
  );
  res.json({ ok: true, total: subs.length, subs });
});

// Enviar push de prueba manualmente (debug)
app.post("/api/push/test/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const [subs] = await pool.query(
      "SELECT endpoint, p256dh, auth FROM SuscripcionPush WHERE idUsuario = ?",
      [idUsuario]
    );
    if (subs.length === 0) return res.json({ ok: false, msg: "Sin suscripciones para este usuario" });
    const resultados = [];
    for (const sub of subs) {
      const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
      try {
        await webpush.sendNotification(pushSub, JSON.stringify({ titulo: "Prueba Push", cuerpo: "Si ves esto, el push funciona" }), { urgency: "high", TTL: 60 });
        resultados.push({ endpoint: sub.endpoint.slice(0, 40), resultado: "OK" });
      } catch (e) {
        resultados.push({ endpoint: sub.endpoint.slice(0, 40), resultado: `ERROR ${e.statusCode}: ${e.message}` });
        if (e.statusCode === 410 || e.statusCode === 404) {
          await pool.query("DELETE FROM SuscripcionPush WHERE endpoint = ?", [sub.endpoint]).catch(() => {});
        }
      }
    }
    res.json({ ok: true, resultados });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Función interna para enviar push + guardar notificación in-app
async function notificarUsuario(idUsuario, titulo, cuerpo) {
  try {
    await pool.query(
      "INSERT INTO Notificacion (idUsuario, titulo, mensaje) VALUES (?, ?, ?)",
      [idUsuario, titulo, cuerpo]
    );
    console.log(`[Notif] Guardada para usuario ${idUsuario}: ${titulo}`);
  } catch (err) {
    console.error(`[Notif] Error al guardar en BD:`, err.message);
  }
  try {
    const [subs] = await pool.query(
      "SELECT endpoint, p256dh, auth FROM SuscripcionPush WHERE idUsuario = ?",
      [idUsuario]
    );
    console.log(`[Push] ${subs.length} suscripcion(es) para usuario ${idUsuario}`);
    for (const sub of subs) {
      const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
      try {
        await webpush.sendNotification(pushSub, JSON.stringify({ titulo, cuerpo }), { urgency: "high", TTL: 60 });
        console.log(`[Push] Enviado OK a ${sub.endpoint.slice(0, 40)}`);
      } catch (e) {
        console.error(`[Push] Error ${e.statusCode} para usuario ${idUsuario}: ${e.message}`);
        if (e.statusCode === 410 || e.statusCode === 404) {
          await pool.query("DELETE FROM SuscripcionPush WHERE endpoint = ?", [sub.endpoint]).catch(() => {});
          console.log(`[Push] Suscripción expirada eliminada`);
        }
      }
    }
  } catch (err) {
    console.error(`[Push] Error consultando suscripciones:`, err.message);
  }
}