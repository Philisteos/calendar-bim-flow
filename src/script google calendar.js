/**
 * SISTEMA DE TRAZABILIDAD DE EVENTOS DE TRABAJO
 * Versión: 2.0 - Tareas + Updates + Cierre (TaskID + microeventos)
 */

// CONFIGURACIÓN GLOBAL
const HOJA_CONFIG = "Config";

const EVENTO_TIPO = {
  CREAR: "CREAR",
  UPDATE: "UPDATE",
  CIERRE: "CIERRE"
};

const CONFIG_KEYS = {
  DURACION_TAREA_MIN: "DURACION_TAREA_MINUTOS",
  DURACION_UPDATE_MIN: "DURACION_UPDATE_MINUTOS",
  DURACION_CIERRE_MIN: "DURACION_CIERRE_MINUTOS",
  CALENDARIO_ID: "CALENDARIO_ID",
  ENVIAR_NOTIFICACION: "ENVIAR_NOTIFICACION",
  COLOR_TAREA: "COLOR_TAREA",
  COLOR_UPDATE: "COLOR_UPDATE",
  COLOR_CIERRE: "COLOR_CIERRE",

  HOJA_CREAR: "HOJA_RESPUESTAS_CREAR",
  HOJA_UPDATE: "HOJA_RESPUESTAS_UPDATE",
  HOJA_CIERRE: "HOJA_RESPUESTAS_CIERRE",

  FORM_URL_UPDATE: "FORM_URL_UPDATE",
  FORM_URL_CIERRE: "FORM_URL_CIERRE",
  FORM_PLACEHOLDER_TASKID: "FORM_PLACEHOLDER_TASKID"
};

function esVerdadero_(valor) {
  return valor === true || normalizarTexto(valor).toUpperCase() === "TRUE";
}

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return "";
  // En Sheets a veces llegan números/boolean; convertir a string de forma segura
  return String(valor);
}

function normalizarTextoTrim(valor) {
  return normalizarTexto(valor).trim();
}

function normalizarClaveHeader_(valor) {
  return normalizarTextoTrim(valor)
    .toLowerCase()
    // Quitar tildes/diacríticos para tolerar “Código” vs “Codigo”, etc.
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Quitar espacios para tolerar variantes
    .replace(/\s+/g, "");
}

function pareceHoraDeSheets_(valor) {
  // Respuestas de preguntas tipo "Hora" en Forms suelen llegar como Date con base 1899/1900.
  if (!(valor instanceof Date)) return false;
  const y = valor.getFullYear();
  if (y >= 2000) return false;
  // Si tiene componente de hora/minuto, es altamente probable que sea una "hora".
  return valor.getHours() !== 0 || valor.getMinutes() !== 0 || valor.getSeconds() !== 0;
}

function formatFecha(fecha) {
  if (!fecha) return "";
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return normalizarTexto(fecha);
  const tz = Session.getScriptTimeZone();
  return Utilities.formatDate(d, tz, "yyyy-MM-dd HH:mm");
}

function generarTaskId() {
  const tz = Session.getScriptTimeZone();
  const stamp = Utilities.formatDate(new Date(), tz, "yyyyMMdd");
  const shortUuid = Utilities.getUuid().split("-")[0].toUpperCase();
  return "T-" + stamp + "-" + shortUuid;
}

function urlConTaskId(urlPlantilla, placeholder, taskId) {
  const plantilla = normalizarTexto(urlPlantilla);
  if (!plantilla) return "";
  const ph = placeholder && placeholder !== "" ? placeholder : "{TASK_ID}";
  // En Google Forms el placeholder suele quedar URL-encoded (%7B...%7D) dentro del link.
  // Reemplazamos tanto el placeholder crudo como su versión encoded.
  const phEncoded = encodeURIComponent(ph);
  const taskEncoded = encodeURIComponent(taskId);
  return plantilla.split(ph).join(taskEncoded).split(phEncoded).join(taskEncoded);
}

function obtenerHojaConfig_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(HOJA_CONFIG);
}

function leerConfigComoMapa_() {
  const hoja = obtenerHojaConfig_();
  const mapa = {};
  if (!hoja) return mapa;
  const lastRow = hoja.getLastRow();
  if (lastRow < 2) return mapa;
  const valores = hoja.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < valores.length; i++) {
    const key = normalizarTextoTrim(valores[i][0]);
    const val = valores[i][1];
    if (key) mapa[key] = val;
  }
  return mapa;
}

function obtenerConfig() {
  const m = leerConfigComoMapa_();
  return {
    duracionTareaMinutos: parseInt(m[CONFIG_KEYS.DURACION_TAREA_MIN]) || 60,
    duracionUpdateMinutos: parseInt(m[CONFIG_KEYS.DURACION_UPDATE_MIN]) || 15,
    duracionCierreMinutos: parseInt(m[CONFIG_KEYS.DURACION_CIERRE_MIN]) || 15,
    calendarioId: normalizarTextoTrim(m[CONFIG_KEYS.CALENDARIO_ID]) || "primary",
    enviarNotificacion: m[CONFIG_KEYS.ENVIAR_NOTIFICACION] === true || normalizarTexto(m[CONFIG_KEYS.ENVIAR_NOTIFICACION]).toUpperCase() === "TRUE",
    colorTarea: parseInt(m[CONFIG_KEYS.COLOR_TAREA]) || 1,
    colorUpdate: parseInt(m[CONFIG_KEYS.COLOR_UPDATE]) || 5,
    colorCierre: parseInt(m[CONFIG_KEYS.COLOR_CIERRE]) || 11,
    hojaCrear: normalizarTextoTrim(m[CONFIG_KEYS.HOJA_CREAR]) || "Respuestas de formulario 1",
    hojaUpdate: normalizarTextoTrim(m[CONFIG_KEYS.HOJA_UPDATE]) || "Respuestas UPDATE",
    hojaCierre: normalizarTextoTrim(m[CONFIG_KEYS.HOJA_CIERRE]) || "Respuestas CIERRE",
    formUrlUpdate: normalizarTextoTrim(m[CONFIG_KEYS.FORM_URL_UPDATE]),
    formUrlCierre: normalizarTextoTrim(m[CONFIG_KEYS.FORM_URL_CIERRE]),
    formPlaceholderTaskId: normalizarTextoTrim(m[CONFIG_KEYS.FORM_PLACEHOLDER_TASKID]) || "{TASK_ID}"
  };
}

function obtenerCalendario_(config) {
  let calendario;
  if (config.calendarioId === "primary") {
    calendario = CalendarApp.getDefaultCalendar();
  } else {
    calendario = CalendarApp.getCalendarById(config.calendarioId);
  }
  if (!calendario) throw new Error("No se pudo acceder al calendario");
  return calendario;
}

function indicesEncabezados_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  const encabezados = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  for (let c = 0; c < encabezados.length; c++) {
    const k = normalizarTextoTrim(encabezados[c]);
    if (k) {
      const col = c + 1;
      map[k] = col;
      map[k.toUpperCase()] = col;
      const kNoSpaces = k.replace(/\s+/g, "");
      map[kNoSpaces] = col;
      map[kNoSpaces.toUpperCase()] = col;

      // Variante robusta: minúsculas + sin tildes + sin espacios
      const kNorm = normalizarClaveHeader_(k);
      if (kNorm) map[kNorm] = col;
    }
  }
  return map;
}

function encontrarColumnaPorHeaderFuzzy_(sheet, posiblesHeaders) {
  if (!posiblesHeaders || posiblesHeaders.length === 0) return null;
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return null;

  const encabezados = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const encabezadosNorm = encabezados.map(h => normalizarClaveHeader_(h));

  let mejorCol = null;
  let mejorScore = -1;

  for (let i = 0; i < posiblesHeaders.length; i++) {
    const candNorm = normalizarClaveHeader_(posiblesHeaders[i]);
    if (!candNorm) continue;

    for (let c = 0; c < encabezadosNorm.length; c++) {
      const hNorm = encabezadosNorm[c];
      if (!hNorm) continue;

      let score = -1;
      if (hNorm === candNorm) score = 100;
      else if (hNorm.indexOf(candNorm) >= 0) score = 80;
      else if (candNorm.indexOf(hNorm) >= 0) score = 60;
      else continue;

      // Penalizaciones para evitar falsos positivos con columnas de control
      if (hNorm.indexOf("proces") >= 0) score -= 40;
      if (hNorm.indexOf("error") >= 0) score -= 40;
      if (hNorm.indexOf("idevento") >= 0) score -= 40;

      if (score > mejorScore) {
        mejorScore = score;
        mejorCol = c + 1;
      }
    }
  }

  return mejorCol;
}

function esTaskIdPlaceholder_(taskId) {
  const t = normalizarTextoTrim(taskId);
  if (!t) return false;
  // Casos típicos cuando el link no reemplazó el placeholder
  if (t === "{TASK_ID}" || t === "{TASKID}" || t === "TASK_ID" || t === "TASKID") return true;
  if (t.indexOf("TASK_ID") >= 0 || t.indexOf("TASKID") >= 0) return true;
  if (t.indexOf("{TASK") >= 0) return true;
  return false;
}

function obtenerFechaMicroevento_(sheet, row) {
  // 1) Si el Form tiene una fecha explícita para el UPDATE/CIERRE, usarla
  const fechaExplicita = obtenerValorPorHeaders_(sheet, row, [
    "Fecha término",
    "Fecha termino",
    "Fecha de término",
    "Fecha de termino",
    "Fecha cierre",
    "Fecha de cierre",
    "Fecha update",
    "Fecha de update",
    "Fecha"
  ], null);
  if (fechaExplicita) return fechaExplicita;

  // 2) Si no, usar la marca temporal del Form (columna 1 típicamente)
  return obtenerValorPorHeaders_(sheet, row, ["Marca temporal", "Timestamp"], 1);
}

function obtenerFechaEventoCreacion_(sheet, row) {
  // 1) Buscar por encabezados comunes
  const fecha = obtenerValorPorHeaders_(sheet, row, [
    "Fecha",
    "Día",
    "Dia",
    "Fecha tarea",
    "Fecha de tarea",
    "Fecha evento",
    "Fecha de evento",
    "Fecha actividad",
    "Fecha de actividad",
    "Fecha reunión",
    "Fecha reunion",
    "Fecha y hora",
    "FECHA_EVENTO"
  ], null);
  if (fecha) return fecha;

  // 2) Fallback: inferir desde la fila, evitando timestamp/procesamiento
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return "";

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const valores = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

  let mejor = null;
  let mejorScore = -9999;

  for (let c = 0; c < lastCol; c++) {
    const hNorm = normalizarClaveHeader_(headers[c]);
    const v = valores[c];

    let d = null;
    if (v instanceof Date) {
      d = v;
    } else {
      const s = normalizarTextoTrim(v);
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s) || /^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
        const tmp = new Date(s);
        if (!isNaN(tmp.getTime())) d = tmp;
      }
    }

    if (!d || isNaN(d.getTime())) continue;
    if (d.getFullYear() < 2000) continue;

    let score = 0;
    if (hNorm.indexOf("fecha") >= 0) score += 5;
    if (hNorm === "fecha") score += 5;
    if (hNorm.indexOf("evento") >= 0 || hNorm.indexOf("tarea") >= 0 || hNorm.indexOf("actividad") >= 0) score += 3;

    if (hNorm.indexOf("marcatemporal") >= 0 || hNorm.indexOf("timestamp") >= 0) score -= 50;
    if (hNorm.indexOf("proces") >= 0) score -= 50;
    if (hNorm.indexOf("entrega") >= 0 || hNorm.indexOf("estimad") >= 0) score -= 10;

    if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) score += 2;

    if (score > mejorScore) {
      mejorScore = score;
      mejor = d;
    }
  }

  return mejor || "";
}

function normalizarFechaHoraMicro_(valor) {
  if (!valor) return new Date();
  const d = valor instanceof Date ? new Date(valor.getTime()) : new Date(valor);
  if (isNaN(d.getTime())) return new Date();
  // Si solo viene fecha (00:00), asignar hora estándar para que sea visible
  if (d.getHours() === 0 && d.getMinutes() === 0) {
    d.setHours(9, 0, 0, 0);
  }
  return d;
}

function extraerHoraMinutos_(valor) {
  if (valor === null || valor === undefined || valor === "") return null;

  // Google Forms / Sheets suelen entregar:
  // - Date (cuando es pregunta de hora)
  // - string "HH:mm"
  // - number (fracción de día)
  if (valor instanceof Date) {
    return { h: valor.getHours(), m: valor.getMinutes() };
  }

  if (typeof valor === "number" && isFinite(valor)) {
    const totalMin = Math.round(valor * 24 * 60);
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    return { h, m };
  }

  const s = normalizarTextoTrim(valor);
  if (!s) return null;

  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (isNaN(hh) || isNaN(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { h: hh, m: mm };
}

function construirFechaConHora_(fechaBase, horaValor) {
  const base = fechaBase instanceof Date ? new Date(fechaBase.getTime()) : new Date(fechaBase);
  if (isNaN(base.getTime())) return new Date();
  const hm = extraerHoraMinutos_(horaValor);
  if (!hm) return base;
  base.setHours(hm.h, hm.m, 0, 0);
  return base;
}

function obtenerRangoHorarioDesdeFila_(sheet, row, fechaBase, duracionMinutos) {
  const horaInicio = obtenerValorPorHeaders_(sheet, row, [
    "Hora inicio",
    "Hora de inicio",
    "Hora Inicio",
    "Inicio",
    "Desde",
    "Hora desde",
    "Start",
    "Start time"
  ], null);

  const horaFin = obtenerValorPorHeaders_(sheet, row, [
    "Hora fin",
    "Hora de fin",
    "Hora término",
    "Hora termino",
    "Hora de término",
    "Hora de termino",
    "Fin",
    "Hasta",
    "End",
    "End time"
  ], null);

  const inicio = construirFechaConHora_(fechaBase, horaInicio);

  let fin;
  if (extraerHoraMinutos_(horaFin)) {
    fin = construirFechaConHora_(inicio, horaFin);
    // Si el usuario pone un fin menor al inicio, asumimos que cruza medianoche.
    if (fin.getTime() <= inicio.getTime()) {
      fin = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
    }
  } else {
    fin = new Date(inicio.getTime() + (duracionMinutos * 60 * 1000));
  }

  return { inicio, fin };
}

function asegurarEncabezados_(sheet, headers, estiloControl) {
  const lastCol = sheet.getLastColumn();
  const row = sheet.getRange(1, 1, 1, Math.max(lastCol, 1)).getValues()[0];
  const existing = {};
  for (let c = 0; c < row.length; c++) {
    const k = normalizarTextoTrim(row[c]);
    if (k) existing[k] = c + 1;
  }

  let colActual = lastCol;
  const nuevos = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (!existing[h]) {
      colActual += 1;
      existing[h] = colActual;
      nuevos.push({ header: h, col: colActual });
    }
  }

  if (nuevos.length > 0) {
    sheet.insertColumnsAfter(lastCol, nuevos.length);
    for (let i = 0; i < nuevos.length; i++) {
      sheet.getRange(1, nuevos[i].col).setValue(nuevos[i].header);
    }
    if (estiloControl) {
      const firstNewCol = nuevos[0].col;
      sheet.getRange(1, firstNewCol, 1, nuevos.length)
        .setFontWeight("bold")
        .setBackground("#f4b400")
        .setFontColor("#000000");
    }
  }

  return existing;
}

function obtenerValorPorHeaders_(sheet, row, posiblesHeaders, fallbackCol) {
  const map = indicesEncabezados_(sheet);
  for (let i = 0; i < posiblesHeaders.length; i++) {
    const h = posiblesHeaders[i];
    if (map[h]) return sheet.getRange(row, map[h]).getValue();
    const hUp = normalizarTextoTrim(h).toUpperCase();
    if (map[hUp]) return sheet.getRange(row, map[hUp]).getValue();
    const hNoSpaces = normalizarTextoTrim(h).replace(/\s+/g, "");
    if (map[hNoSpaces]) return sheet.getRange(row, map[hNoSpaces]).getValue();
    const hNoSpacesUp = hNoSpaces.toUpperCase();
    if (map[hNoSpacesUp]) return sheet.getRange(row, map[hNoSpacesUp]).getValue();

     // Match tolerante a tildes + espacios + may/min
     const hNorm = normalizarClaveHeader_(h);
     if (map[hNorm]) return sheet.getRange(row, map[hNorm]).getValue();
  }

  // Último intento: fuzzy (contiene) sobre encabezados normalizados
  const colFuzzy = encontrarColumnaPorHeaderFuzzy_(sheet, posiblesHeaders);
  if (colFuzzy) return sheet.getRange(row, colFuzzy).getValue();

  if (fallbackCol) return sheet.getRange(row, fallbackCol).getValue();
  return "";
}

function actualizarTituloEventoPrincipalDesdeSheet(taskId) {
  const tid = normalizarTextoTrim(taskId);
  if (!tid) throw new Error("Debes pasar un TaskID");

  const config = obtenerConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(config.hojaCrear);
  if (!hoja) throw new Error("No se encontró la hoja de CREAR: '" + config.hojaCrear + "'");

  const idx = indicesEncabezados_(hoja);
  const colTask = idx["TaskID"];
  if (!colTask) throw new Error("La hoja de CREAR no tiene columna 'TaskID'");

  const lastRow = hoja.getLastRow();
  if (lastRow < 2) throw new Error("No hay filas de CREAR");

  const rangoTask = hoja.getRange(2, colTask, lastRow - 1, 1);
  const finder = rangoTask.createTextFinder(tid).matchEntireCell(true);
  const match = finder.findNext();
  if (!match) throw new Error("No se encontró TaskID en hoja de CREAR: " + tid);

  const fila = match.getRow();
  const datos = obtenerDatosBase_(hoja, fila, false);
  const principal = obtenerEventoPrincipalPorTaskId_(tid, config);
  const ev = principal.evento;

  const tituloActual = normalizarTexto(ev.getTitle());
  const prefijoCerrada = tituloActual.startsWith("[CERRADA] ") ? "[CERRADA] " : "";
  const nuevoTitulo = prefijoCerrada + construirTituloTarea_(tid, datos);
  ev.setTitle(nuevoTitulo);

  Logger.log("Título actualizado para TaskID " + tid + ": '" + nuevoTitulo + "'");
}

function encontrarTaskIdEnTexto_(texto) {
  const t = normalizarTexto(texto).toUpperCase();
  const m = t.match(/T-\d{8}-[A-Z0-9]{6,}/);
  return m ? m[0] : "";
}

function obtenerTaskIdDesdeFila_(sheet, row, idxFallback) {
  const candidatosHeaders = [
    "TaskID",
    "Task ID",
    "Task Id",
    "TASKID",
    "TASK ID",
    "TaskId",
    "Taskid",
    "Id Tarea",
    "ID Tarea",
    "ID de tarea",
    "Id de tarea"
  ];

  const colFallback = idxFallback && idxFallback["TaskID"] ? idxFallback["TaskID"] : null;
  const directo = normalizarTextoTrim(obtenerValorPorHeaders_(sheet, row, candidatosHeaders, colFallback));
  if (directo) return directo;

  // Fallback: buscar en toda la fila por patrón de TaskID
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return "";
  const valores = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
  for (let c = 0; c < valores.length; c++) {
    const match = encontrarTaskIdEnTexto_(valores[c]);
    if (match) return match;
  }
  return "";
}

function obtenerComentarioUpdate_(sheet, row) {
  // Intento 1: nombres comunes de la pregunta en el Form UPDATE
  const v = obtenerValorPorHeaders_(sheet, row, [
    "Comentario",
    "Comentarios",
    "Comentario update",
    "Comentario UPDATE",
    "Avance",
    "Avances",
    "Update",
    "Actualización",
    "Actualizacion",
    "Detalle",
    "Detalle update",
    "Detalle UPDATE",
    "Notas",
    "Observaciones",
    "Descripción",
    "Descripcion",
    "Descripción update",
    "Descripcion update"
  ], null);
  const directo = normalizarTextoTrim(v);
  if (directo) return normalizarTexto(v);

  // Intento 2: escanear la fila buscando columnas cuyo encabezado sugiera update
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return "";
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const valores = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
  const piezas = [];
  for (let c = 0; c < lastCol; c++) {
    const h = normalizarTexto(headers[c]).toLowerCase();
    if (!h) continue;
    if (h.indexOf("coment") >= 0 || h.indexOf("update") >= 0 || h.indexOf("avance") >= 0 || h.indexOf("nota") >= 0 || h.indexOf("observ") >= 0 || h.indexOf("descr") >= 0) {
      const val = normalizarTextoTrim(valores[c]);
      if (val) piezas.push(normalizarTexto(valores[c]));
    }
  }
  return piezas.join("\n");
}

function obtenerTipoEventoPorHoja_(sheetName, config) {
  if (sheetName === config.hojaUpdate) return EVENTO_TIPO.UPDATE;
  if (sheetName === config.hojaCierre) return EVENTO_TIPO.CIERRE;
  if (sheetName === config.hojaCrear) return EVENTO_TIPO.CREAR;
  // Fallback seguro: tratar como creación
  return EVENTO_TIPO.CREAR;
}

// FUNCIÓN PRINCIPAL
function onFormSubmit(e) {
  if (!e || !e.range) {
    Logger.log("Error: No se recibió objeto evento válido");
    return;
  }

  const lock = LockService.getDocumentLock();
  try {
    // Evita que dos triggers (o reintentos) procesen la misma fila a la vez.
    lock.waitLock(30 * 1000);

    const sheet = e.range.getSheet();
    const row = e.range.getRow();

    const config = obtenerConfig();
    const tipo = obtenerTipoEventoPorHoja_(sheet.getName(), config);
    Logger.log("Procesando " + tipo + " en hoja '" + sheet.getName() + "' fila " + row);

    const controlHeaders = [
      "Procesado",
      "TaskID",
      "ID Evento Principal",
      "ID Evento Calendar",
      "Fecha Procesamiento",
      "Error"
    ];
    const idx = asegurarEncabezados_(sheet, controlHeaders, true);

    // Idempotencia: si ya hay TaskID o ID principal, no crear nada de nuevo.
    const yaProcesado = sheet.getRange(row, idx["Procesado"]).getValue();
    const taskIdExistente = normalizarTextoTrim(sheet.getRange(row, idx["TaskID"]).getValue());
    const idPrincipalExistente = idx["ID Evento Principal"]
      ? normalizarTextoTrim(sheet.getRange(row, idx["ID Evento Principal"]).getValue())
      : "";

    if (esVerdadero_(yaProcesado) || taskIdExistente || idPrincipalExistente) {
      Logger.log("Fila " + row + " ya procesada (o con IDs existentes); se omite.");
      return;
    }

    if (tipo === EVENTO_TIPO.CREAR) {
      procesarCreacion_(sheet, row, idx, config);
    } else if (tipo === EVENTO_TIPO.UPDATE) {
      procesarUpdate_(sheet, row, idx, config);
    } else if (tipo === EVENTO_TIPO.CIERRE) {
      procesarCierre_(sheet, row, idx, config);
    } else {
      throw new Error("Tipo de evento no soportado: " + tipo);
    }

  } catch (error) {
    Logger.log("Error: " + error.message);
    const sheet = e.range.getSheet();
    const row = e.range.getRow();
    const idx = asegurarEncabezados_(sheet, ["Procesado", "TaskID", "ID Evento Principal", "ID Evento Calendar", "Fecha Procesamiento", "Error"], true);
    marcarComoProcesado_(sheet, row, idx, null, null, error.message);
  } finally {
    try {
      lock.releaseLock();
    } catch (err) {
      // no-op
    }
  }
}

function procesarCreacion_(sheet, row, idx, config) {
  const datos = obtenerDatosBase_(sheet, row, true);
  const fechaBase = normalizarFechaHoraInicio_(datos.fechaEvento);
  const rango = obtenerRangoHorarioDesdeFila_(sheet, row, fechaBase, config.duracionTareaMinutos);
  const fechaInicio = rango.inicio;
  const fechaFin = rango.fin;
  const taskId = generarTaskId();

  const titulo = construirTituloTarea_(taskId, datos);
  const descripcion = construirDescripcionTarea_(taskId, datos, config);
  const calendario = obtenerCalendario_(config);

  const evento = calendario.createEvent(titulo, fechaInicio, fechaFin, {
    description: descripcion,
    location: normalizarTextoTrim(datos.codigoProyecto),
    sendInvites: config.enviarNotificacion === true
  });

  // Invitado (si aplica)
  const email = normalizarTextoTrim(datos.email);
  if (email) {
    try {
      evento.addGuest(email);
    } catch (err) {
      Logger.log("No se pudo agregar invitado: " + err.message);
    }
  }

  // Color
  try {
    evento.setColor(String(config.colorTarea));
  } catch (err) {
    Logger.log("No se pudo establecer color tarea");
  }

  const idEvento = evento.getId();
  sheet.getRange(row, idx["TaskID"]).setValue(taskId);
  sheet.getRange(row, idx["ID Evento Principal"]).setValue(idEvento);
  marcarComoProcesado_(sheet, row, idx, idEvento, idEvento, null);
}

function procesarUpdate_(sheet, row, idx, config) {
  const taskId = normalizarTextoTrim(obtenerTaskIdDesdeFila_(sheet, row, idx));
  if (!taskId) throw new Error("No se pudo obtener TaskID en el UPDATE");
  if (esTaskIdPlaceholder_(taskId)) {
    throw new Error("El TaskID llegó como placeholder ('{TASK_ID}'). Revisa FORM_URL_UPDATE y FORM_PLACEHOLDER_TASKID (muchas veces el link trae el placeholder URL-encoded: %7BTASK_ID%7D).");
  }

  let comentarioUpdate = normalizarTexto(obtenerComentarioUpdate_(sheet, row));
  if (!normalizarTextoTrim(comentarioUpdate)) {
    // No bloquear creación del evento por falta de comentario.
    comentarioUpdate = "UPDATE (sin comentario)";
  }

  const datos = obtenerDatosBase_(sheet, row, false);
  const principal = obtenerEventoPrincipalPorTaskId_(taskId, config);
  const eventoPrincipal = principal.evento;
  const idEventoPrincipal = principal.idEventoPrincipal;

  // Microevento UPDATE
  const fechaBase = normalizarFechaHoraMicro_(obtenerFechaMicroevento_(sheet, row));
  const rango = obtenerRangoHorarioDesdeFila_(sheet, row, fechaBase, config.duracionUpdateMinutos);
  const inicio = rango.inicio;
  const fin = rango.fin;
  const tituloBase = obtenerTituloBaseEventoPrincipal_(eventoPrincipal);
  // Importante: no incluir el comentario en el título del evento.
  const titulo = tituloBase + " UPDATE";
  const descripcion = construirDescripcionMicroevento_(EVENTO_TIPO.UPDATE, taskId, datos, comentarioUpdate);

  const calendario = obtenerCalendario_(config);
  const eventoUpdate = calendario.createEvent(titulo, inicio, fin, {
    description: descripcion,
    location: normalizarTextoTrim(datos.codigoProyecto),
    sendInvites: config.enviarNotificacion === true
  });

  // Invitado (mismo comportamiento que CREAR: que se vea también en el calendario del respondiente)
  const email = normalizarTextoTrim(datos.email);
  if (email) {
    try {
      eventoUpdate.addGuest(email);
    } catch (err) {
      Logger.log("No se pudo agregar invitado en UPDATE: " + err.message);
    }
  }
  try {
    eventoUpdate.setColor(String(config.colorUpdate));
  } catch (err) {
    Logger.log("No se pudo establecer color update");
  }

  // Anexar historial al evento principal
  anexarHistorial_(eventoPrincipal, EVENTO_TIPO.UPDATE, comentarioUpdate);

  const idEvento = eventoUpdate.getId();
  sheet.getRange(row, idx["TaskID"]).setValue(taskId);
  sheet.getRange(row, idx["ID Evento Principal"]).setValue(idEventoPrincipal);
  marcarComoProcesado_(sheet, row, idx, idEvento, idEventoPrincipal, null);
}

function procesarCierre_(sheet, row, idx, config) {
  const taskId = normalizarTextoTrim(obtenerTaskIdDesdeFila_(sheet, row, idx));
  if (!taskId) throw new Error("No se pudo obtener TaskID en el CIERRE");
  if (esTaskIdPlaceholder_(taskId)) {
    throw new Error("El TaskID llegó como placeholder ('{TASK_ID}'). Revisa FORM_URL_CIERRE y FORM_PLACEHOLDER_TASKID (muchas veces el link trae el placeholder URL-encoded: %7BTASK_ID%7D).");
  }

  const comentarioFinal = normalizarTexto(obtenerValorPorHeaders_(sheet, row, ["Comentario", "Comentarios", "Comentario final", "Cierre"], null));
  const complicaciones = normalizarTexto(obtenerValorPorHeaders_(sheet, row, ["Complicaciones", "Dificultades", "Problemas", "Bloqueos"], null));

  const datos = obtenerDatosBase_(sheet, row, false);
  const principal = obtenerEventoPrincipalPorTaskId_(taskId, config);
  const eventoPrincipal = principal.evento;
  const idEventoPrincipal = principal.idEventoPrincipal;

  // Microevento CIERRE
  const fechaBase = normalizarFechaHoraMicro_(obtenerFechaMicroevento_(sheet, row));
  const rango = obtenerRangoHorarioDesdeFila_(sheet, row, fechaBase, config.duracionCierreMinutos);
  const inicio = rango.inicio;
  const fin = rango.fin;
  const tituloBase = obtenerTituloBaseEventoPrincipal_(eventoPrincipal);
  const titulo = tituloBase + " CIERRE " + resumenTexto_(comentarioFinal || "Cierre", 60);
  const descripcion = construirDescripcionCierre_(taskId, datos, comentarioFinal, complicaciones);

  const calendario = obtenerCalendario_(config);
  const eventoCierre = calendario.createEvent(titulo, inicio, fin, {
    description: descripcion,
    location: normalizarTextoTrim(datos.codigoProyecto),
    sendInvites: config.enviarNotificacion === true
  });

  // Invitado (mismo comportamiento que CREAR)
  const email = normalizarTextoTrim(datos.email);
  if (email) {
    try {
      eventoCierre.addGuest(email);
    } catch (err) {
      Logger.log("No se pudo agregar invitado en CIERRE: " + err.message);
    }
  }
  try {
    eventoCierre.setColor(String(config.colorCierre));
  } catch (err) {
    Logger.log("No se pudo establecer color cierre");
  }

  // Marcar evento principal como cerrado + anexar historial
  marcarEventoPrincipalComoCerrado_(eventoPrincipal);
  anexarHistorial_(eventoPrincipal, EVENTO_TIPO.CIERRE, construirTextoCierreParaHistorial_(comentarioFinal, complicaciones));

  const idEvento = eventoCierre.getId();
  sheet.getRange(row, idx["TaskID"]).setValue(taskId);
  sheet.getRange(row, idx["ID Evento Principal"]).setValue(idEventoPrincipal);
  marcarComoProcesado_(sheet, row, idx, idEvento, idEventoPrincipal, null);
}

function obtenerDatosBase_(sheet, row, requiereFecha) {
  // Notas:
  // - Soportamos distintos títulos de preguntas del Form.
  // - Si en tu hoja actual las columnas siguen el orden clásico, igual funciona.

  // Importante: evitamos fallbacks por posición (col 2,3,4...) porque al re-enlazar
  // un Form Google puede insertar/reordenar columnas y eso rompe el mapeo.
  const email = normalizarTextoTrim(obtenerValorPorHeaders_(sheet, row, [
    "Dirección de correo electrónico",
    "Email",
    "Correo",
    "Correo electrónico"
  ], null));

  const fechaEvento = obtenerFechaEventoCreacion_(sheet, row);

  const codigoProyectoRaw = obtenerValorPorHeaders_(sheet, row, [
    "Código proyecto",
    "Codigo proyecto",
    "Código de proyecto",
    "Codigo de proyecto",
    "CODIGO_PROYECTO",
    "Proyecto"
  ], null);

  if (pareceHoraDeSheets_(codigoProyectoRaw)) {
    throw new Error(
      "El campo 'Código proyecto' se está leyendo como una HORA (ej: 1899). " +
      "Revisa tu Google Form: la pregunta 'Código proyecto' debe ser 'Respuesta corta' (texto), no 'Hora/Fecha'. " +
      "También revisa que el encabezado de la columna en la hoja coincida con 'Código proyecto'."
    );
  }

  const codigoProyecto = normalizarTextoTrim(codigoProyectoRaw);

  const concepto = normalizarTextoTrim(obtenerValorPorHeaders_(sheet, row, [
    "Concepto",
    "CONCEPTO",
    "Tarea"
  ], null));

  const tipoActividad = normalizarTextoTrim(obtenerValorPorHeaders_(sheet, row, [
    "Tipo de actividad",
    "Tipo actividad",
    "Tipo",
    "Actividad",
    "Actividad (código)",
    "Actividad (codigo)",
    "Código actividad",
    "Codigo actividad",
    "Sigla actividad",
    "Disciplina",
    "Especialidad (sigla)",
    "TIPO_ACTIVIDAD",
    "ACTIVIDAD"
  ], null));

  const etapa = normalizarTextoTrim(obtenerValorPorHeaders_(sheet, row, [
    "Etapa",
    "Etapa proyecto",
    "Etapa de proyecto",
    "Etapa del proyecto",
    "Fase",
    "Fase proyecto",
    "Fase de proyecto",
    "Phase",
    "Stage",
    "ETAPA"
  ], null));

  const descripcion = normalizarTexto(obtenerValorPorHeaders_(sheet, row, [
    "Descripción",
    "DESCRIPCION",
    "Descripción breve",
    "Descripcion breve",
    "Descripción corta",
    "Descripcion corta",
    "Detalle",
    "Detalle breve"
  ], null));

  const motivo = normalizarTexto(obtenerValorPorHeaders_(sheet, row, [
    "Motivo",
    "MOTIVO"
  ], null));

  const impacto = normalizarTexto(obtenerValorPorHeaders_(sheet, row, [
    "Impacto",
    "IMPACTO"
  ], null));

  const especialidad = normalizarTextoTrim(obtenerValorPorHeaders_(sheet, row, [
    "Especialidad",
    "ESPECIALIDAD"
  ], null));

  const complejidad = normalizarTexto(obtenerValorPorHeaders_(sheet, row, [
    "Complejidad",
    "COMPLEJIDAD"
  ], null));

  const comentario = normalizarTexto(obtenerValorPorHeaders_(sheet, row, [
    "Comentario",
    "Comentarios",
    "COMENTARIO"
  ], null));

  // Campo opcional para entrega estimada (si lo agregas al Form de CREAR)
  const fechaEntregaEstimada = obtenerValorPorHeaders_(sheet, row, [
    "Fecha entrega estimada",
    "Fecha de entrega estimada",
    "Entrega estimada"
  ], null);

  if (requiereFecha && !fechaEvento) {
    throw new Error(
      "No se pudo obtener la fecha del evento. " +
      "Revisa el encabezado de la columna de fecha en la hoja de respuestas (ideal: 'Fecha') " +
      "y que la pregunta del Form sea tipo 'Fecha' (no texto)."
    );
  }

  return {
    email,
    fechaEvento,
    fechaEntregaEstimada,
    codigoProyecto,
    concepto,
    tipoActividad,
    etapa,
    especialidad,
    descripcion,
    motivo,
    impacto,
    complejidad,
    comentario
  };
}

function normalizarFechaHoraInicio_(fechaEvento) {
  const fechaInicio = fechaEvento instanceof Date ? new Date(fechaEvento.getTime()) : new Date(fechaEvento);
  if (isNaN(fechaInicio.getTime())) {
    throw new Error("La fecha del evento es inválida: " + normalizarTexto(fechaEvento));
  }
  // Si el usuario solo entregó fecha (00:00), poner hora estándar
  if (fechaInicio.getHours() === 0 && fechaInicio.getMinutes() === 0) {
    fechaInicio.setHours(9, 0, 0, 0);
  }
  return fechaInicio;
}

function resumenTexto_(texto, maxLen) {
  let t = normalizarTextoTrim(texto);
  if (!t) t = "";
  if (t.length <= maxLen) return t;
  return t.substring(0, Math.max(0, maxLen - 3)) + "...";
}

function obtenerTituloBaseEventoPrincipal_(eventoPrincipal) {
  const t = normalizarTexto(eventoPrincipal.getTitle());
  return t.replace(/^\[CERRADA\]\s+/, "");
}

function limpiarComentarioParaTituloUpdate_(comentarioUpdate) {
  const t = normalizarTextoTrim(comentarioUpdate);
  if (!t) return "";

  // Si es el fallback, no ensuciar el título.
  if (t.toLowerCase().indexOf("sin comentario") >= 0) return "";

  // Si el usuario escribe "UPDATE ..." en el comentario, evitamos duplicar.
  return t.replace(/^\s*update\b\s*[:\-–—]?\s*/i, "");
}

function construirTituloTarea_(taskId, datos) {
  const codigoProyecto = normalizarTextoTrim(datos.codigoProyecto) || "SIN-CODIGO";
  const concepto = normalizarTextoTrim(datos.concepto) || "XXX";
  const tipoActividad = normalizarTextoTrim(datos.tipoActividad) || "XX";
  const etapa = normalizarTextoTrim(datos.etapa) || "XXX";
  let descripcion = normalizarTexto(datos.descripcion) || "Sin descripción";
  if (descripcion.length > 90) descripcion = descripcion.substring(0, 87) + "...";
  // Importante: NO incluir TaskID en el título del evento (solo en descripción/Sheets).
  return codigoProyecto + "_" + concepto + "_" + tipoActividad + "_" + etapa + " " + descripcion;
}

function construirDescripcionTarea_(taskId, datos, config) {
  let desc = "<b>TAREA (CREACIÓN)</b><br>";
  desc += "<b>TaskID:</b> " + taskId + "<br>";
  desc += "<b>Creada:</b> " + formatFecha(new Date()) + "<br>";
  if (datos.fechaEntregaEstimada) {
    desc += "<b>Entrega estimada:</b> " + formatFecha(datos.fechaEntregaEstimada) + "<br>";
  }
  desc += "<br>";

  desc += "<b>Código Proyecto:</b> " + normalizarTexto(datos.codigoProyecto) + "<br>";
  desc += "<b>Concepto:</b> " + normalizarTexto(datos.concepto) + "<br>";
  desc += "<b>Tipo de actividad:</b> " + normalizarTexto(datos.tipoActividad) + "<br>";
  desc += "<b>Etapa:</b> " + normalizarTexto(datos.etapa) + "<br>";
  desc += "<b>Especialidad:</b> " + normalizarTexto(datos.especialidad) + "<br><br>";

  desc += "<b>Descripción:</b><br>" + normalizarTexto(datos.descripcion) + "<br><br>";

  desc += "<b>Contexto:</b><br>";
  desc += "• Motivo: " + normalizarTexto(datos.motivo) + "<br>";
  desc += "• Impacto: " + normalizarTexto(datos.impacto) + "<br>";
  desc += "• Complejidad: " + normalizarTexto(datos.complejidad) + "<br>";

  const comentario = normalizarTextoTrim(datos.comentario);
  if (comentario) {
    desc += "<br><b>Comentario:</b><br>" + normalizarTexto(datos.comentario) + "<br>";
  }

  // Links a formularios (si están configurados)
  desc += construirBloqueAcciones_(taskId, config);

  desc += "<br><hr><b>Historial</b><br><i>(los updates y cierre se anexan aquí)</i><br>";
  desc += "<br><i>Evento generado automáticamente. No representa control horario.</i>";
  return desc;
}

function construirBloqueAcciones_(taskId, config) {
  const linkUpdate = urlConTaskId(config.formUrlUpdate, config.formPlaceholderTaskId, taskId);
  const linkCierre = urlConTaskId(config.formUrlCierre, config.formPlaceholderTaskId, taskId);
  if (!linkUpdate && !linkCierre) return "";

  let bloque = "<br><hr><b>Acciones</b><br>";
  if (linkUpdate) bloque += "• <a href='" + linkUpdate + "'>Registrar UPDATE (avance)</a><br>";
  if (linkCierre) bloque += "• <a href='" + linkCierre + "'>Registrar CIERRE</a><br>";
  return bloque;
}

function actualizarAccionesEnDescripcion_(descripcionOriginal, bloqueAcciones) {
  const desc = normalizarTexto(descripcionOriginal);
  const accionesMarker = "<br><hr><b>Acciones</b><br>";
  const historialMarker = "<br><hr><b>Historial</b><br>";

  const idxAcciones = desc.indexOf(accionesMarker);
  if (idxAcciones >= 0) {
    const idxHist = desc.indexOf(historialMarker, idxAcciones);
    const before = desc.substring(0, idxAcciones);
    const after = idxHist >= 0 ? desc.substring(idxHist) : "";
    return before + (bloqueAcciones || "") + after;
  }

  const idxHist = desc.indexOf(historialMarker);
  if (idxHist >= 0) {
    const before = desc.substring(0, idxHist);
    const after = desc.substring(idxHist);
    return before + (bloqueAcciones || "") + after;
  }

  return desc + (bloqueAcciones || "");
}

/**
 * Si un evento principal ya fue creado antes de corregir los links,
 * ejecuta esta función para reconstruir la sección "Acciones" con el TaskID real.
 */
function actualizarLinksEventoPrincipal(taskId) {
  const config = obtenerConfig();
  const principal = obtenerEventoPrincipalPorTaskId_(normalizarTextoTrim(taskId), config);
  const evento = principal.evento;
  const bloque = construirBloqueAcciones_(normalizarTextoTrim(taskId), config);
  const nuevo = actualizarAccionesEnDescripcion_(evento.getDescription(), bloque);
  evento.setDescription(nuevo);
  Logger.log("Links actualizados para TaskID: " + taskId);
}

function diagnosticarEventoPorId(idEventoCalendar) {
  const config = obtenerConfig();
  const calendario = obtenerCalendario_(config);
  const id = normalizarTextoTrim(idEventoCalendar);
  if (!id) throw new Error("Debes pasar un ID de evento");
  const ev = calendario.getEventById(id);
  if (!ev) {
    Logger.log("No encontrado en calendarId='" + config.calendarioId + "' ID: " + id);
    return;
  }
  Logger.log("Encontrado: '" + ev.getTitle() + "' " + formatFecha(ev.getStartTime()) + " - " + formatFecha(ev.getEndTime()));
}

function diagnosticarTaskIdEnFila(nombreHoja, numeroFila) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) throw new Error("No se encontró la hoja: " + nombreHoja);
  const row = parseInt(String(numeroFila), 10);
  if (!row || row < 2) throw new Error("numeroFila inválido (usa >= 2)");

  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  Logger.log("Headers: " + headers.map(h => normalizarTexto(h)).join(" | "));

  const idx = asegurarEncabezados_(sheet, ["Procesado", "TaskID", "ID Evento Principal", "ID Evento Calendar", "Fecha Procesamiento", "Error"], true);
  const taskId = obtenerTaskIdDesdeFila_(sheet, row, idx);
  Logger.log("TaskID detectado en fila " + row + ": '" + taskId + "'");
}

function construirDescripcionMicroevento_(tipo, taskId, datos, comentario) {
  let desc = "<b>" + tipo + "</b><br>";
  desc += "<b>TaskID:</b> " + taskId + "<br>";
  desc += "<b>Fecha registro:</b> " + formatFecha(new Date()) + "<br><br>";
  if (datos && (datos.codigoProyecto || datos.concepto || datos.tipoActividad || datos.etapa)) {
    desc += "<b>Contexto tarea:</b><br>";
    desc += "• Proyecto: " + normalizarTexto(datos.codigoProyecto) + "<br>";
    desc += "• Concepto: " + normalizarTexto(datos.concepto) + "<br>";
    desc += "• Actividad: " + normalizarTexto(datos.tipoActividad) + "<br>";
    desc += "• Etapa: " + normalizarTexto(datos.etapa) + "<br><br>";
  }
  desc += "<b>Detalle:</b><br>" + normalizarTexto(comentario) + "<br>";
  return desc;
}

function construirDescripcionCierre_(taskId, datos, comentarioFinal, complicaciones) {
  let desc = "<b>CIERRE DE TAREA</b><br>";
  desc += "<b>TaskID:</b> " + taskId + "<br>";
  desc += "<b>Fecha cierre:</b> " + formatFecha(new Date()) + "<br><br>";
  if (datos && datos.codigoProyecto) {
    desc += "<b>Proyecto:</b> " + normalizarTexto(datos.codigoProyecto) + "<br><br>";
  }
  if (normalizarTextoTrim(comentarioFinal)) {
    desc += "<b>Comentario final:</b><br>" + normalizarTexto(comentarioFinal) + "<br><br>";
  }
  if (normalizarTextoTrim(complicaciones)) {
    desc += "<b>Complicaciones / dificultades:</b><br>" + normalizarTexto(complicaciones) + "<br>";
  }
  return desc;
}

function construirTextoCierreParaHistorial_(comentarioFinal, complicaciones) {
  let t = "Comentario final: " + normalizarTextoTrim(comentarioFinal);
  const comp = normalizarTextoTrim(complicaciones);
  if (comp) t += "\nComplicaciones: " + comp;
  return t;
}

function anexarHistorial_(eventoPrincipal, tipo, texto) {
  const tz = Session.getScriptTimeZone();
  const stamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");
  const entrada = "<br><br><b>[" + tipo + "]</b> " + stamp + "<br>" + normalizarTexto(texto).replace(/\n/g, "<br>");
  const actual = normalizarTexto(eventoPrincipal.getDescription());
  eventoPrincipal.setDescription(actual + entrada);
}

function marcarEventoPrincipalComoCerrado_(eventoPrincipal) {
  const titulo = normalizarTexto(eventoPrincipal.getTitle());
  if (titulo.startsWith("[CERRADA] ")) return;
  eventoPrincipal.setTitle("[CERRADA] " + titulo);
}

function obtenerEventoPrincipalPorTaskId_(taskId, config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(config.hojaCrear);
  if (!hoja) throw new Error("No se encontró la hoja de CREAR: '" + config.hojaCrear + "'");

  const idx = indicesEncabezados_(hoja);
  const colTask = idx["TaskID"];
  const colIdPrincipal = idx["ID Evento Principal"] || idx["ID Evento Calendar"];
  if (!colTask || !colIdPrincipal) {
    throw new Error("La hoja de CREAR debe tener columnas 'TaskID' e 'ID Evento Principal' (se agregan al procesar la primera vez)");
  }

  const lastRow = hoja.getLastRow();
  if (lastRow < 2) throw new Error("No hay tareas creadas para buscar TaskID");

  const rangoTask = hoja.getRange(2, colTask, lastRow - 1, 1);
  const finder = rangoTask.createTextFinder(taskId).matchEntireCell(true);
  const match = finder.findNext();
  if (!match) throw new Error("No se encontró TaskID en hoja de CREAR: " + taskId);

  const fila = match.getRow();
  const idEventoPrincipal = normalizarTextoTrim(hoja.getRange(fila, colIdPrincipal).getValue());
  if (!idEventoPrincipal) throw new Error("La tarea existe pero no tiene ID de evento principal guardado");

  const calendario = obtenerCalendario_(config);
  const evento = calendario.getEventById(idEventoPrincipal);
  if (!evento) throw new Error("No se pudo encontrar el evento principal en Calendar (ID: " + idEventoPrincipal + ")");
  return { idEventoPrincipal, evento };
}

function marcarComoProcesado_(sheet, row, idx, idEventoCalendar, idEventoPrincipal, mensajeError) {
  const ahora = new Date();
  if (mensajeError) {
    sheet.getRange(row, idx["Procesado"]).setValue(false);
    sheet.getRange(row, idx["ID Evento Calendar"]).setValue("ERROR");
    if (idx["ID Evento Principal"]) sheet.getRange(row, idx["ID Evento Principal"]).setValue(idEventoPrincipal || "");
    sheet.getRange(row, idx["Fecha Procesamiento"]).setValue(ahora);
    sheet.getRange(row, idx["Error"]).setValue(mensajeError);
  } else {
    sheet.getRange(row, idx["Procesado"]).setValue(true);
    sheet.getRange(row, idx["ID Evento Calendar"]).setValue(idEventoCalendar);
    if (idx["ID Evento Principal"]) sheet.getRange(row, idx["ID Evento Principal"]).setValue(idEventoPrincipal || "");
    sheet.getRange(row, idx["Fecha Procesamiento"]).setValue(ahora);
    sheet.getRange(row, idx["Error"]).setValue("");
  }
}

// REPROCESAR FILA MANUALMENTE
function reprocesarFilaEnHoja(nombreHoja, numeroFila) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) throw new Error("No se encontró la hoja: " + nombreHoja);

  const idx = asegurarEncabezados_(sheet, ["Procesado", "TaskID", "ID Evento Principal", "ID Evento Calendar", "Fecha Procesamiento", "Error"], true);
  sheet.getRange(numeroFila, idx["Procesado"]).setValue(false);
  sheet.getRange(numeroFila, idx["ID Evento Calendar"]).setValue("");
  if (idx["Fecha Procesamiento"]) sheet.getRange(numeroFila, idx["Fecha Procesamiento"]).setValue("");
  if (idx["Error"]) sheet.getRange(numeroFila, idx["Error"]).setValue("");

  const eventoSimulado = { range: sheet.getRange(numeroFila, 1) };
  onFormSubmit(eventoSimulado);
  Logger.log("Fila " + numeroFila + " reprocesada en hoja '" + nombreHoja + "'");
}

// CREAR HOJA CONFIG
function crearHojaConfigV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hojaConfig = ss.getSheetByName(HOJA_CONFIG);
  
  if (!hojaConfig) hojaConfig = ss.insertSheet(HOJA_CONFIG);

  const datos = [
    ["Parámetro", "Valor"],
    [CONFIG_KEYS.DURACION_TAREA_MIN, 60],
    [CONFIG_KEYS.DURACION_UPDATE_MIN, 15],
    [CONFIG_KEYS.DURACION_CIERRE_MIN, 15],
    [CONFIG_KEYS.CALENDARIO_ID, "primary"],
    [CONFIG_KEYS.ENVIAR_NOTIFICACION, false],
    [CONFIG_KEYS.COLOR_TAREA, 1],
    [CONFIG_KEYS.COLOR_UPDATE, 5],
    [CONFIG_KEYS.COLOR_CIERRE, 11],
    ["", ""],
    [CONFIG_KEYS.HOJA_CREAR, "Respuestas de formulario 1"],
    [CONFIG_KEYS.HOJA_UPDATE, "Respuestas UPDATE"],
    [CONFIG_KEYS.HOJA_CIERRE, "Respuestas CIERRE"],
    ["", ""],
    [CONFIG_KEYS.FORM_PLACEHOLDER_TASKID, "{TASK_ID}"],
    [CONFIG_KEYS.FORM_URL_UPDATE, ""],
    [CONFIG_KEYS.FORM_URL_CIERRE, ""]
  ];

  hojaConfig.clear();
  hojaConfig.getRange(1, 1, datos.length, 2).setValues(datos);
  hojaConfig.getRange("A1:B1").setFontWeight("bold").setBackground("#4285f4").setFontColor("#ffffff");
  hojaConfig.setColumnWidth(1, 260);
  hojaConfig.setColumnWidth(2, 600);

  Logger.log("Config v2 creada/actualizada");
}

// AGREGAR COLUMNAS DE CONTROL
function prepararHojasControlV2() {
  const config = obtenerConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const nombres = [config.hojaCrear, config.hojaUpdate, config.hojaCierre];
  const headers = ["Procesado", "TaskID", "ID Evento Principal", "ID Evento Calendar", "Fecha Procesamiento", "Error"];
  for (let i = 0; i < nombres.length; i++) {
    const name = nombres[i];
    const sh = ss.getSheetByName(name);
    if (!sh) {
      Logger.log("(prepararHojasControlV2) Hoja no encontrada: " + name);
      continue;
    }
    asegurarEncabezados_(sh, headers, true);
    Logger.log("Columnas de control OK: " + name);
  }
}

// PROCESAR FILAS PENDIENTES (SOLUCIÓN PARA TRIGGER)
function procesarFilasPendientes() {
  const config = obtenerConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Procesar UPDATE pendientes
  procesarPendientesEnHoja_(ss, config.hojaUpdate, "UPDATE");
  
  // Procesar CIERRE pendientes
  procesarPendientesEnHoja_(ss, config.hojaCierre, "CIERRE");
  
  Logger.log("Procesamiento de filas pendientes completado");
}

function procesarPendientesEnHoja_(ss, nombreHoja, tipo) {
  const hoja = ss.getSheetByName(nombreHoja);
  if (!hoja) {
    Logger.log("Hoja no encontrada: " + nombreHoja);
    return;
  }
  
  const lastRow = hoja.getLastRow();
  if (lastRow < 2) return; // No hay datos
  
  const config = obtenerConfig();
  const controlHeaders = ["Procesado", "TaskID", "ID Evento Principal", "ID Evento Calendar", "Fecha Procesamiento", "Error"];
  const idx = asegurarEncabezados_(hoja, controlHeaders, true);
  
  // Buscar filas sin procesar
  const procesadoCol = idx["Procesado"];
  const rangoProcesado = hoja.getRange(2, procesadoCol, lastRow - 1, 1).getValues();
  
  let procesados = 0;
  for (let i = 0; i < rangoProcesado.length; i++) {
    const fila = i + 2;
    const yaProcesado = rangoProcesado[i][0];
    
    // Si está vacío o es FALSE, procesar
    if (!yaProcesado || yaProcesado === false || yaProcesado === "FALSE" || yaProcesado === "") {
      try {
        Logger.log("Procesando " + tipo + " en fila " + fila + " de hoja " + nombreHoja);
        
        const eventoSimulado = { range: hoja.getRange(fila, 1) };
        
        // Llamar al procesamiento según tipo
        if (tipo === "UPDATE") {
          procesarUpdate_(hoja, fila, idx, config);
        } else if (tipo === "CIERRE") {
          procesarCierre_(hoja, fila, idx, config);
        }
        
        procesados++;
      } catch (error) {
        Logger.log("Error procesando fila " + fila + ": " + error.message);
        marcarComoProcesado_(hoja, fila, idx, null, null, error.message);
      }
      
      // Evitar timeout: solo procesar 10 filas por ejecución
      if (procesados >= 10) {
        Logger.log("Límite de 10 filas por ejecución alcanzado");
        break;
      }
    }
  }
  
  if (procesados > 0) {
    Logger.log("Se procesaron " + procesados + " filas en " + nombreHoja);
  }
}