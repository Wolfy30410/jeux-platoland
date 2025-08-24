// Configuration de l'API cloud
const API_BASE = 'https://api.jsonbin.io/v3/b';
const API_KEY = 'VOTRE_CLE_API_JSONBIN'; // À obtenir sur jsonbin.io
const BIN_ID = 'VOTRE_BIN_ID'; // ID du stockage

// Données locales avec cache
let players = new Set();
let games = new Set();
let ratings = [];
let isOnline = navigator.onLine;
let gameStatsCache = new Map();
let cacheValid = false;

// Fonctions API
async function loadFromCloud() {
  try {
    updateStatus('syncing', '🔄 Synchronisation...');
    
    const response = await fetch(`${API_BASE}/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY,
        'X-Bin-Meta': 'false'
      }
    });
    
    if (!response.ok) throw new Error('Erreur réseau');
    
    const data = await response.json();
    players = new Set(data.players || []);
    games = new Set(data.games || []);
    ratings = data.ratings || [];
    
    // Backup local
    localStorage.setItem('gamedata_backup', JSON.stringify({players: [...players], games: [...games], ratings}));
    
    updateStatus('online', '🟢 En ligne');
    return true;
  } catch (error) {
    console.error('Erreur chargement:', error);
    loadFromLocal();
    updateStatus('offline', '🔴 Hors ligne');
    return false;
  }
}

async function saveToCloud() {
  if (!isOnline) {
    updateStatus('offline', '🔴 Sauvegarde locale uniquement');
    saveToLocal();
    return false;
  }
  
  try {
    updateStatus('syncing', '🔄 Sauvegarde...');
    
    const data = {
      players: [...players],
      games: [...games],
      ratings: ratings,
      lastUpdate: new Date().toISOString()
    };
    
    const response = await fetch(`${API_BASE}/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Erreur sauvegarde');
    
    // Backup local aussi
    saveToLocal();
    updateStatus('online', '🟢 Synchronisé');
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    updateStatus('offline', '🔴 Erreur sync');
    saveToLocal();
    return false;
  }
}

function loadFromLocal() {
  const backup = localStorage.getItem('gamedata_backup');
  if (backup) {
    const data = JSON.parse(backup);
    players = new Set(data.players || []);
    games = new Set(data.games || []);
    ratings = data.ratings || [];
  }
}

function saveToLocal() {
  localStorage.setItem('gamedata_backup', JSON.stringify({
    players: [...players],
    games: [...games],
    ratings: ratings
  }));
}

function updateStatus(type, message) {
  const status = document.getElementById('connectionStatus');
  status.className = `status ${type}`;
  status.textContent = message;
}

// Gestion connexion
window.addEventListener('online', () => {
  isOnline = true;
  loadFromCloud().then(() => redrawAll());
});

window.addEventListener('offline', () => {
  isOnline = false;
  updateStatus('offline', '🔴 Hors ligne');
});

// Reste du code identique à votre version actuelle...
// (toutes les fonctions : getGameStats, renderGamesList, etc.)