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

/* Rangos de deducible de terremoto por ramo. NO son el dato de ninguna
   póliza: son el piso y el techo que se ven en el mercado. Solo se usan
   cuando la persona declara que no conoce su deducible, y en ese caso el
   resultado SIEMPRE se muestra como rango, nunca como cifra única.
   Al verificar contra clausulados reales, ajusta estos números aquí. */
const RANGO_DEDUCIBLE = {
  ph:    { min:{pct:1,   smmlv:3}, max:{pct:3, smmlv:10} },
  pyme:  { min:{pct:1,   smmlv:2}, max:{pct:3, smmlv:6}  },
  hogar: { min:{pct:1,   smmlv:1}, max:{pct:2, smmlv:3}  },
  auto:  { min:{pct:0.5, smmlv:1}, max:{pct:2, smmlv:2}  }
};

export { CONFIG, RANGO_DEDUCIBLE, cop, copCorto };
