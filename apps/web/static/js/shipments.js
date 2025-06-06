// ============= Variables Globales =============
const notificationQueue = []; // Cola de notificaciones pendientes
let scanner; // Instancia del escáner QR
let table; // Instancia de la tabla DataTable
let isShowingNotification = false; // Control de visualización de notificaciones

// ============= Elementos del DOM =============
// Botones principales
const showConfig = document.getElementById('showConfig');
const scanQr = document.getElementById('scanQr');
const showShipment = document.getElementById('showShipment');

// Formulario de envíos
const typeSelect = document.getElementById('typeSelect');
const priceSelect = document.getElementById('priceSelect');

// Contenedores y campos
const packageContainer = document.getElementById('packageContainer');
const packageCheckbox = document.getElementById('packageCheckbox');
const senderContainer = document.getElementById('senderContainer');
const senderInput = document.getElementById('senderInput');
const envelopeContainer = document.getElementById('envelopeContainer');
const envelopeInput = document.getElementById('envelopeInput');

// Modal de envíos
const shipmentModal = new bootstrap.Modal(document.getElementById('shipmentModal'));
const shipmentForm = document.getElementById('shipmentForm');
const shipimetFormAllFields = shipmentForm.querySelectorAll('input, select');
const shipmentButton = document.getElementById('shipmentButton');
const shipmentSpinner = document.getElementById('shipmentSpinner');

// Modal QR
const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
const qrSpinner = document.getElementById('qrSpinner');

// Modal de configuración
const printerModal = new bootstrap.Modal(document.getElementById('printerModal'));
const printerContainer = document.getElementById('printerContainer');
const printerButton = document.getElementById('printerButton');

// Modal de completado
const completeModal = new bootstrap.Modal(document.getElementById('completeModal'));
const trackingTitle = document.getElementById('trackingTitle');
const paymentSelect = document.getElementById('paymentSelect');

// ============= Funciones Utilitarias =============
/**
 * Obtiene el valor de una cookie por su nombre
 * @param {string} cookieName - Nombre de la cookie
 * @returns {string|null} Valor de la cookie o null si no existe
 */
function getCookie(cookieName) {
    const name = cookieName + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let cookie of cookieArray) {
        cookie = cookie.trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return null;
};

/**
 * Procesa la cola de notificaciones pendientes
 */
function processQueue() {
    if (notificationQueue.length === 0 || isShowingNotification) return;
    
    isShowingNotification = true;
    const {type, title, message, time} = notificationQueue.shift();
    
    Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: time,
        timerProgressBar: true
    }).fire({
        icon: type,
        title: title,
        text: message
    }).then(() => {
        isShowingNotification = false;
        processQueue();
    });
};

/**
 * Agrega una nueva notificación a la cola
 * @param {string} type - Tipo de notificación (success, error, etc.)
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje principal
 * @param {number} time - Tiempo de visualización en milisegundos (opcional)
 */
function showNotification(type, title, message, time = 2000) {
    notificationQueue.push({type, title, message, time});
    processQueue();
};

/**
 * Completa el estado de un envío marcándolo como entregado
 * @param {string} tracking_number - Número de seguimiento del envío
 */
async function completeShipment(tracking_number) {
    try {
        const response = await fetch(`/api/v1/complete_shipment/${tracking_number}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        const data = await response.json();

        if (!response.ok) {
            showNotification('error', data.message);
            return;
        }

        showNotification('success', data.message);
        table.ajax.reload();
    } catch (error) {
        showNotification('error', 'Error al completar la entrega del envío');
    }
}

// ============= Funciones de Tabla =============
/**
 * Inicializa y configura la tabla de envíos usando DataTables
 */
function initializeTable() {
    if (table) {
        table.destroy();
        $('#shipmentsTable').empty();
    }

    table = new DataTable('#shipmentsTable', {
        ajax: {
            url: '/api/v1/shipments/',
            type: 'GET',
            dataSrc: ''
        },
        columnDefs: [{ targets: '_all', className: 'text-center align-middle' }],
        columns: [
            { 
                className: 'dt-control',
                orderable: false,
                data: null,
                defaultContent: '<i class="ti ti-id fs-4"></i>',
                responsivePriority: 1
            },
            { data: 'tracking_number', responsivePriority: 2 },
            { data: 'sender', responsivePriority: 4 },
            { data: 'recipient', responsivePriority: 3 },
            { data: 'creation_date', visible: false }
        ],
        order: [1],
        processing: true,
        responsive: true,
        scrollY: '67vh',
        scrollCollapse: true,
        paging: false,
        info: false,
        language: { url: '/static/json/es.json' }
    });

    // Evento para expandir/filtrar detalles de envío
    table.on('click', 'td.dt-control', (e) => {
        let tr = e.target.closest('tr');
        let row = table.row(tr);

        if (row.child.isShown()) {
            row.child.hide();
        } else {
            row.child(showDetails(row.data())).show();
        }
    });
};

/**
 * Genera el HTML para mostrar los detalles de un envío
 * @param {Object} data - Datos del envío
 * @returns {string} HTML con los detalles del envío
 */
function showDetails(data) {
    return `
    <div class="d-flex flex-column my-2">
        <div class="text-center mb-3">
            <h2 class="text-decoration-underline link-offset-1 fs-4">Detalles del envio</h2>
        </div>
        <div class="d-flex flex-column flex-lg-row align-items-center justify-content-center justify-content-md-around mb-3">
            <div class="shipment-details text-center">
                <p><strong>Fecha de envio:</strong> ${data.creation_date}</p>
                <p><strong>Numero de seguimiento:</strong> ${data.tracking_number}</p>
                <p><strong>Remitente:</strong> ${data.sender}</p>
                <p><strong>Destinatario:</strong> ${data.recipient}</p>
            </div>
            <div class="shipment-status text-center">
                <p><strong>Fecha de actualizacion:</strong> ${data.update_date}</p>
                <p><strong>Numero de telefono:</strong> ${data.phone}</p>
                <p><strong>Estado:</strong> ${data.status.name}</p>
                <div class="d-flex gap-2 align-items-center justify-content-center">
                    <p class="text-decoration-underline link-offset-1 fs-4 m-1">Total:</p>
                    <p class="fs-4 bg-success rounded-pill d-inline-block px-3 text-white m-0">$ ${data.total_amount}</p>
                </div>
            </div>
        </div>
        <div class="d-flex flex-wrap justify-content-center align-items-center gap-2">
            ${data.status.id === 1 
                ? `<button class="btn btn-warning fw-medium" onclick="printQR('${data.tracking_number}')">Reimprimir ticket</button>` 
                : ''}
            ${data.status.id === 3 
                ? `<button class="btn btn-success fw-medium" onclick="showComplete('${data.tracking_number}')">Confirmar entrega</button>` 
                : ''}
        </div>
    </div>`;
};

// ============= Funciones de Impresión =============
/**
 * Imprime el ticket QR para un envío
 * @param {string} tracking_number - Número de seguimiento del envío
 */
async function printQR(tracking_number) {
    try {
        // Obtener datos del envío
        const response = await fetch(`/api/v1/search_shipment/${tracking_number}/`);
        const data = await response.json();

        if (!response.ok) {
            showNotification('error', 'Numero de seguimiento invalido');
            return;
        }

        // Configurar payload de impresión
        const payload = {
            nombreImpresora: getCookie('selectedPrinter'),
            serial: "YTAwODkxYjhfXzIwMjUtMDUtMTVfXzIwMjUtMDYtMTQjIyNZWkJRNTVZdko3bGJncWVJRXpUNCtxa0VTc1Y0Y1lhbXdhZVJscUI2OVNqME5tOVBNaVppcFdHRjVVVVNKTmQ2OXVoMTZzbHIxY05GMzBDRFVTUnRabC9BRUxqMTdOclNhSngxVjI1bzh2akE3bWRrc3FKdlhTRXB6blZ1NW1xVmN2WWJGZDRFSU1ZSXc1djQ0MU9OU3ROYURtbnMxQXdtRitKN29LOVEvdkQ0aTcrTGZUNTR6d3NlMWlhSk1iMXBUSFpPQ3lsZE9YU0dQME0yV1M1VmdpejJCRGNFemY0dldBOG5sZzlFaWtDVnd0RkMwUThCUVYrTjJtWlVGUUgyampFS1JUTkUvSG16NTgxTWxLK200NXVEWXdKa09RZjVZM0FuMC9TUFN2WGx6ZXl5WjBDSFpIUHp1T2M4WE50ZmlFOHpzcTg2Q0NpUE9Nam9QQjdYeUY0OUwzMWhNQi9xbHFGM0dUT0F5ZGpoa1VIWEozMjAyNkxDQ2djTFNyT0o4ZitPRjRsTlJjSTl1ZFBrNU44emNTcXJFVGVGYzdiQ0ZtRlMxSVRXb25FcUJXKzVHaTJuMWIxWUlVZVBwYkpEbkJmMVR3OXhTMTg4RU81a0JyL1dyYVB1Z1VKelUzYjZFdUpwTW11Z01XU053WmdMM2IwVVR6SXVnQmJ2NnBSaGdlamZWYmEybmozMEVMSVJZN3c1aXB6bjdaN3ZvUXc3VlJLcXVqcmMwV2VrMVV2emRjMjVZdXZhaU0zeU9lUXJ0U3JFWS9ic3hOd1hkcjhKYkdkdStZZHZSSVdQSm5wUzlKcEtBWUNubkhZWnNRc3FTTnFRN2VYWlRXaDljYWt2ai9oOU83SVV1YVkwZmJmQ1NCSXlxSkdwaGdHWHpHbSs5aWZNb21TNnczMD0=",
            operaciones: [
                // ... (operaciones de impresión)
            ]
        };

        // Enviar a servicio de impresión
        const printResponse = await fetch("http://localhost:2811/imprimir", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const printData = await printResponse.json();

        if (!printData.ok) {
            showNotification('error', 'Error al imprimir el ticket');
            return;
        }

        showNotification('success', 'Ticket impreso correctamente');
    } catch {
        showNotification('error', 'Error en el servicio de impresion');
    }
};

// ============= Funciones de Escaneo QR =============
/**
 * Maneja el escaneo exitoso de un código QR
 * @param {string} decodedText - Texto decodificado del QR
 */
async function qrScanSuccess(decodedText) {
    await scanner.clear();
    qrSpinner.classList.remove('d-none');

    try {
        const response = await fetch(`/api/v1/update_shipment/${decodedText}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        const data = await response.json();

        if (response.ok) {
            showNotification('success', data.message);
            table.ajax.reload();
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        showNotification('error', 'Error al actualizar el estado del envio');
    } finally {
        qrSpinner.classList.add('d-none');
        qrModal.hide();
    }
}

// ============= Inicialización =============
document.addEventListener('DOMContentLoaded', function () {
    initializeTable();

    // Recargar datos cada 3 minutos
    setInterval(() => {
        if (table) table.ajax.reload(null, false);
    }, 180000);
});

// ============= Event Listeners - Modal de Envíos =============
showShipment.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/v1/packages_categories/');
        const data = await response.json();

        if (!response.ok) throw new Error();

        // Llenar selects con datos de la API
        typeSelect.innerHTML = data.package_types.map(type => 
            `<option value="${type.id}">${type.name}</option>`
        ).join('');
        
        priceSelect.innerHTML = data.package_prices.map(price => 
            `<option value="${price.id}">${price.name} - $${price.mount}</option>`
        ).join('');

        shipmentModal.show();
    } catch {
        showNotification('error', 'Error cargando categorías');
    }
});

shipmentButton.addEventListener('click', async () => {
    shipmentButton.classList.add('disabled');
    shipmentForm.classList.add('d-none');
    shipmentSpinner.classList.remove('d-none');

    try {
        const formData = new FormData(shipmentForm);
        
        // Procesar campos opcionales
        formData.set('sender', formData.get('sender') || 'N&C');
        formData.set('envelope_amount', formData.get('envelope_amount') || 0);
        
        // Agregar campos adicionales
        formData.append('package_type', typeSelect.value);
        formData.append('package_amount', priceSelect.value);
        formData.append('package_pickup', packageCheckbox.checked);

        const response = await fetch('/api/v1/create_shipment/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });
        
        const data = await response.json();

        if (!response.ok) {
            // Validación de campos
            shipimetFormAllFields.forEach(field => {
                if (!field.name || field.name === 'envelope_amount') return;
                
                const hasError = data.errors.includes(field.name);
                const isEmpty = !field.value.trim();
                
                field.classList.toggle('is-invalid', hasError || (!hasError && isEmpty));
                field.classList.toggle('is-valid', !hasError && !isEmpty);
            });
            showNotification('error', data.message);
            return;
        }

        printQR(data.tracking_number);
        showNotification('success', data.message);
        shipmentModal.hide();
        table.ajax.reload();
    } catch (error) {
        showNotification('error', 'Error de conexión');
    } finally {
        shipmentButton.classList.remove('disabled');
        shipmentForm.classList.remove('d-none');
        shipmentSpinner.classList.add('d-none');
    }
});

// Reset del modal al cerrarse
shipmentModal._element.addEventListener('hidden.bs.modal', function () {
    shipmentForm.reset();
    senderInput.disabled = false;
    senderContainer.classList.remove('d-none');
    envelopeInput.disabled = false;
    envelopeContainer.classList.remove('d-none');
    packageCheckbox.disabled = false;
    packageContainer.classList.remove('d-none');
    typeSelect.innerHTML = '';
    priceSelect.innerHTML = '';
    
    shipimetFormAllFields.forEach(i => i.classList.remove('is-invalid', 'is-valid'));
});

// Cambio en tipo de paquete
typeSelect.addEventListener('change', function () {
    const isTourism = this.options[this.selectedIndex].text.toLowerCase() === 'turismo';
    
    senderInput.disabled = isTourism;
    senderContainer.classList.toggle('d-none', isTourism);
    envelopeInput.disabled = isTourism;
    envelopeContainer.classList.toggle('d-none', isTourism);
    packageCheckbox.disabled = isTourism;
    packageContainer.classList.toggle('d-none', isTourism);
    
    if (isTourism) {
        senderInput.value = '';
        envelopeInput.value = '';
        packageCheckbox.checked = false;
    }
});

// ============= Event Listeners - Modal QR =============
scanQr.addEventListener('click', () => {
    scanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10,
        qrbox: 250,
        showTorchButtonIfSupported: true,
        qrScanSuccess
    });
    scanner.render();
    qrModal.show();
});

qrModal._element.addEventListener('hide.bs.modal', async () => {
    if (scanner) await scanner.clear();
});

// ============= Event Listeners - Modal Impresora =============
showConfig.addEventListener('click', async () => {
    showConfig.classList.add('disabled');

    try {
        const response = await fetch("http://localhost:2811/impresoras");
        const data = await response.json();
        
        if (!response.ok || !data.length) {
            printerContainer.innerHTML = `<p class="fw-semibold text-center text-danger m-0 px-5">Error al obtener impresoras disponibles reintente nuevamente</p>`;
            printerButton.classList.add('disabled');
            showNotification('error', 'Error al obtener impresoras');
            return; 
        };

        printerContainer.innerHTML = `
        <select class="form-select fw-medium shadow-sm p-3" id="printerSelect">
            ${data.map(printer => `
                <option value="${printer}">🖨️ ${printer}</option>
            `).join('')}
        </select>
    `;
    } catch {
        printerContainer.innerHTML = `<p class="fw-semibold text-center text-danger m-0 px-5">Error en el servicio de impresion contacte con un administrador</p>`;
        printerButton.classList.add('disabled');
        showNotification('error', 'Servicio de impresion no disponible');
    } finally {
        showConfig.classList.remove('disabled');
        printerModal.show();
    };
});

printerButton.addEventListener('click', () => {
    printerButton.classList.add('disabled');

    const printerSaved = getCookie('selectedPrinter');
    const printerSelected = document.getElementById('printerSelect').value;

    document.cookie = `selectedPrinter=${printerSelected};path=/;max-age=31536000`;

    if (!printerSaved === printerSelected) {
        showNotification('error', 'Error al configurar impresora');
        printerButton.classList.remove('disabled');
        return;
    };

    showNotification('success', 'Impresora configurada correctamente');
    printerModal.hide();
});

printerModal._element.addEventListener('hidden.bs.modal', () => {
    printerContainer.innerHTML = '';
    printerButton.classList.remove('disabled');
});

// ============= Funciones de Completado =============
/**
 * Muestra el modal para confirmar entrega
 * @param {string} tracking_number - Número de seguimiento
 */
async function showComplete(tracking_number) {
    try {
        const response = await fetch(`/api/v1/payments_types/`);
        const data = await response.json();
        
        if (!response.ok) {
            showNotification('error', 'Error al obtener métodos de pago');
            return;
        }

        trackingTitle.textContent = tracking_number;
        paymentSelect.innerHTML = data.map(payment => 
            `<option value="${payment.abbreviation}">${payment.name}</option>`
        ).join('');
        
        completeModal.show();
    } catch {
        showNotification('error', 'Error al cargar modal');
    }
};