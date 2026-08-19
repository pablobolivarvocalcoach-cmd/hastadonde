/* Constantes del país y del evento. Actualiza el SMMLV cada enero.
   Hasta Dónde — https://github.com/  ·  licencia MIT  */

const CONFIG = {
  SMMLV: 1750905,              // Decreto 1469 de 2025 — vigente 2026
  anio: 2026,
  sismo: { fecha: '10 de agosto de 2026', magnitud: '7,4', epicentro: 'San José del Palmar, Chocó' }
};

const cop = n => '$' + Math.round(n).toLocaleString('es-CO');
const copCorto = n => n >= 1e9 ? '$' + (n/1e9).toFixed(n%1e9===0?0:1) + ' mil M'
                    : n >= 1e6 ? '$' + (n/1e6).toFixed(n%1e6===0?0:1) + ' M'
                    : cop(n);

export { CONFIG, cop, copCorto };
