const isAdmin = document.body.dataset.mode === 'admin';
let appData = null;

async function init() {
    try {
        if (!window.APP_DATA) throw new Error('No se pudo encontrar APP_DATA. Asegúrate de incluir data.js');
        appData = window.APP_DATA;
        
        // Configurar título del cliente
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
                    <p style="margin-top: 0.5rem; opacity: 0.8;">Asegúrate de estar corriendo la app usando un servidor local (ej: Live Server en VSCode) para que se pueda leer el archivo data.json correctamente.</p>
                </div>
            `;
        }
        console.error("Error fetching data:", error);
    }
}

function render() {
    let totalPaid = 0;
    let totalPending = 0;
    let totalTrips = 0;
    
    appData.historial.forEach(day => {
        day.viajes.forEach(v => {
            totalTrips++;
            if (v.pagado) totalPaid += v.monto;
            else totalPending += v.monto;
        });
    });

    const elTotalPaid = document.getElementById('total-paid');
    const elTotalPending = document.getElementById('total-pending');
    
    if(elTotalPaid) elTotalPaid.textContent = appData.moneda + totalPaid.toFixed(2);
    if(elTotalPending) elTotalPending.textContent = appData.moneda + totalPending.toFixed(2);

    const container = document.getElementById('historial-list');
    container.innerHTML = '';

    appData.historial.forEach(day => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        let subtotal = 0;
        day.viajes.forEach(v => subtotal += v.monto);

        let tripsHtml = '';
        day.viajes.forEach(v => {
            if (isAdmin) {
                tripsHtml += `
                    <div class="trip-item admin-mode">
                        <div class="checkbox-wrapper">
                            <input type="checkbox" id="chk-${v.id}" ${v.pagado ? 'checked' : ''} onchange="togglePago('${day.id_dia}', '${v.id}', this.checked)">
                        </div>
                        <div class="trip-info">
                            <span class="trip-destination">${v.destino}</span>
                            <span class="trip-time">⌚ ${v.hora}</span>
                        </div>
                        <div class="trip-price-wrap">
                            <span class="trip-price">${appData.moneda}${v.monto.toFixed(2)}</span>
                            <span class="badge ${v.pagado ? 'paid' : 'pending'}" id="badge-${v.id}">${v.pagado ? 'Pagado' : 'Pendiente'}</span>
                        </div>
                    </div>
                `;
            } else {
                tripsHtml += `
                    <div class="trip-item">
                        <div class="trip-info">
                            <span class="trip-destination">${v.destino}</span>
                            <span class="trip-time">⌚ ${v.hora}</span>
                        </div>
                        <div class="trip-price-wrap">
                            <span class="trip-price">${appData.moneda}${v.monto.toFixed(2)}</span>
                            <span class="badge ${v.pagado ? 'paid' : 'pending'}">${v.pagado ? 'Pagado' : 'Pendiente'}</span>
                        </div>
                    </div>
                `;
            }
        });

        dayCard.innerHTML = `
            <div class="day-header">
                <span><strong>${day.nombre_dia}</strong> <span style="opacity:0.7; font-size:0.9em; margin-left:0.5rem">${day.fecha}</span></span>
                <span class="day-total">Total del día: ${appData.moneda}${subtotal.toFixed(2)}</span>
            </div>
            <div class="day-body">
                ${tripsHtml}
            </div>
        `;
        container.appendChild(dayCard);
    });
}

window.togglePago = function(dayId, tripId, isChecked) {
    const day = appData.historial.find(d => d.id_dia === dayId);
    if (day) {
        const trip = day.viajes.find(v => v.id === tripId);
        if (trip) {
            trip.pagado = isChecked;
            const badge = document.getElementById(`badge-${tripId}`);
            if (badge) {
                badge.className = `badge ${isChecked ? 'paid' : 'pending'}`;
                badge.textContent = isChecked ? 'Pagado' : 'Pendiente';
            }
            
            // Recalculate Totals dynamically
            let totalPaid = 0;
            let totalPending = 0;
            appData.historial.forEach(d => {
                d.viajes.forEach(vx => {
                    if (vx.pagado) totalPaid += vx.monto;
                    else totalPending += vx.monto;
                });
            });
            document.getElementById('total-paid').textContent = appData.moneda + totalPaid.toFixed(2);
            document.getElementById('total-pending').textContent = appData.moneda + totalPending.toFixed(2);
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
    
    // Show success modal
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

window.closeModal = function() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', init);
