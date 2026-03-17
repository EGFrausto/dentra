const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const DEFAULTS = {
  dc_patients: [
    { id: '1', name: 'Sofía Ramírez Torres', phone: '+57 315 456 7890', email: 'sofia.ramirez@hotmail.com', cedula: '1234567890', birthdate: '1990-05-12', gender: 'Femenino', blood_type: 'O+', address: 'Calle 45 #12-34', emergency_contact: 'Pedro Ramírez', emergency_phone: '+57 315 111 2222', allergies: 'Penicilina', notes: 'Hipertensión leve' },
    { id: '2', name: 'María Fernanda López', phone: '+57 310 234 5678', email: 'maria.lopez@email.com', cedula: '9876543210', birthdate: '1985-11-22', gender: 'Femenino', blood_type: 'A+', address: 'Carrera 7 #89-01', emergency_contact: 'Juan López', emergency_phone: '+57 310 333 4444', allergies: '', notes: '' },
    { id: '3', name: 'Carlos Andrés Martínez', phone: '+57 320 987 6543', email: 'carlos.martinez@gmail.com', cedula: '5555555555', birthdate: '1978-03-08', gender: 'Masculino', blood_type: 'B+', address: 'Av. 68 #23-45', emergency_contact: 'Ana Martínez', emergency_phone: '+57 320 555 6666', allergies: 'Ibuprofeno', notes: 'Diabético' },
  ],
  dc_appointments: [
    { id: '1', patient_id: '2', date: today, time: '09:00', duration: 45, status: 'Confirmada', treatment: 'Limpieza dental', notes: '', reminder_sent: true },
    { id: '2', patient_id: '3', date: today, time: '10:30', duration: 60, status: 'Programada', treatment: 'Endodoncia (conducto)', notes: 'Pieza 36', reminder_sent: false },
    { id: '3', patient_id: '1', date: tomorrow, time: '14:00', duration: 30, status: 'Programada', treatment: 'Consulta general', notes: '', reminder_sent: false },
  ],
  dc_records: [],
  dc_xrays: [],
  dc_inventory: [
    { id: '1', name: 'Composite A2', category: 'Materiales de restauración', quantity: 8, unit: 'jeringas', min_stock: 5, notes: '' },
    { id: '2', name: 'Anestesia Lidocaína 2%', category: 'Anestésicos', quantity: 3, unit: 'cajas', min_stock: 5, notes: 'Reabastecer pronto' },
    { id: '3', name: 'Guantes nitrilo M', category: 'EPP', quantity: 200, unit: 'unidades', min_stock: 100, notes: '' },
    { id: '4', name: 'Mascarillas N95', category: 'EPP', quantity: 45, unit: 'unidades', min_stock: 30, notes: '' },
    { id: '5', name: 'Limas endodónticas #25', category: 'Instrumental', quantity: 12, unit: 'unidades', min_stock: 10, notes: '' },
  ],
  dc_config: {
    clinic_name: 'DentalCare',
    doctor: 'Dr. Nombre Apellido',
    address: 'Calle 123 #45-67, Ciudad',
    phone: '+57 300 000 0000',
    email: 'contacto@dentalcare.com',
    schedule: 'Lunes a Viernes 8:00am - 6:00pm',
    logo_color: '#0d9488',
  },
};

function load(key) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : DEFAULTS[key];
  } catch { return DEFAULTS[key]; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function makeStore(key) {
  return {
    get: () => load(key),
    set: (val) => save(key, val),
    add: (item) => {
      const items = load(key);
      const newItem = { ...item, id: Date.now().toString() };
      save(key, [...items, newItem]);
      return newItem;
    },
    update: (id, data) => {
      save(key, load(key).map(i => i.id === id ? { ...i, ...data } : i));
    },
    remove: (id) => { save(key, load(key).filter(i => i.id !== id)); },
  };
}

export const patients    = makeStore('dc_patients');
export const appointments = makeStore('dc_appointments');
export const records     = makeStore('dc_records');
export const xrays       = makeStore('dc_xrays');
export const inventory   = makeStore('dc_inventory');

export const config = {
  get: () => load('dc_config'),
  set: (val) => save('dc_config', val),
};
