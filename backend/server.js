require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mysql   = require("mysql2/promise");
const cors    = require("cors");

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

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
         pt.titulo,
         e.nombre   AS nombreEstudiante,
         e.apellido AS apellidoEstudiante,
         ad.estado  AS estadoAsignacion
       FROM AsignacionDelegado ad
       JOIN Defensa        d  ON ad.idDefensa   = d.idDefensa
       JOIN PerfilTesis    pt ON d.idPerfil      = pt.idPerfil
       JOIN Estudiante     e  ON pt.idEstudiante = e.idEstudiante
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

app.listen(5000, "0.0.0.0", () => console.log("Backend corriendo en http://localhost:5000"));

// ── Actualizar estado de asignación (aceptar/rechazar) ─────────
app.put("/api/asignacion/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado, justificacion } = req.body;
  try {
    await pool.query(
      "UPDATE AsignacionDelegado SET estado = ? WHERE idAsignacion = ?",
      [estado, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Completar defensa ──────────────────────────────────────────
app.put("/api/asignacion/:id/completar", async (req, res) => {
  const { id } = req.params;
  const { comentarios } = req.body;
  try {
    await pool.query(
      "UPDATE AsignacionDelegado SET estado = 'completada' WHERE idAsignacion = ?",
      [id]
    );
    // Obtener idDefensa
    const [rows] = await pool.query(
      "SELECT idDefensa FROM AsignacionDelegado WHERE idAsignacion = ?", [id]
    );
    if (rows.length > 0) {
      await pool.query(
        "UPDATE Defensa SET estado = 'completada' WHERE idDefensa = ?",
        [rows[0].idDefensa]
      );
      // Insertar evidencia con comentario si hay
      if (comentarios) {
        await pool.query(
          "INSERT INTO Evidencia (idAsignacion, urlArchivo) VALUES (?, ?)",
          [id, comentarios]
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
  try {
    await pool.query(
      "INSERT INTO Usuario (rol, nombre, apellido, correo, telefono, hashContrasena) VALUES (1, ?, ?, ?, ?, ?)",
      [nombre, apellido, correo, telefono || null, password]
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
  const { estudianteNombre, estudianteApellido, titulo, fecha, lugar } = req.body;
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
      "INSERT INTO Defensa (idPerfil, fecha, lugar, estado) VALUES (?, ?, ?, 'pendiente')",
      [idPerfil, fecha, lugar]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET defensas con delegado asignado (Admin) ─────────
// Reemplaza el endpoint GET /api/defensas existente con uno mejorado
app.get("/api/admin/defensas", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         d.idDefensa, d.fecha, d.lugar, d.estado,
         pt.titulo,
         e.nombre AS nombreEstudiante, e.apellido AS apellidoEstudiante,
         ad.idAsignacion, ad.estado AS estadoAsignacion,
         u.nombre AS nombreDelegado, u.apellido AS apellidoDelegado
       FROM Defensa d
       JOIN PerfilTesis pt ON d.idPerfil = pt.idPerfil
       JOIN Estudiante e ON pt.idEstudiante = e.idEstudiante
       LEFT JOIN AsignacionDelegado ad ON d.idDefensa = ad.idDefensa
       LEFT JOIN Usuario u ON ad.idDelegado = u.idUsuario
       ORDER BY d.fecha DESC`
    );
    res.json({ ok: true, defensas: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Asignar delegado a defensa ─────────────────────────
app.post("/api/defensas/:id/asignar", async (req, res) => {
  const { id } = req.params;
  const { idDelegado } = req.body;
  try {
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