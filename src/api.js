export const API = {
  leer: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cb308f7c39e64f98abd933ffe0635ab8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PNInfVa9dTDZpAn3R1jKn4r4W24-AlZRgLzSr4sp13Y",
  crearProyecto: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0b0a66ef75bd47d493a17717efe321e0/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=LJ96twTgG06QrD4V_Wi4LGjdKZC6atCyDGs5ZYty8L8",
  editarProyecto: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d394039fdc7f48738d735876f868341f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=tAES6z_yGn0LSuvGXWr_hyjJON4GAkF9xvViuTrGZB8",
  crearAvance: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cf34aec0e4a0421b9d01db83ce17818c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wVFuDJh2W6xpWF-70hcMnA4zhasDoafe2yFunWe8FbM",
  crearContrato: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7c9953ec484d488798d9289f9f1531a6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DWZDZC_-STNfCqg2z14mIqMSofaZoSUJl8c3FIm5qBk",
  crearPago: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/61fb6ce094944cdb8a58bfbae6e49a42/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qxGaJBSMIyZWFsPXpo7mjIb3n4rccrDHJjbbAeKtHqQ",
};

/* ─── GitHub CDN ─── */
const GH_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GH_REPO = "El-Trigal/portfolio-fotos";
const GH_BRANCH = "main";

function slugify(name) {
  return name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 60);
}

async function resizeToBase64(file, maxPx = 1200, maxBytes = 900 * 1024) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxPx || h > maxPx) { const r = Math.min(maxPx / w, maxPx / h); w = Math.round(w * r); h = Math.round(h * r); }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        let q = 0.85, data = canvas.toDataURL("image/jpeg", q);
        while (data.length * 0.75 > maxBytes && q > 0.3) { q -= 0.1; data = canvas.toDataURL("image/jpeg", q); }
        resolve(data.split(",")[1]);
      };
      img.onerror = reject; img.src = e.target.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

export async function subirFotoGithub(file, folder) {
  const base64 = await resizeToBase64(file);
  const fileName = `${Date.now()}-${slugify(file.name)}.jpg`;
  const path = `${folder}/${fileName}`;
  const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { "Authorization": `token ${GH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: `foto: ${fileName}`, content: base64, branch: GH_BRANCH }),
  });
  if (!res.ok) { const txt = await res.text(); throw new Error(`GitHub ${res.status}: ${txt}`); }
  return `https://raw.githubusercontent.com/${GH_REPO}/${GH_BRANCH}/${path}`;
}

function stripEmpty(obj) {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined && v !== "") clean[k] = v;
  }
  return clean;
}

async function apiCall(url, method = "GET", data = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  // Power Automate write flows devuelven {"ok":true}, no un body con ID
  const text = await res.text();
  try { return JSON.parse(text); } catch { return {}; }
}

export async function loadAll() {
  const raw = await apiCall(API.leer);
  // Transform SharePoint list items into app format
  const proyectos = (raw.proyectos || []).map(p => ({
    id: p.ID,
    name: p.Title || p.Nombre || "",
    description: p.Descripcion || "",
    responsible: p.Responsable || "",
    startDate: p.FechaInicio ? p.FechaInicio.split("T")[0] : "",
    estimatedEnd: p.FechaEstimadaFin ? p.FechaEstimadaFin.split("T")[0] : "",
    budget: p.Presupuesto || null,
    status: p.Estado?.Value || p.Estado || "En curso",
    phase: p.Fase?.Value || p.Fase || "Ideación",
    sede: p.Sede || "",
    linkBrightIdea: p.LinkBrightIdea || "",
    fotoPrincipal: p.FotoPrincipal || "",
    innovationType: p.TipoInnovacion?.Value || p.TipoInnovacion || "Otro",
  }));

  const avances = (raw.avances || []).map(a => ({
    id: a.ID,
    proyectoId: a.ProyectoID,
    date: a.Fecha ? a.Fecha.split("T")[0] : "",
    title: a.Title || a.TituloAvance || "",
    description: a.Descripcion || "",
    nextStep: a.ProximoPaso || "",
    registeredBy: a.RegistradoPor || "",
    fotoEvidencia: a.FotoEvidencia || "",
  }));

  const contratos = (raw.contratos || []).map(c => ({
    id: c.ID,
    proyectoId: c.ProyectoID,
    provider: c.Title || c.Proveedor || "",
    concept: c.Concepto || "",
    value: c.Valor || 0,
  }));

  const pagos = (raw.pagos || []).map(p => ({
    id: p.ID,
    contratoId: Number(p.ContratoID),
    date: p.Fecha ? p.Fecha.split("T")[0] : "",
    amount: p.Monto || 0,
    note: p.Nota || p.Title || "",
  }));

  // Assemble: attach avances and contracts (with payments) to each project
  return proyectos.map(proj => ({
    ...proj,
    advances: avances
      .filter(a => a.proyectoId === proj.id)
      .sort((a, b) => b.date.localeCompare(a.date)),
    contracts: contratos
      .filter(c => c.proyectoId === proj.id)
      .map(c => ({
        ...c,
        payments: pagos
          .filter(p => p.contratoId === Number(c.id))
          .sort((a, b) => b.date.localeCompare(a.date)),
      })),
  }));
}

export async function crearProyecto(data) {
  return apiCall(API.crearProyecto, "POST", stripEmpty({
    nombre: data.name,
    descripcion: data.description,
    responsable: data.responsible,
    fechaInicio: data.startDate,
    fechaEstimadaFin: data.estimatedEnd,
    presupuesto: data.budget,
    estado: data.status,
    fase: data.phase,
    sede: data.sede,
    linkBrightIdea: data.linkBrightIdea,
    fotoPrincipal: data.fotoPrincipal,
    tipoInnovacion: data.innovationType,
  }));
}

export async function editarProyecto(data) {
  return apiCall(API.editarProyecto, "POST", stripEmpty({
    id: data.id,
    nombre: data.name,
    descripcion: data.description,
    responsable: data.responsible,
    fechaEstimadaFin: data.estimatedEnd,
    presupuesto: data.budget,
    estado: data.status,
    fase: data.phase,
    sede: data.sede,
    linkBrightIdea: data.linkBrightIdea,
    fotoPrincipal: data.fotoPrincipal,
    tipoInnovacion: data.innovationType,
  }));
}

export async function crearAvance(proyectoId, data) {
  return apiCall(API.crearAvance, "POST", stripEmpty({
    proyectoId,
    titulo: data.title,
    descripcion: data.description,
    proximoPaso: data.nextStep,
    fecha: data.date,
    registradoPor: data.registeredBy,
    fotoEvidencia: data.fotoEvidencia,
  }));
}


export async function crearContrato(proyectoId, data) {
  return apiCall(API.crearContrato, "POST", {
    proyectoId,
    proveedor: data.provider,
    concepto: data.concept,
    valor: data.value,
  });
}

export async function crearPago(contratoId, data) {
  return apiCall(API.crearPago, "POST", {
    contratoId,
    fecha: data.date,
    monto: data.amount,
    nota: data.note,
  });
}
