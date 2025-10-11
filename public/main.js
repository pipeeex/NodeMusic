async function obtenerMetadata() {
    const url = document.getElementById("url").value.trim();
    if (!url) return alert("Por favor, ingresa una URL de YouTube");

    document.getElementById("info").innerText = "⏳ Obteniendo información...";

    try {
        const res = await fetch("/metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });

        if (!res.ok) throw new Error("Error al obtener metadata");

        const data = await res.json();

        document.getElementById("info").innerText =
            `🎵 Título: ${data.title}\n👤 Artista: ${data.artist}\n💿 Álbum: ${data.album}`;

        // guardamos el último link y metadatos globalmente
        window.lastData = { ...data, url };

        document.getElementById("descargar").innerHTML = `
        <button id="btnDescargar">Descargar MP3</button>
      `;

        document.getElementById("btnDescargar").onclick = descargar;
    } catch (err) {
        console.error(err);
        document.getElementById("info").innerText = "❌ Error al obtener metadata";
    }
}

async function descargar() {
    const data = window.lastData;
    if (!data?.url) {
        alert("Primero obtén la información del video.");
        return;
    }

    document.getElementById("descargar").innerText = "⬇️ Preparando descarga...";

    try {
        // Enviamos los datos al backend para registrar la descarga
        const res = await fetch("/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        
        if (!res.ok) throw new Error("Error iniciando descarga");

        // ✅ En lugar de manejar el blob, abrimos una URL de descarga directa
        const fileURL = `/download?title=${encodeURIComponent(data.title)}`;
        window.location.href = fileURL;

        document.getElementById("descargar").innerText = "✅ Descarga iniciada";
    } catch (err) {
        console.error(err);
        document.getElementById("descargar").innerText = "❌ Error en la descarga";
    }
}
