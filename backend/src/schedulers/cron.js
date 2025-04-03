// schedulers/cron.js
import cron from 'node-cron';
import checkExpirations from '../scripts/checkProductExpiration.js';

export function setupCronJobs() {
  // Ejecutar verificación de productos a punto de caducar todos los días a las 00:01
  cron.schedule('1 0 * * *', async () => {
    console.log('Ejecutando verificación programada de fechas de vencimiento');
    await checkExpirations();
  });
  
  // También ejecutar verificación cada 12 horas para productos en estado crítico
  cron.schedule('0 */12 * * *', async () => {
    console.log('Verificando productos en estado crítico');
    await checkExpirations();
  });
  
  console.log('Tareas programadas configuradas');
  console.log(`[${new Date().toISOString()}] Iniciando tarea programada de verificación`);
// Ejecución
console.log(`[${new Date().toISOString()}] Finalizada tarea programada de verificación`);
}

export default setupCronJobs;