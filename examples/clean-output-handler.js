/**
 * Example Lambda handler that demonstrates clean output
 * Shows how logs de la función lambda aparecen en el Output
 * mientras que logs de sistema no aparecen
 */

// Handler function that returns environment information
exports.handler = async (event, context) => {
  // Los console.log estándar ahora aparecerán solo en el Output
  console.log('Este log solo se muestra en Output');
  console.warn('Este warning también aparece en Output');
  
  // Usar lambdaLog para garantizar que algo aparezca en Output
  if (global.lambdaLog) {
    global.lambdaLog('Este mensaje usa lambdaLog() y siempre se muestra en Output');
  }
  
  // Este log de sistema no se mostrará en Output
  if (global.systemLog) {
    global.systemLog('Este mensaje usa systemLog() y nunca se muestra en Output');
  }
  
  // Simulando procesamiento
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Retornar algo significativo
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Función ejecutada con output limpio',
        eventReceived: event,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ),
  };
}; 