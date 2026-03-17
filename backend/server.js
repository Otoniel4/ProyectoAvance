require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mysql   = require("mysql2/promise");
const cors    = require("cors");

const app = express();
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://192.168.1.9:3000"
  ]
}));
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

app.listen(5000, () => console.log(" Backend corriendo en http://localhost:5000"));

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