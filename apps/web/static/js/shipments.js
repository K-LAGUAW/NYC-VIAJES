// ============= Variables Globales =============
const notificationQueue = []; // Cola de notificaciones pendientes
let scanner; // Instancia del escáner QR
let table; // Instancia de la tabla DataTable
let trackingConfirm;
let isShowingNotification = false; // Control de visualización de notificaciones
let optionsShow = true;

// ============= Elementos del DOM =============
// Botones principales
const showConfig = document.getElementById('showConfig');
const showShipment = document.getElementById('showShipment');
const showOptions = document.getElementById('showOptions');
const scanQr = document.getElementById('scanQr');

const optionsModule = document.getElementById('optionsModule');
const optionsContainer = document.getElementById('optionsContainer');

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
const typeSelect = document.getElementById('typeSelect');
const priceSelect = document.getElementById('priceSelect');
const shipmentContainer = document.getElementById('shipmentContainer');
const shipmentButton = document.getElementById('shipmentButton');

// Modal QR
const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
const qrSpinner = document.getElementById('qrSpinner');

// Modal de configuración
const printerModal = new bootstrap.Modal(document.getElementById('printerModal'));
const printerSelect = document.getElementById('printerSelect');
const printerContainer = document.getElementById('printerContainer');
const printerButton = document.getElementById('printerButton');

const deliveryModal = new bootstrap.Modal(document.getElementById('deliveryModal'));
const deliveryContainer = document.getElementById('deliveryContainer');
const paymentSelect = document.getElementById('paymentSelect');
const trackingTitle = document.getElementById('trackingTitle');
const deliveryButton = document.getElementById('deliveryButton');

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
                    ? `<button class="btn btn-success fw-medium" id="completeButton" onclick="showDelivery('${data.tracking_number}')">Confirmar entrega</button>` 
                    : ''}
            </div>
        </div>
    `;
};

// ============= Funciones de Impresión =============
/**
 * Imprime el ticket QR para un envío
 * @param {string} tracking_number - Número de seguimiento del envío
 */
async function printQR(tracking_number) {
    let shipmentData;

    try {
        const response = await fetch(`/api/v1/search_shipment/${tracking_number}/`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        shipmentData = data.shipment;
    } catch (error) {
        let errorMessage = error.message;

        if (error.message.includes('Failed to fetch')) errorMessage = "No se pudo conectar con el servidor";
        showNotification('error', errorMessage);
        return;
    }

    const payload = {
        nombreImpresora: getCookie('selectedPrinter'),
        serial: "YTAwODkxYjhfXzIwMjUtMDUtMTVfXzIwMjUtMDYtMTQjIyNZWkJRNTVZdko3bGJncWVJRXpUNCtxa0VTc1Y0Y1lhbXdhZVJscUI2OVNqME5tOVBNaVppcFdHRjVVVVNKTmQ2OXVoMTZzbHIxY05GMzBDRFVTUnRabC9BRUxqMTdOclNhSngxVjI1bzh2akE3bWRrc3FKdlhTRXB6blZ1NW1xVmN2WWJGZDRFSU1ZSXc1djQ0MU9OU3ROYURtbnMxQXdtRitKN29LOVEvdkQ0aTcrTGZUNTR6d3NlMWlhSk1iMXBUSFpPQ3lsZE9YU0dQME0yV1M1VmdpejJCRGNFemY0dldBOG5sZzlFaWtDVnd0RkMwUThCUVYrTjJtWlVGUUgyampFS1JUTkUvSG16NTgxTWxLK200NXVEWXdKa09RZjVZM0FuMC9TUFN2WGx6ZXl5WjBDSFpIUHp1T2M4WE50ZmlFOHpzcTg2Q0NpUE9Nam9QQjdYeUY0OUwzMWhNQi9xbHFGM0dUT0F5ZGpoa1VIWEozMjAyNkxDQ2djTFNyT0o4ZitPRjRsTlJjSTl1ZFBrNU44emNTcXJFVGVGYzdiQ0ZtRlMxSVRXb25FcUJXKzVHaTJuMWIxWUlVZVBwYkpEbkJmMVR3OXhTMTg4RU81a0JyL1dyYVB1Z1VKelUzYjZFdUpwTW11Z01XU053WmdMM2IwVVR6SXVnQmJ2NnBSaGdlamZWYmEybmozMEVMSVJZN3c1aXB6bjdaN3ZvUXc3VlJLcXVqcmMwV2VrMVV2emRjMjVZdXZhaU0zeU9lUXJ0U3JFWS9ic3hOd1hkcjhKYkdkdStZZHZSSVdQSm5wUzlKcEtBWUNubkhZWnNRc3FTTnFRN2VYWlRXaDljYWt2ai9oOU83SVV1YVkwZmJmQ1NCSXlxSkdwaGdHWHpHbSs5aWZNb21TNnczMD0=",
        operaciones: [
            { nombre: "Iniciar", argumentos: [] },
            { nombre: "EstablecerAlineacion", argumentos: [1] },
            { nombre: "DescargarImagenDeInternetEImprimir", argumentos: ["https://i.postimg.cc/02PKCgMG/nyc-logo.png", 283, 0, false] },
            { nombre: "Iniciar", argumentos: [] },
            { nombre: "Feed", argumentos: [2] },
            { nombre: "EstablecerTamañoFuente", argumentos: [3, 3] },
            { nombre: "EstablecerEnfatizado", argumentos: [false] },
            { nombre: "EstablecerAlineacion", argumentos: [1] },
            { nombre: "EstablecerSubrayado", argumentos: [false] },
            { nombre: "EstablecerImpresionAlReves", argumentos: [false] },
            { nombre: "EstablecerImpresionBlancoYNegroInversa", argumentos: [false] },
            { nombre: "EstablecerRotacionDe90Grados", argumentos: [false] },
            { nombre: "EscribirTexto", argumentos: [shipmentData.tracking_number] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "Iniciar", argumentos: [] },
            { nombre: "EstablecerAlineacion", argumentos: [1] },
            { nombre: "ImprimirCodigoQr", argumentos: [shipmentData.tracking_number, 302, 1, 0] },
            { nombre: "Iniciar", argumentos: [] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "EstablecerTamañoFuente", argumentos: [2, 2] },
            { nombre: "EstablecerEnfatizado", argumentos: [false] },
            { nombre: "EstablecerAlineacion", argumentos: [1] },
            { nombre: "EstablecerSubrayado", argumentos: [true] },
            { nombre: "EstablecerImpresionAlReves", argumentos: [false] },
            { nombre: "EstablecerImpresionBlancoYNegroInversa", argumentos: [false] },
            { nombre: "EstablecerRotacionDe90Grados", argumentos: [false] },
            { nombre: "EscribirTexto", argumentos: ["REMITENTE:"] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "EstablecerTamañoFuente", argumentos: [2, 2] },
            { nombre: "EstablecerEnfatizado", argumentos: [false] },
            { nombre: "EstablecerAlineacion", argumentos: [1] },
            { nombre: "EstablecerSubrayado", argumentos: [false] },
            { nombre: "EstablecerImpresionAlReves", argumentos: [false] },
            { nombre: "EstablecerImpresionBlancoYNegroInversa", argumentos: [false] },
            { nombre: "EstablecerRotacionDe90Grados", argumentos: [false] },
            { nombre: "EscribirTexto", argumentos: [shipmentData.sender] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "EstablecerTamañoFuente", argumentos: [2, 2] },
            { nombre: "EstablecerEnfatizado", argumentos: [false] },
            { nombre: "EstablecerAlineacion", argumentos: [1] },
            { nombre: "EstablecerSubrayado", argumentos: [true] },
            { nombre: "EstablecerImpresionAlReves", argumentos: [false] },
            { nombre: "EstablecerImpresionBlancoYNegroInversa", argumentos: [false] },
            { nombre: "EstablecerRotacionDe90Grados", argumentos: [false] },
            { nombre: "EscribirTexto", argumentos: ["DESTINATARIO:"] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "EstablecerTamañoFuente", argumentos: [2, 2] },
            { nombre: "EstablecerEnfatizado", argumentos: [false] },
            { nombre: "EstablecerAlineacion", argumentos: [1] },
            { nombre: "EstablecerSubrayado", argumentos: [false] },
            { nombre: "EstablecerImpresionAlReves", argumentos: [false] },
            { nombre: "EstablecerImpresionBlancoYNegroInversa", argumentos: [false] },
            { nombre: "EstablecerRotacionDe90Grados", argumentos: [false] },
            { nombre: "EscribirTexto", argumentos: [shipmentData.recipient] },
            { nombre: "Feed", argumentos: [1] },
            { nombre: "Feed", argumentos: [7] },
            { nombre: "CorteParcial", argumentos: [] }
        ]
    };

    try {
        const response = await fetch("http://localhost:2811/imprimir", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error("Error al imprimir el ticket");
        }

        showNotification('success', "Impresion de ticket en curso");
    } catch (error) {
        let errorMessage = error.message;

        if (error.message.includes('Failed to fetch')) errorMessage = "No se pudo conectar al servicio de impresion";
        showNotification('error', errorMessage);
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
    showShipment.classList.add('disabled');
    shipmentForm.classList.add('d-none');
    shipmentButton.classList.add('disabled');
    shipmentContainer.innerHTML = `
        <div class="d-flex justify-content-center my-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>
    `;

    shipmentModal.show();

    try {
        const response = await fetch('/api/v1/packages_categories/');
        const data = await response.json();

        if (response.ok) {
            Object.values(data).forEach(element => {
                if (element.status !== 200) {
                    throw new Error(element.message);
                }
            });
        } else {
            throw new Error(data.message);
        }

        typeSelect.innerHTML = data.package_types.data.map(type => 
            `<option value="${type.abbreviation}">${type.name}</option>`
        ).join('');
        
        priceSelect.innerHTML = data.package_prices.data.map(price => 
            `<option value="${price.abbreviation}">${price.name} - $${price.mount}</option>`
        ).join('');

        shipmentContainer.innerHTML = '';
        shipmentContainer.classList.add('d-none');
        shipmentForm.classList.remove('d-none');
        shipmentButton.classList.remove('disabled');
    } catch (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('Failed to fetch')) errorMessage = "No se pudo conectar al servidor";

        shipmentContainer.innerHTML = `<p class="text-danger text-center fw-semibold my-2">${errorMessage}</p>`;

        showNotification('error', "Error al obtener datos");
    } finally {
        showShipment.classList.remove('disabled');
    };
});

shipmentButton.addEventListener('click', async () => {
    shipmentButton.classList.add('disabled');
    shipmentForm.classList.add('d-none');

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
    }
});

typeSelect.addEventListener('change', function () {
    const itsTourism = this.options[this.selectedIndex].value === 'TUR';
    
    senderInput.disabled = itsTourism;
    senderContainer.classList.toggle('d-none', itsTourism);
    envelopeInput.disabled = itsTourism;
    envelopeContainer.classList.toggle('d-none', itsTourism);
    packageCheckbox.disabled = itsTourism;
    packageContainer.classList.toggle('d-none', itsTourism);
    
    if (itsTourism) {
        senderInput.value = '';
        envelopeInput.value = '';
        packageCheckbox.checked = false;
    }
});

// Reset del modal al cerrarse
shipmentModal._element.addEventListener('hidden.bs.modal', function () {
    shipmentForm.reset();
    shipimetFormAllFields.forEach(field => field.classList.remove('is-invalid', 'is-valid'));
    shipmentForm.classList.remove('d-none');
    
    shipmentButton.classList.remove('disabled');
    
    shipmentContainer.innerHTML = '';
    shipmentContainer.classList.remove('d-none');

    typeSelect.innerHTML = '';
    priceSelect.innerHTML = '';
    
    packageCheckbox.disabled = false;
    packageContainer.classList.remove('d-none');
    
    senderInput.disabled = false; 
    senderContainer.classList.remove('d-none');
    
    envelopeInput.disabled = false;
    envelopeContainer.classList.remove('d-none');
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

qrModal._element.addEventListener('hidden.bs.modal', async () => {
    if (scanner) await scanner.clear();
});

// ============= Event Listeners - Modal Impresora =============

showConfig.addEventListener('click', async () => {
    showConfig.classList.add('disabled');
    printerButton.classList.add('disabled');
    printerSelect.classList.add('d-none');
    printerContainer.innerHTML = `
        <div class="d-flex justify-content-center my-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>
    `;

    printerModal.show();

    try {
        const response = await fetch("http://localhost:2811/impresoras");
        const data = await response.json();
    
        if (!data?.length) throw new Error("No se encontraron impresoras disponibles");

        printerSelect.innerHTML = data.map(printer => 
            `<option value="${printer}">🖨️ ${printer}</option>`
        ).join('');
        
        printerContainer.textContent = '';
        printerContainer.classList.add('d-none');
        printerSelect.classList.remove('d-none');
        printerButton.classList.remove('disabled');
    } catch (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('Failed to fetch')) errorMessage = "No se pudo conectar al servicio de impresion";
        
        printerContainer.innerHTML = `<p class="text-danger text-center fw-semibold my-2">${errorMessage}</p>`;

        showNotification('error', 'Error al obtener impresoras');
    } finally {
        showConfig.classList.remove('disabled');
    }
});

printerButton.addEventListener('click', () => {
    printerButton.classList.add('disabled');
    const printerSelected = printerSelect.value;

    document.cookie = `selectedPrinter=${printerSelected};path=/;max-age=31536000`;

    showNotification('success', 'Impresora configurada correctamente');
    printerModal.hide();
});

printerModal._element.addEventListener('hidden.bs.modal', () => {
    printerContainer.innerHTML = '';
    printerSelect.classList.remove('d-none');
    printerButton.classList.remove('disabled');
    printerSelect.selectedIndex = 0;
});

// ============= Funciones de Completado =============
async function showDelivery(trackingNumber) {
    const completeButton = document.getElementById('completeButton');

    trackingConfirm = trackingNumber;

    completeButton.classList.add('disabled');
    deliveryButton.classList.add('disabled');
    paymentSelect.classList.add('d-none');

    deliveryContainer.innerHTML = `
        <div class="d-flex justify-content-center my-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>
    `;

    deliveryModal.show();

    try {
        const response = await fetch(`/api/v1/payments_types/`);
        const data = await response.json();

        if (data.status !== 200) {
            throw new Error(data.message);
        }

        deliveryContainer.innerHTML = '';
        deliveryContainer.classList.add('d-none');

        trackingTitle.textContent = trackingNumber;
        paymentSelect.innerHTML = data.data.map(payment =>
            `<option value="${payment.abbreviation}">${payment.name}</option>`
        ).join('');

        paymentSelect.classList.remove('d-none');
        trackingTitle.classList.remove('d-none');
        deliveryButton.classList.remove('disabled');
    } catch (error) {
        let errorMessage = error.message;

        if (error.message.includes('Failed to fetch')) errorMessage = "No se pudo conectar al servidor";

        deliveryContainer.innerHTML = `<p class="text-danger text-center fw-semibold my-2">${errorMessage}</p>`;

        showNotification('error', 'Error al obtener tipos de pago');
    } finally {
        completeButton.classList.remove('disabled');
    }
};

deliveryModal._element.addEventListener('hidden.bs.modal', () => {
    trackingTitle.classList.add('d-none');
    deliveryContainer.innerHTML = '';
    deliveryContainer.classList.remove('d-none');
    paymentSelect.classList.remove('d-none');
    paymentSelect.selectedIndex = 0;
    trackingNumber = '';
});