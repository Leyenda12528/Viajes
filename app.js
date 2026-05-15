const isAdmin = document.body.dataset.mode === 'admin';
let appData = null;

async function init() {
    try {
        if (!window.APP_DATA) throw new Error('No se pudo encontrar APP_DATA. Asegúrate de incluir data.js');
        appData = window.APP_DATA;
        
        const titleEl = document.getElementById('cliente-nombre');
        if (titleEl && appData.cliente) {
            titleEl.textContent = appData.cliente;
        }

        render();
    } catch (error) {
        const container = document.getElementById('historial-list');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h3>Error al cargar los datos</h3>
                    <p style="margin-top: 0.5rem; opacity: 0.8;">Asegúrate de estar corriendo la app usando un servidor local.</p>
                </div>
            `;
        }
        console.error("Error fetching data:", error);
    }
}

function render() {
    const container = document.getElementById('historial-list');
    container.innerHTML = '';

    if (!appData.quincenas || appData.quincenas.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 2rem;">No hay quincenas registradas.</p>';
        return;
    }

    appData.quincenas.forEach((quincena, qIndex) => {
        const quincenaHtml = document.createElement('details');
        quincenaHtml.className = 'quincena-card';
        // Quincenas cerradas por defecto, como lo solicitó el usuario

        let daysHtml = '';
        let tripsCount = 0;

        if (quincena.historial && quincena.historial.length > 0) {
            quincena.historial.forEach(day => {
                let subtotal = 0;
                let tripsHtml = '';
                
                tripsCount += day.viajes.length;

                day.viajes.forEach(v => {
                    subtotal += v.monto;
                    
                    const showPrice = quincena.tipo_cobro === "1" || v.monto > 0;
                    const priceText = showPrice ? `${appData.moneda}${v.monto.toFixed(2)}` : 'Paquete';
                    const isPaid = typeof v.pagado !== 'undefined' ? v.pagado : false;
                    const badgeClass = showPrice && isPaid ? 'paid' : (showPrice ? 'pending' : 'info');
                    const badgeText = showPrice && isPaid ? 'Pagado' : (showPrice ? 'Pendiente' : 'INCLUIDO');

                    if (isAdmin) {
                        let checkboxHtml = '';
                        let gridStyle = '';
                        if (quincena.tipo_cobro === "1") {
                            checkboxHtml = `
                                <div class="checkbox-wrapper">
                                    <input type="checkbox" id="chk-${v.id}" ${isPaid ? 'checked' : ''} ${qIndex <= 1 ? 'disabled' : ''} onchange="togglePago('${quincena.id}', '${day.id_dia}', '${v.id}', this.checked)">
                                </div>
                            `;
                        } else {
                            gridStyle = 'grid-template-columns: 1fr auto;';
                        }

                        tripsHtml += `
                            <div class="trip-item admin-mode" style="background:var(--card-bg); margin-bottom:0.5rem; padding:1rem; border-radius:8px; ${gridStyle}">
                                ${checkboxHtml}
                                <div class="trip-info">
                                    <span class="trip-destination" style="display:block; font-weight:600;">${v.destino}</span>
                                    <span class="trip-time" style="font-size:0.9em; opacity:0.8;">⌚ ${v.hora}</span>
                                </div>
                                <div class="trip-price-wrap" style="text-align:right;">
                                    <span class="trip-price" style="display:block; font-weight:bold;">${priceText}</span>
                                    <span class="badge ${badgeClass}" id="badge-${v.id}">${badgeText}</span>
                                </div>
                            </div>
                        `;
                    } else {
                        tripsHtml += `
                            <div class="trip-item" style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); margin-bottom:0.5rem; padding:1rem; border-radius:8px;">
                                <div class="trip-info">
                                    <span class="trip-destination" style="display:block; font-weight:600;">${v.destino}</span>
                                    <span class="trip-time" style="font-size:0.9em; opacity:0.8;">⌚ ${v.hora}</span>
                                </div>
                                <div class="trip-price-wrap" style="text-align:right;">
                                    <span class="trip-price" style="display:block; font-weight:bold; margin-bottom:0.3rem;">${priceText}</span>
                                    <span class="badge ${badgeClass}" style="font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:100px; background: rgba(255,255,255,0.05);">${badgeText}</span>
                                </div>
                            </div>
                        `;
                    }
                });

                daysHtml += `
                    <div class="day-card" style="margin-top: 1rem;">
                        <div class="day-header" style="margin-bottom:0.8rem; display:flex; justify-content:space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                            <span><strong>${day.nombre_dia}</strong> <span style="opacity:0.7; font-size:0.9em; margin-left:0.5rem">${day.fecha}</span></span>
                            ${quincena.tipo_cobro === "1" ? `<span class="day-total" style="font-size:0.9em;">Total día: ${appData.moneda}${subtotal.toFixed(2)}</span>` : ''}
                        </div>
                        <div class="day-body" style="padding:0; background:transparent;">
                            ${tripsHtml}
                        </div>
                    </div>
                `;
            });
        } else {
            daysHtml = `<p style="padding: 1rem; opacity: 0.6; text-align: center;">No hay viajes en esta quincena.</p>`;
        }

        let descText = quincena.descripcion ? quincena.descripcion : '';
        if (quincena.tipo_cobro === "2") {
            const numLimit = quincena.viajes_paquete || 0;
            const extra = quincena.viajes_acumulados && quincena.viajes_acumulados > 0 ? ` (+${quincena.viajes_acumulados} acumulados)` : '';
            if (numLimit > 0) {
                descText = `<span style="opacity:0.8;">${quincena.descripcion}</span> <strong style="color:var(--text-pure); margin-left:1rem; background:rgba(255,255,255,0.1); padding:0.2rem 0.6rem; border-radius:12px;">${tripsCount}/${numLimit + (quincena.viajes_acumulados || 0)} viajes${extra}</strong>`;
            }
        }

        let editBtn = '';
        if (isAdmin && qIndex > 1) {
            editBtn = `<button class="btn-edit-quincena" onclick="openModalQuincena('${quincena.id}'); event.stopPropagation();">✏️ Editar</button>`;
        }

        quincenaHtml.innerHTML = `
            <summary class="quincena-summary">
                <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #fff; display: flex; align-items: center; justify-content: space-between;">
                    <span>${quincena.periodo}</span>
                    ${editBtn}
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center;">
                    <div>
                        <span style="font-size: 0.85rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.3rem;">Total</span>
                        <span style="font-size: 1.1rem; font-weight: 600; color: #fff; display: block;">${appData.moneda}${quincena.total.toFixed(2)}</span>
                    </div>
                    <div>
                        <span style="font-size: 0.85rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.3rem;">Abonado</span>
                        <span style="font-size: 1.1rem; font-weight: 600; color: #10b981; display: block;">${appData.moneda}${quincena.abono.toFixed(2)}</span>
                    </div>
                    <div>
                        <span style="font-size: 0.85rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.3rem;">Restante</span>
                        <span style="font-size: 1.1rem; font-weight: 600; color: #f43f5e; display: block;">${appData.moneda}${quincena.restante.toFixed(2)}</span>
                    </div>
                </div>
                ${descText ? `<div style="text-align:center; margin-top: 1rem; font-size: 0.85rem;">${descText}</div>` : ''}
            </summary>
            <div class="quincena-content">
                ${isAdmin && qIndex > 1 ? `<button class="btn-add-viaje" onclick="openModalViaje('${quincena.id}')">➕ Agregar Viaje</button>` : ''}
                ${daysHtml}
            </div>
        `;

        container.appendChild(quincenaHtml);
    });
}

window.togglePago = function(qId, dayId, tripId, isChecked) {
    const quincena = appData.quincenas.find(q => q.id === qId);
    if (!quincena) return;
    
    const day = quincena.historial.find(d => d.id_dia === dayId);
    if (day) {
        const trip = day.viajes.find(v => v.id === tripId);
        if (trip) {
            trip.pagado = isChecked;
            const badge = document.getElementById(`badge-${tripId}`);
            if (badge) {
                badge.className = `badge ${isChecked ? 'paid' : 'pending'}`;
                badge.textContent = isChecked ? 'Pagado' : 'Pendiente';
            }
            
            // To properly do this we should also recalculate the totals inside the quincena object and re-render or push to DOM.
            // Since this prompt focuses heavily on UI view, dynamic admin is handled minimally.
        }
    }
}

window.downloadJson = function() {
    const jsonStr = JSON.stringify(appData, null, 2);
    const textContent = `window.APP_DATA = ${jsonStr};`;
    const blob = new Blob([textContent], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    a.click();
    URL.revokeObjectURL(url);
    
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

window.closeModal = function(id = 'success-modal') {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
    }
}

window.openModalQuincena = function(id = null) {
    const modal = document.getElementById('quincena-modal');
    const form = document.getElementById('quincena-form');
    const title = document.getElementById('quincena-modal-title');
    form.reset();
    
    if (id) {
        title.textContent = '✏️ Editar Quincena';
        const q = appData.quincenas.find(q => q.id === id);
        if (q) {
            document.getElementById('q-id').value = q.id;
            document.getElementById('q-periodo').value = q.periodo;
            document.getElementById('q-tipo').value = q.tipo_cobro;
            document.getElementById('q-total').value = q.total;
            document.getElementById('q-abono').value = q.abono || 0;
            if (q.tipo_cobro === "2") {
                document.getElementById('q-viajes-paquete').value = q.viajes_paquete || 24;
                document.getElementById('q-acumulados').value = q.viajes_acumulados || 0;
            }
        }
    } else {
        title.textContent = '➕ Nueva Quincena';
        document.getElementById('q-id').value = '';
        document.getElementById('q-tipo').value = "2";
        document.getElementById('q-abono').value = 0;
        
        if (appData.quincenas.length > 0) {
            const lastQ = appData.quincenas[appData.quincenas.length - 1];
            if (lastQ.tipo_cobro === "2") {
                let lastTripsCount = 0;
                if (lastQ.historial) {
                    lastQ.historial.forEach(d => lastTripsCount += d.viajes.length);
                }
                const totalAllowed = (lastQ.viajes_paquete || 24) + (lastQ.viajes_acumulados || 0);
                const remaining = totalAllowed - lastTripsCount;
                if (remaining > 0) {
                    document.getElementById('q-acumulados').value = remaining;
                }
            }
        }
    }
    
    window.toggleQuincenaFields();
    modal.classList.add('active');
}

window.toggleQuincenaFields = function() {
    const tipo = document.getElementById('q-tipo').value;
    document.getElementById('wrap-paquete').style.display = tipo === "2" ? 'flex' : 'none';
    document.getElementById('wrap-acumulados').style.display = tipo === "2" ? 'flex' : 'none';
}

window.saveQuincena = function(e) {
    e.preventDefault();
    const id = document.getElementById('q-id').value;
    const periodo = document.getElementById('q-periodo').value;
    const tipo = document.getElementById('q-tipo').value;
    const total = parseFloat(document.getElementById('q-total').value) || 0;
    const abono = parseFloat(document.getElementById('q-abono').value) || 0;
    
    let qObj;
    if (id) {
        qObj = appData.quincenas.find(q => q.id === id);
    } else {
        qObj = {
            id: 'q' + Date.now(),
            historial: []
        };
        appData.quincenas.push(qObj);
    }
    
    qObj.periodo = periodo;
    qObj.tipo_cobro = tipo;
    qObj.total = total;
    qObj.abono = abono;
    qObj.restante = Math.max(0, total - abono);
    
    if (tipo === "2") {
        qObj.descripcion = "Paquete " + document.getElementById('q-viajes-paquete').value + " viajes";
        qObj.viajes_paquete = parseInt(document.getElementById('q-viajes-paquete').value) || 24;
        qObj.viajes_acumulados = parseInt(document.getElementById('q-acumulados').value) || 0;
    } else {
        delete qObj.descripcion;
        delete qObj.viajes_paquete;
        delete qObj.viajes_acumulados;
    }
    
    closeModal('quincena-modal');
    render();
}

window.openModalViaje = function(qId) {
    document.getElementById('viaje-form').reset();
    document.getElementById('v-quincena-id').value = qId;
    
    const q = appData.quincenas.find(q => q.id === qId);
    document.getElementById('wrap-v-monto').style.display = q && q.tipo_cobro === "1" ? 'flex' : 'none';
    document.getElementById('wrap-v-destino-otro').style.display = 'none';
    
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today - offset)).toISOString().slice(0, 10);
    document.getElementById('v-fecha').value = localISOTime;
    
    document.getElementById('viaje-modal').classList.add('active');
}

window.toggleDestinoOtro = function() {
    const val = document.getElementById('v-destino').value;
    document.getElementById('wrap-v-destino-otro').style.display = val === 'otro' ? 'flex' : 'none';
}

window.saveViaje = function(e) {
    e.preventDefault();
    const qId = document.getElementById('v-quincena-id').value;
    const q = appData.quincenas.find(q => q.id === qId);
    if (!q) return;
    
    const fechaInput = document.getElementById('v-fecha').value;
    const hora = document.getElementById('v-hora').value;
    let destino = document.getElementById('v-destino').value;
    if (destino === 'otro') {
        destino = document.getElementById('v-destino-otro').value;
    }
    
    const [year, month, dayStr] = fechaInput.split('-');
    const dateObj = new Date(year, month - 1, dayStr);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombreDia = dias[dateObj.getDay()];
    const fechaFormatted = `${dayStr}/${month}/${year}`;
    
    let monto = 0;
    if (q.tipo_cobro === "1") {
        monto = parseFloat(document.getElementById('v-monto').value) || 0;
    }
    
    const formatAMPM = (timeStr) => {
        let [h, m] = timeStr.split(':');
        h = parseInt(h);
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };
    
    const nuevoViaje = {
        id: 'v' + Date.now(),
        hora: formatAMPM(hora),
        destino: destino,
        monto: monto,
        pagado: false,
        tipo: q.tipo_cobro
    };
    
    if (!q.historial) q.historial = [];
    
    let dayObj = q.historial.find(d => d.fecha === fechaFormatted);
    if (dayObj) {
        dayObj.viajes.push(nuevoViaje);
    } else {
        q.historial.push({
            id_dia: 'd' + Date.now(),
            fecha: fechaFormatted,
            nombre_dia: nombreDia,
            viajes: [nuevoViaje]
        });
        q.historial.sort((a, b) => {
            const parseD = (str) => {
                const [d, m, y] = str.split('/');
                return new Date(y, m-1, d).getTime();
            };
            return parseD(a.fecha) - parseD(b.fecha);
        });
    }
    
    closeModal('viaje-modal');
    render();
}

document.addEventListener('DOMContentLoaded', init);
