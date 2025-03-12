/**
 * Event Store module
 * Handles saving, retrieving, and managing Lambda test events
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Determinar el directorio de almacenamiento:
// 1. Preferir directorio .lambdaTestRunner en el directorio de trabajo actual
// 2. Como respaldo, usar directorio .lambdaTestRunner en el directorio home del usuario
function getEventStoreDir() {
  // Intentar usar el directorio del proyecto actual
  const projectDir = process.cwd();
  const projectEventStoreDir = path.join(projectDir, '.lambdaRunning', 'events');
  
  // Directorio alternativo en el home del usuario (para compatibilidad con versiones anteriores)
  const homeEventStoreDir = path.join(os.homedir(), '.lambdaRunning', 'events');
  
  // Verificar si podemos escribir en el directorio del proyecto
  try {
    // Intentar crear el directorio en el proyecto si no existe
    if (!fs.existsSync(projectEventStoreDir)) {
      fs.mkdirSync(projectEventStoreDir, { recursive: true });
    }
    // Probar si tenemos permisos de escritura creando un archivo temporal
    const testFile = path.join(projectEventStoreDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    return projectEventStoreDir;
  } catch (error) {
    // Si no podemos escribir en el directorio del proyecto, usar el home del usuario
    console.warn(`No se puede usar el directorio del proyecto para almacenar eventos. Usando el directorio home.`);
    
    // Asegurar que el directorio en el home exista
    if (!fs.existsSync(homeEventStoreDir)) {
      fs.mkdirSync(homeEventStoreDir, { recursive: true });
    }
    
    return homeEventStoreDir;
  }
}

// Directory where events will be stored - se calculará dinámicamente
let EVENT_STORE_DIR;

// Ensure the event store directory exists
function ensureEventStoreExists() {
  if (!EVENT_STORE_DIR) {
    EVENT_STORE_DIR = getEventStoreDir();
  }
  
  if (!fs.existsSync(EVENT_STORE_DIR)) {
    try {
      fs.mkdirSync(EVENT_STORE_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create event store directory:', error);
      throw error;
    }
  }
  
  return EVENT_STORE_DIR;
}

/**
 * Save an event to the event store
 * @param {string} name - Name for the event
 * @param {Object} event - Event data
 * @param {string} category - Optional category for organization (default: 'default')
 * @returns {Object} - Saved event info
 */
function saveEvent(name, event, category = 'default') {
  const storeDir = ensureEventStoreExists();
  
  // Sanitize the name for use as a filename
  const sanitizedName = name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
  
  // Create category directory if it doesn't exist
  const categoryDir = path.join(storeDir, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  
  // Create the event file - Guardar directamente el JSON de datos
  const eventPath = path.join(categoryDir, `${sanitizedName}.json`);
  fs.writeFileSync(eventPath, JSON.stringify(event, null, 2));
  
  return {
    name,
    category,
    path: eventPath
  };
}

/**
 * Get events from the event store
 * @param {string} category - Optional category to filter by
 * @returns {Array<Object>} - Array of event objects
 */
function getEvents(category = null) {
  const storeDir = ensureEventStoreExists();
  
  try {
    const events = [];
    
    // If category is specified, only look in that directory
    if (category) {
      const categoryDir = path.join(storeDir, category);
      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir);
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const eventPath = path.join(categoryDir, file);
            const eventContent = fs.readFileSync(eventPath, 'utf8');
            try {
              // Extraer nombre del evento del nombre del archivo
              const eventName = file.replace('.json', '');
              const data = JSON.parse(eventContent);
              events.push({
                name: eventName,
                category: category,
                timestamp: fs.statSync(eventPath).mtime.toISOString(), // Usar fecha de modificación del archivo
                data: data,
                path: eventPath
              });
            } catch (error) {
              console.warn(`Could not parse event file: ${eventPath}`);
            }
          }
        });
      }
    } else {
      // Get all categories
      const categories = fs.readdirSync(storeDir);
      categories.forEach(categoryName => {
        const categoryDir = path.join(storeDir, categoryName);
        if (fs.statSync(categoryDir).isDirectory()) {
          const files = fs.readdirSync(categoryDir);
          files.forEach(file => {
            if (file.endsWith('.json')) {
              const eventPath = path.join(categoryDir, file);
              const eventContent = fs.readFileSync(eventPath, 'utf8');
              try {
                // Extraer nombre del evento del nombre del archivo
                const eventName = file.replace('.json', '');
                const data = JSON.parse(eventContent);
                events.push({
                  name: eventName,
                  category: categoryName,
                  timestamp: fs.statSync(eventPath).mtime.toISOString(), // Usar fecha de modificación del archivo
                  data: data,
                  path: eventPath
                });
              } catch (error) {
                console.warn(`Could not parse event file: ${eventPath}`);
              }
            }
          });
        }
      });
    }
    
    // Sort by timestamp, newest first
    return events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
}

/**
 * Get a specific event by name
 * @param {string} name - Name of the event
 * @param {string} category - Category of the event (default: 'default')
 * @returns {Object|null} - Event data or null if not found
 */
function getEvent(name, category = 'default') {
  const storeDir = ensureEventStoreExists();
  
  const sanitizedName = name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
  const eventPath = path.join(storeDir, category, `${sanitizedName}.json`);
  
  if (fs.existsSync(eventPath)) {
    try {
      const eventContent = fs.readFileSync(eventPath, 'utf8');
      const data = JSON.parse(eventContent);
      // Reconstruir el objeto con metadatos para mantener la estructura de retorno
      return {
        name,
        category,
        timestamp: fs.statSync(eventPath).mtime.toISOString(),
        data, // Ahora data contiene directamente el JSON del evento
        path: eventPath
      };
    } catch (error) {
      console.error(`Error reading event ${name}:`, error);
      return null;
    }
  }
  
  return null;
}

/**
 * Delete an event from the store
 * @param {string} name - Name of the event
 * @param {string} category - Category of the event (default: 'default')
 * @returns {boolean} - Whether the deletion was successful
 */
function deleteEvent(name, category = 'default') {
  const storeDir = ensureEventStoreExists();
  
  const sanitizedName = name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
  const eventPath = path.join(storeDir, category, `${sanitizedName}.json`);
  
  if (fs.existsSync(eventPath)) {
    try {
      fs.unlinkSync(eventPath);
      return true;
    } catch (error) {
      console.error(`Error deleting event ${name}:`, error);
      return false;
    }
  }
  
  return false;
}

module.exports = {
  saveEvent,
  getEvents,
  getEvent,
  deleteEvent
}; 