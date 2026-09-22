// Helpers bloques estructurados v2
export function nuevoBloque(tipo) {
  const id = `b_${Math.random().toString(36).slice(2, 9)}`;
  const base = { id, tipo, data: {} };
  if (tipo === "parrafo") base.data = { html: "" };
  if (tipo === "encabezado") base.data = { nivel: 2, texto: "" };
  if (tipo === "imagen") base.data = { url: "", epigrafe: "", alt: "", posicion: "full" };
  if (tipo === "paso") base.data = { numero: 1, titulo_paso: "", imagen_url: "", texto: "" };
  if (tipo === "cita") base.data = { texto: "", autor: "" };
  if (tipo === "lista") base.data = { estilo: "ul", items: [""] };
  if (tipo === "separador") base.data = {};
  return base;
}

export function bloquesDesdeContenido(contenido) {
  if (!contenido) return [nuevoBloque("parrafo")];
  return [{ id: `b_${Math.random().toString(36).slice(2, 9)}`, tipo: "parrafo", data: { html: contenido } }];
}

export function htmlDesdeBloques(bloques) {
  // fallback simple para preview local (el server deriva con bleach)
  return (bloques || []).map(b => {
    const d = b.data || {};
    if (b.tipo === "parrafo") return d.html || "";
    if (b.tipo === "encabezado") return `<h${d.nivel}>${d.texto}</h${d.nivel}>`;
    if (b.tipo === "imagen") return `<figure><img src="${d.url}" alt="${d.alt||''}" /><figcaption>${d.epigrafe||''}</figcaption></figure>`;
    if (b.tipo === "paso") return `<div><strong>Paso ${d.numero}</strong> ${d.titulo_paso}<br/>${d.texto}<br/><img src="${d.imagen_url}" /></div>`;
    if (b.tipo === "cita") return `<blockquote>${d.texto} ${d.autor? '— '+d.autor:''}</blockquote>`;
    if (b.tipo === "lista") return `<${d.estilo}>${(d.items||[]).map(i=>`<li>${i}</li>`).join('')}</${d.estilo}>`;
    if (b.tipo === "separador") return `<hr/>`;
    return "";
  }).join("\n");
}
