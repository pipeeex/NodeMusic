# 🎵 YouTube MP3 Downloader (versión local)

Aplicación web que permite **obtener metadatos de un video de YouTube** (título, artista, álbum, portada, etc.) y **descargar su audio en formato MP3** con toda esa información incrustada en el archivo final.

> ⚠️ Este proyecto está en desarrollo.  

---

## 🚀 Características

- ✅ Analiza un enlace de YouTube y obtiene su información básica.  
- ✅ Muestra título, artista, miniatura y álbum antes de descargar.  
- ✅ Descarga el audio en formato `.mp3` con portada y metadatos ID3.  
- ✅ Funciona desde el navegador (PC o celular).  
- ✅ Soporta ejecución local (Node.js + Express).  

---

## 🛠️ Tecnologías usadas

- **Node.js 18+**
- **Express**
- **yt-dlp** (para procesar y extraer audio)
- **FFmpeg** (para conversión a MP3)
- **node-id3** (para insertar metadatos)
- **HTML + JavaScript (frontend)**

---

##  Pendiente por mejorar

- 🧹 Borrar archivos temporales después de enviarlos.

- 💾 Posible integración con una base de datos o cola de tar
