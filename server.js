import express from "express";
import cors from "cors";
import youtubedl from "yt-dlp-exec";
import fs from "fs";
import path from "path";
import nodeID3 from "node-id3";
import os from "os";
import sanitize from "sanitize-filename";

const app = express();
const PORT = 3000;

app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(express.static("public"));

const OUTPUT_DIR = path.join(process.cwd(), "downloads");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

async function getVideoInfo(url) {
  const info = await youtubedl(url, { dumpSingleJson: true });
  return info;
}

// 🎵 Obtener metadata
// 🎵 Obtener metadata
app.post("/metadata", async (req, res) => {
  try {
    const { url } = req.body;
    console.log("📩 URL recibida:", url);

    // Ejecuta yt-dlp con salida limpia
    const { stdout } = await execAsync(`yt-dlp --no-warnings --no-playlist -j "${url}"`);
    const info = JSON.parse(stdout);

    // Intenta obtener título, artista y álbum desde múltiples fuentes
    let title =
      info.track ||
      info.title ||
      info.fulltitle ||
      info.alt_title ||
      "Título desconocido";

    let artist =
      info.artist  ||
      info.channel ||
      "Artista desconocido";

    const album =
      info.album ||
      "Unknown";

    const thumbnail = info.thumbnail || info.thumbnails?.[0]?.url || null;

    // 🎧 Detección automática "Artista - Canción"
    if (title.includes(" - ")) {
      const [possibleArtist, possibleTitle] = title.split(" - ");
      if (!artist || artist === "Artista desconocido") {
        artist = possibleArtist.trim();
      }
      title = possibleTitle.trim();
    }

    const data = { title, artist, album, thumbnail };

    console.log("🎶 Metadata obtenida:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Error obteniendo metadata:", err.message);
    res.status(500).json({ error: "Error al obtener metadata" });
  }
});


// 🎧 Descargar canción en máxima calidad (320kbps)
app.post("/download", async (req, res) => {
  try {
    const { url, title, artist, album, thumbnail } = req.body;
    console.log("⬇️ Descargando:", title);

    // 🔤 Limpia el título solo para el nombre del archivo
    const safeTitle = sanitize(
      title.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
    ).replace(/[^\w\s-]/g, ""); // quita caracteres raros

    const outputPath = path.join(OUTPUT_DIR, `${safeTitle}.mp3`);

    // 🎵 Descarga en máxima calidad (320kbps)
    const command = `yt-dlp -f "bestaudio" -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${url}"`;
    console.log("🎧 Ejecutando:", command);
    await execAsync(command);

    if (!fs.existsSync(outputPath)) {
      return res.status(404).json({ error: "Archivo no encontrado después de descarga" });
    }

    // 🖼️ Descargar portada y agregar metadatos
    const coverPath = path.join(OUTPUT_DIR, `${safeTitle}.jpg`);
    const response = await fetch(thumbnail);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(coverPath, buffer);

    nodeID3.update(
      { title, artist, album, APIC: coverPath },
      outputPath
    );
    fs.unlinkSync(coverPath);

    console.log("✅ Listo, enviando al navegador...");

    // 📤 Enviar el archivo al cliente
    res.download(outputPath, `${safeTitle}.mp3`, (err) => {
      if (err) console.error("❌ Error al enviar archivo:", err);
      else console.log("📤 Enviado correctamente.");
    });

  } catch (err) {
    console.error("❌ Error en descarga:", err.message);
    res.status(500).json({ error: "Error al descargar el audio" });
  }
});

// 📂 Endpoint de descarga directa
app.get("/download", (req, res) => {
  const title = req.query.title;
  if (!title) return res.status(400).send("Título no especificado");

  const safeTitle = sanitize(
    title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  ).replace(/[^\w\s-]/g, "");

  const filePath = path.join(OUTPUT_DIR, `${safeTitle}.mp3`);
  if (!fs.existsSync(filePath)) return res.status(404).send("Archivo no encontrado");

  console.log(`📤 Enviando archivo directo: ${filePath}`);
  res.download(filePath, `${safeTitle}.mp3`);
});

// 🌐 Obtener IP local
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

app.listen(PORT, () => {
  console.log(`✅ Servidor disponible en:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Red local: http://${getLocalIP()}:${PORT}`);
});
