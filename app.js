const obligaciones = [
    {
        categoria: "Personal y Presencia",
        puntos: [
            { id: "p1_1", texto: "Visitas del Administrador-Representante Legal (al menos 2 veces/semana)" },
            { id: "p1_2", texto: "Disponibilidad 24/7 del Administrador para imprevistos" },
            { id: "p1_3", texto: "Presencia de Administradora Delegada (6 días/semana)" },
            { id: "p1_4", texto: "Presencia de Asistente Contable (6 días/semana)" },
            { id: "p1_5", texto: "Presencia de Asistente Operativo (3 veces/semana)" },
            { id: "p1_6", texto: "Disponibilidad de Director Administrativo para supervisión y presupuesto" }
        ]
    },
    {
        categoria: "Gestión Administrativa",
        puntos: [
            { id: "adm_1", texto: "Atención personalizada en gestión administrativa" },
            { id: "adm_2", texto: "Entrega de informes administrativos mensuales (primeros 20 días hábiles)" },
            { id: "adm_3", texto: "Control mensual de presupuesto aprobado vs ejecutado" },
            { id: "adm_4", texto: "Coordinación y ejecución de contratos de mantenimiento (aseo, vigilancia, etc.)" },
            { id: "adm_5", texto: "Convocatoria y realización de asambleas ordinarias y extraordinarias" },
            { id: "adm_6", texto: "Gestión de personal propio y contratistas" },
            { id: "adm_7", texto: "Manejo de reuniones y custodia de documentación legal y actas" },
            { id: "adm_8", texto: "Asesoría en decisiones ajustadas a la Ley 675 de 2001" },
            { id: "adm_9", texto: "Expedición de certificados de paz y salvo" },
            { id: "adm_10", texto: "Preparación del programa anual de mantenimiento preventivo y correctivo" }
        ]
    },
    {
        categoria: "Gestión Contable y Financiera",
        puntos: [
            { id: "cont_1", texto: "Registro ordenado y periódico de todas las operaciones financieras" },
            { id: "cont_2", texto: "Presentación de estados financieros mensuales (primeros 20 días)" },
            { id: "cont_3", texto: "Facturación de cuotas ordinarias y extraordinarias (primeros 5 días)" },
            { id: "cont_4", texto: "Vigilancia y actualización del estado de cuenta de cada unidad" },
            { id: "cont_5", texto: "Gestión administrativa de cobro de cuotas atrasadas" },
            { id: "cont_6", texto: "Conciliaciones bancarias y ejecución presupuestal mensual" },
            { id: "cont_7", texto: "Presentación de información exógena ante la DIAN" },
            { id: "cont_8", texto: "Auditoría contable del último año incluida" },
            { id: "cont_9", texto: "Disponibilidad del Call Center virtual para gestión de cobro" }
        ]
    },
    {
        categoria: "Mantenimiento y Servicios Públicos",
        puntos: [
            { id: "mant_1", texto: "Gestión de servicios públicos y pagos oportunos" },
            { id: "mant_2", texto: "Supervisión de seguridad y vigilancia permanente" },
            { id: "mant_3", texto: "Supervisión de aseo de pisos, paredes, patios y áreas comunes" },
            { id: "mant_4", texto: "Desarrollo de obras de mantenimiento corriente y reparaciones urgentes" },
            { id: "mant_5", texto: "Identificación y verificación de seguridad social de contratistas" }
        ]
    },
    {
        categoria: "Legal y Convivencia",
        puntos: [
            { id: "leg_1", texto: "Representación judicial y extrajudicial de la persona jurídica" },
            { id: "leg_2", texto: "Atención a derechos de petición, tutelas y requerimientos legales" },
            { id: "leg_3", texto: "Notificación de sanciones impuestas por la Asamblea o Consejo" },
            { id: "leg_4", texto: "Brindar capacitaciones a los consejeros y comité de convivencia" },
            { id: "leg_5", texto: "Elaboración/Actualización del manual de convivencia" },
            { id: "leg_6", texto: "Realización de encuesta bimensual de satisfacción" },
            { id: "leg_7", texto: "Realización de planes de trabajo y cronogramas de empresas prestadoras" }
        ]
    }
];

const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const categoriesContainer = document.getElementById('categoriesContainer');
const coveredCountEl = document.getElementById('coveredCount');
const topCategoryEl = document.getElementById('topCategory');
const percentageEl = document.querySelector('.percentage');
const circleEl = document.querySelector('.circle');
const resetBtn = document.getElementById('resetBtn');

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const currentYear = new Date().getFullYear();
const startYear = 2025;
const endYear = 2027;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby0u6twGoAJekyE66rI88Ia4nmKOX84gBA2nXfEDedZ5Wp5u2kimQ3Lx2GJ0xSj87sw/exec';

let appState = {};

function initSelectors() {
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    for (let y = startYear; y <= endYear; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    const now = new Date();
    monthSelect.value = now.getMonth();
    yearSelect.value = now.getFullYear();

    monthSelect.addEventListener('change', loadState);
    yearSelect.addEventListener('change', loadState);
    resetBtn.addEventListener('click', resetCurrentMonth);
}

async function loadState() {
    const year = yearSelect.value;
    const month = months[monthSelect.value];
    const key = `gaphin_control_${year}_${monthSelect.value}`;
    
    // Load local first for immediate UI feedback
    const saved = localStorage.getItem(key);
    appState = saved ? JSON.parse(saved) : {};
    renderCategories();
    updateStats();

    // Fetch from cloud to sync
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        const rows = await response.json();
        
        // rows[0] is header, filter by year and month name
        // We want the latest status for each pointId
        const cloudState = {};
        rows.forEach((row, index) => {
            if (index === 0) return; // skip header
            const [rowYear, rowMonth, pointId, text, status] = row;
            if (rowYear == year && rowMonth == month) {
                cloudState[pointId] = (status === "CUMPLIDO");
            }
        });

        // Update local state if cloud has data
        if (Object.keys(cloudState).length > 0) {
            appState = { ...appState, ...cloudState };
            localStorage.setItem(key, JSON.stringify(appState));
            renderCategories();
            updateStats();
        }
    } catch (e) {
        console.warn("No se pudo sincronizar con la nube al cargar:", e);
    }
}

async function syncWithGoogle(pointId, text, status) {
    const syncIndicator = document.createElement('div');
    syncIndicator.className = 'sync-toast';
    syncIndicator.textContent = 'Sincronizando con la nube...';
    document.body.appendChild(syncIndicator);

    try {
        const payload = {
            year: yearSelect.value,
            month: months[monthSelect.value],
            pointId: pointId,
            text: text,
            status: status
        };

        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors or special headers
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        syncIndicator.textContent = '¡Sincronizado!';
        syncIndicator.classList.add('success');
    } catch (error) {
        console.error('Error syncing:', error);
        syncIndicator.textContent = 'Error al sincronizar';
        syncIndicator.classList.add('error');
    }

    setTimeout(() => syncIndicator.remove(), 2000);
}

function saveState() {
    const key = `gaphin_control_${yearSelect.value}_${monthSelect.value}`;
    localStorage.setItem(key, JSON.stringify(appState));
    updateStats();
}

function resetCurrentMonth() {
    if (confirm("¿Estás seguro de reiniciar los datos de este mes?")) {
        appState = {};
        saveState();
        renderCategories();
    }
}

function renderCategories() {
    categoriesContainer.innerHTML = '';

    obligaciones.forEach(cat => {
        const catCard = document.createElement('div');
        catCard.className = 'category-card';

        const checkedCount = cat.puntos.filter(p => appState[p.id]).length;
        const totalCount = cat.puntos.length;
        const progress = Math.round((checkedCount / totalCount) * 100);

        catCard.innerHTML = `
            <div class="category-header">
                <h4>${cat.categoria}</h4>
                <span class="category-progress" id="prog-${cat.categoria.replace(/\s/g, '')}">${progress}%</span>
            </div>
            <div class="points-list">
                ${cat.puntos.map(p => `
                    <div class="point-item ${appState[p.id] ? 'checked' : ''}" data-id="${p.id}" data-cat="${cat.categoria.replace(/\s/g, '')}" data-text="${p.texto}">
                        <div class="checkbox-wrapper">
                            <div class="checkbox-custom"></div>
                        </div>
                        <span class="point-text">${p.texto}</span>
                    </div>
                `).join('')}
            </div>
        `;

        categoriesContainer.appendChild(catCard);
    });

    document.querySelectorAll('.point-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const catId = item.dataset.cat;
            const text = item.dataset.text;
            appState[id] = !appState[id];
            
            const isChecked = appState[id];
            item.classList.toggle('checked');
            saveState();
            
            // Sync with Google Sheets
            syncWithGoogle(id, text, isChecked);
            
            const cat = obligaciones.find(c => c.categoria.replace(/\s/g, '') === catId);
            const cCount = cat.puntos.filter(p => appState[p.id]).length;
            const prog = Math.round((cCount / cat.puntos.length) * 100);
            document.getElementById(`prog-${catId}`).textContent = `${prog}%`;
        });
    });
}

function updateStats() {
    const allPuntos = obligaciones.flatMap(c => c.puntos);
    const checkedPuntos = allPuntos.filter(p => appState[p.id]).length;
    const totalPuntos = allPuntos.length;
    const totalProgress = totalPuntos > 0 ? Math.round((checkedPuntos / totalPuntos) * 100) : 0;

    coveredCountEl.textContent = `${checkedPuntos} / ${totalPuntos}`;
    percentageEl.textContent = `${totalProgress}%`;
    
    circleEl.style.strokeDasharray = `${totalProgress}, 100`;

    let maxProg = -1;
    let topCat = '-';
    
    obligaciones.forEach(cat => {
        const cCount = cat.puntos.filter(p => appState[p.id]).length;
        const prog = cCount / cat.puntos.length;
        if (prog > maxProg && cCount > 0) {
            maxProg = prog;
            topCat = cat.categoria;
        }
    });
    
    topCategoryEl.textContent = topCat;
}

initSelectors();
loadState();
