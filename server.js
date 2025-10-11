import express from "express";
import cors from "cors";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import nodeID3 from "node-id3";
import os from "os";

const app = express();
const exec = promisify(execFile);
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const OUTPUT_DIR = path.join(process.cwd(), "downloads");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

async function getVideoInfo(url) {
  const { stdout } = await exec("yt-dlp", [
    "-j", // Devuelve JSON con la metadata
    url
  ]);
  return JSON.parse(stdout);
}

app.post("/metadata", async (req, res) => {
  try {
    const { url } = req.body;
    console.log("📩 URL recibida:", url);

    const info = await getVideoInfo(url);

    const data = {
      title: info.title,
      artist: info.artist || info.uploader || "Desconocido",
      album: info.album || info.playlist_title || "N/A",
      thumbnail: info.thumbnail,
    };

    console.log("🎵 Metadata:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Error obteniendo metadata:", err.message);
    res.status(500).json({ error: "Error al obtener metadata" });
  }
});

app.post("/download", async (req, res) => {
  try {
    const { url, title, artist, album, thumbnail } = req.body;
    const safeTitle = title.replace(/[^\w\s-]/g, ""); // limpiar caracteres raros
    const outputPath = path.join(OUTPUT_DIR, `${safeTitle}.mp3`);

    console.log("⬇️ Descargando:", safeTitle);

    await exec("yt-dlp", [
      "-x",
      "--audio-format", "mp3",
      "-o", outputPath.replace(".mp3", ".%(ext)s"),
      url,
    ]);

    if (fs.existsSync(outputPath)) {
      // Descargar portada y agregar metadatos
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

      // Enviar el archivo como descarga al cliente
      res.download(outputPath, `${safeTitle}.mp3`, (err) => {
        if (err) console.error("❌ Error al enviar archivo:", err);
        else console.log("📤 Enviado correctamente.");
      });
    } else {
      res.status(404).json({ error: "Archivo no encontrado" });
    }
  } catch (err) {
    console.error("❌ Error al descargar:", err.message);
    res.status(500).json({ error: "Error en la descarga" });
  }
});
app.get("/download", (req, res) => {
  const title = req.query.title;
  if (!title) return res.status(400).send("Título no especificado");

  const safeTitle = title.replace(/[^\w\s-]/g, "");
  const filePath = path.join(OUTPUT_DIR, `${safeTitle}.mp3`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Archivo no encontrado");
  }

  console.log(`📤 Enviando archivo directo: ${filePath}`);
  res.download(filePath, `${safeTitle}.mp3`);
});
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
