const API =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://midescargador.onrender.com";
; // cambia si usas otro dispositivo

function mostrarLoader(texto) {
    const loader = document.getElementById("loader-container");
    const text = document.getElementById("loader-text");
    const progress = document.getElementById("progress");
    const percent = document.getElementById("progress-percent");
  
    text.textContent = texto;
    loader.style.display = "block";
    progress.style.width = "0%";
    percent.textContent = "0%";
  
    // Simulación de carga visual progresiva
    let simulatedProgress = 0;
    const interval = setInterval(() => {
      if (simulatedProgress < 95) {
        simulatedProgress += Math.random() * 5; // sube poco a poco
        progress.style.width = `${simulatedProgress}%`;
        percent.textContent = `${Math.floor(simulatedProgress)}%`;
      }
    }, 200);
    loader.dataset.interval = interval;
}

function ocultarLoader() {
    const loader = document.getElementById("loader-container");
    const progress = document.getElementById("progress");
    const percent = document.getElementById("progress-percent");
  
    // Finaliza animación al 100%
    progress.style.width = "100%";
    percent.textContent = "100%";
  
    clearInterval(loader.dataset.interval);
    setTimeout(() => {
      loader.style.display = "none";
    }, 600);
  }
  

async function obtenerMetadata() {
  const url = document.getElementById("url").value.trim();
  if (!url) return alert("⚠️ Por favor, pega un link de YouTube.");

  mostrarLoader("🎧 Obteniendo información...");
  document.getElementById("info").style.display = "none";

  try {
    const res = await fetch(`${API}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    ocultarLoader();

    if (data.error) throw new Error(data.error);

    document.getElementById("info").style.display = "block";
    document.getElementById("info").innerHTML = `
      <img src="${data.thumbnail}" alt="Portada">
      <h2>${data.title}</h2>
      <p><b>Artista:</b> ${data.artist}</p>
      <p><b>Álbum:</b> ${data.album}</p>
      <button onclick="descargarCancion('${url}', '${data.title}', '${data.artist}', '${data.album}', '${data.thumbnail}')">
        Descargar MP3
      </button>
    `;
  } catch (err) {
    ocultarLoader();
    alert("❌ Error al obtener metadata.");
    console.error(err);
  }
}

// 🚀 Descarga con barra de progreso visible
async function descargarCancion(url, title, artist, album, thumbnail) {
    mostrarLoader("⬇️ Descargando canción...");
  
    try {
      const res = await fetch(`${API}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, artist, album, thumbnail }),
      });
  
      if (!res.ok) throw new Error("Error en la descarga");
  
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${title}.mp3`;
      link.click();
  
      ocultarLoader();
    } catch (err) {
      ocultarLoader();
      alert("❌ Error al descargar el archivo.");
      console.error(err);
    }
  }

  
  
