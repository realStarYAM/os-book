/**
 * ============================================
 * OS Book - Visual Novel Engine v4.0
 * La Saga Complète de Windows (2017-2025)
 * 4 Actes Chronologiques
 * ============================================
 */

// ============================================
// GESTIONNAIRE AUDIO - DEUX CANAUX SÉPARÉS
// ============================================

// Canal pour la musique de fond (BGM)
let musicPlayer = new Audio();
musicPlayer.loop = true;

// Canal pour les effets sonores (SFX) - ne coupe PAS la musique
let sfxPlayer = new Audio();

// Référence globale pour compatibilité WMP
let globalAudio = musicPlayer;

// ============================================
// INTELLIGENT MUSIC SYSTEM - Musique contextuelle + BPM
// ============================================

/**
 * Configuration des pistes audio avec métadonnées BPM et contexte
 */
const MUSIC_TRACKS = {
    // Musiques Windows épiques
    win11: {
        file: 'music/Windows 11 Remix.mp3',
        bpm: 128,
        mood: 'epic',
        scenes: ['hospital', 'graveyard'],
        intensity: 'high',
        name: 'Windows 11 Remix'
    },
    win10: {
        file: 'music/Windows 10 Remix.mp3',
        bpm: 120,
        mood: 'dramatic',
        scenes: ['hospital'],
        intensity: 'medium',
        name: 'Windows 10 Remix'
    },
    win7: {
        file: 'music/Windows 7 Remix 2 (By SilverWolf).mp3',
        bpm: 110,
        mood: 'nostalgic',
        scenes: ['graveyard', 'void'],
        intensity: 'medium',
        name: 'Windows 7 Remix'
    },
    vista: {
        file: 'music/Windows Vista Remix (By SilverWolf).mp3',
        bpm: 115,
        mood: 'dramatic',
        scenes: ['hospital', 'graveyard'],
        intensity: 'medium',
        name: 'Windows Vista Remix'
    },
    vista_hello: {
        file: 'music/Hello Windows Vista Vista Sounds Remix High Quality.mp3',
        bpm: 100,
        mood: 'calm',
        scenes: ['void'],
        intensity: 'low',
        name: 'Hello Windows Vista'
    },
    longhorn: {
        file: 'music/LongHorn Day (Windows Longhorn Remix).mp3',
        bpm: 105,
        mood: 'mysterious',
        scenes: ['void'],
        intensity: 'low',
        name: 'Longhorn Day'
    },
    win95: {
        file: 'music/95 (Windows Classic Remix).mp3',
        bpm: 95,
        mood: 'classic',
        scenes: ['graveyard'],
        intensity: 'low',
        name: 'Windows 95 Classic'
    },
    vienna: {
        file: 'music/Windows Vienna Sounds Remix.mp3',
        bpm: 90,
        mood: 'calm',
        scenes: ['void'],
        intensity: 'low',
        name: 'Windows Vienna'
    },
    xp_install: {
        file: 'music/Windows XP installation music.mp3',
        bpm: 75,
        mood: 'peaceful',
        scenes: ['void'],
        intensity: 'low',
        name: 'Windows XP Installation'
    },
    xp_error: {
        file: 'music/Windows XP Error Remix.mp3',
        bpm: 140,
        mood: 'chaotic',
        scenes: ['hospital', 'graveyard'],
        intensity: 'high',
        name: 'Windows XP Error Remix'
    },
    win8_error: {
        file: 'music/rgLed - Windows 8 Error Dubstep Remix!.mp3',
        bpm: 150,
        mood: 'intense',
        scenes: ['graveyard'],
        intensity: 'high',
        name: 'Windows 8 Error Dubstep'
    },
    mac: {
        file: 'music/Mac Startup Remix Extended.mp3',
        bpm: 108,
        mood: 'epic',
        scenes: ['hospital', 'void'],
        intensity: 'medium',
        name: 'Mac Startup Remix'
    }
};

/**
 * Mapping scène → pistes recommandées
 */
const SCENE_MUSIC_MAP = {
    hospital: ['win11', 'win10', 'vista'],
    graveyard: ['win7', 'win95', 'xp_error'],
    void: ['xp_install', 'longhorn', 'vienna'],
    linux_world: ['mac'],
    default: ['win11']
};

/**
 * Mapping mood → pistes
 */
const MOOD_MUSIC_MAP = {
    epic: ['win11', 'mac'],
    dramatic: ['win10', 'vista'],
    calm: ['vista_hello', 'vienna', 'xp_install'],
    chaotic: ['xp_error', 'win8_error'],
    nostalgic: ['win7', 'win95'],
    mysterious: ['longhorn'],
    combat: ['xp_error', 'win8_error', 'win11']
};

/**
 * Gestionnaire de musique intelligente avec changement contextuel
 */
const IntelligentMusicManager = {
    currentTrackId: null,
    currentBPM: 100,
    isPlaying: false,
    isCrossfading: false,
    crossfadePlayer: null,
    volume: 0.5,

    /**
     * Initialise le gestionnaire
     */
    init() {
        this.crossfadePlayer = new Audio();
        this.crossfadePlayer.loop = true;
        console.log('🎵 IntelligentMusicManager initialisé');
    },

    /**
     * Joue une piste par son ID
     * @param {string} trackId - ID de la piste
     * @param {Object} options - Options (crossfade, etc.)
     */
    play(trackId, options = {}) {
        const track = MUSIC_TRACKS[trackId];
        if (!track) {
            console.warn(`🎵 Piste "${trackId}" non trouvée`);
            return false;
        }

        const useCrossfade = options.crossfade !== false && this.isPlaying;

        if (useCrossfade && this.currentTrackId !== trackId) {
            this.crossfade(trackId, options.duration || 2000);
        } else if (this.currentTrackId !== trackId) {
            musicPlayer.src = track.file;
            musicPlayer.volume = this.volume;
            musicPlayer.play().catch(e => console.warn('🎵 Autoplay bloqué:', e));
            this.currentTrackId = trackId;
            this.currentBPM = track.bpm;
            this.isPlaying = true;
            this.updateBPMDisplay();
            console.log(`🎵 Playing: ${track.name} (${track.bpm} BPM)`);
        }

        return true;
    },

    /**
     * Transition en fondu enchaîné
     * @param {string} newTrackId - Nouvelle piste
     * @param {number} duration - Durée du crossfade en ms
     */
    crossfade(newTrackId, duration = 2000) {
        if (this.isCrossfading) return;

        const newTrack = MUSIC_TRACKS[newTrackId];
        if (!newTrack) return;

        this.isCrossfading = true;
        const steps = 20;
        const stepDuration = duration / steps;
        const oldVolume = musicPlayer.volume;
        let step = 0;

        // Préparer la nouvelle piste
        this.crossfadePlayer.src = newTrack.file;
        this.crossfadePlayer.volume = 0;
        this.crossfadePlayer.currentTime = 0;
        this.crossfadePlayer.play().catch(e => console.warn('🎵 Autoplay bloqué:', e));

        const fadeInterval = setInterval(() => {
            step++;
            const progress = step / steps;

            // Fade out ancien
            musicPlayer.volume = oldVolume * (1 - progress);
            // Fade in nouveau
            this.crossfadePlayer.volume = this.volume * progress;

            if (step >= steps) {
                clearInterval(fadeInterval);

                // Swap players
                musicPlayer.pause();
                musicPlayer.src = newTrack.file;
                musicPlayer.currentTime = this.crossfadePlayer.currentTime;
                musicPlayer.volume = this.volume;
                musicPlayer.play().catch(() => { });

                this.crossfadePlayer.pause();
                this.crossfadePlayer.src = '';

                this.currentTrackId = newTrackId;
                this.currentBPM = newTrack.bpm;
                this.isCrossfading = false;
                this.updateBPMDisplay();

                console.log(`🎵 Crossfade terminé: ${newTrack.name} (${newTrack.bpm} BPM)`);
            }
        }, stepDuration);
    },

    /**
     * Change la musique selon la scène
     * @param {string} sceneType - Type de scène (hospital, graveyard, void)
     */
    setSceneMusic(sceneType) {
        const tracks = SCENE_MUSIC_MAP[sceneType] || SCENE_MUSIC_MAP.default;
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        this.play(randomTrack);
    },

    /**
     * Change la musique selon l'ambiance
     * @param {string} mood - Ambiance (epic, calm, chaotic, etc.)
     */
    setMoodMusic(mood) {
        const tracks = MOOD_MUSIC_MAP[mood] || MOOD_MUSIC_MAP.epic;
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        this.play(randomTrack);
    },

    /**
     * Pause la musique
     */
    pause() {
        musicPlayer.pause();
        this.isPlaying = false;
    },

    /**
     * Reprend la lecture
     */
    resume() {
        if (this.currentTrackId) {
            musicPlayer.play().catch(() => { });
            this.isPlaying = true;
        }
    },

    /**
     * Arrête la musique
     */
    stop() {
        musicPlayer.pause();
        musicPlayer.currentTime = 0;
        this.isPlaying = false;
        this.currentTrackId = null;
    },

    /**
     * Définit le volume
     * @param {number} vol - Volume (0-1)
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        musicPlayer.volume = this.volume;
        if (this.crossfadePlayer) {
            this.crossfadePlayer.volume = this.volume;
        }
    },

    /**
     * Retourne le BPM actuel
     * @returns {number}
     */
    getBPM() {
        return this.currentBPM;
    },

    /**
     * Retourne les infos de la piste actuelle
     * @returns {Object|null}
     */
    getCurrentTrack() {
        if (!this.currentTrackId) return null;
        return { id: this.currentTrackId, ...MUSIC_TRACKS[this.currentTrackId] };
    },

    /**
     * Met à jour l'affichage du BPM dans l'UI
     */
    updateBPMDisplay() {
        const bpmDisplay = document.getElementById('mp-bpm-value');
        if (bpmDisplay) {
            bpmDisplay.textContent = this.currentBPM;
            // Animation pulse selon le BPM
            const pulseDuration = 60000 / this.currentBPM; // ms par beat
            bpmDisplay.style.setProperty('--bpm-pulse-duration', `${pulseDuration}ms`);
        }
    },

    /**
     * Liste toutes les pistes disponibles
     * @returns {Object}
     */
    getTracks() {
        return { ...MUSIC_TRACKS };
    }
};

/**
 * Gestionnaire de synchronisation BPM ↔ Vitesse du texte
 */
const BPMSyncManager = {
    enabled: true,
    baseTypingSpeed: 35, // ms par caractère (vitesse de base)
    minSpeed: 10,        // Vitesse minimum (texte très rapide)
    maxSpeed: 80,        // Vitesse maximum (texte très lent)

    /**
     * Calcule la vitesse de frappe selon le BPM actuel
     * BPM élevé = texte plus rapide
     * @returns {number} - Vitesse en ms par caractère
     */
    getTypingSpeed() {
        if (!this.enabled) {
            return this.baseTypingSpeed;
        }

        const bpm = IntelligentMusicManager.getBPM();
        // Normaliser: 100 BPM = vitesse de base
        // 150 BPM = ~23ms, 75 BPM = ~47ms
        const factor = bpm / 100;
        const speed = Math.round(this.baseTypingSpeed / factor);

        // Clamper entre min et max
        return Math.max(this.minSpeed, Math.min(this.maxSpeed, speed));
    },

    /**
     * Calcule le délai entre les phrases selon le BPM
     * @returns {number} - Délai en ms
     */
    getPhraseDelay() {
        const bpm = IntelligentMusicManager.getBPM();
        // 1 beat = 60000/bpm ms
        return Math.round(60000 / bpm);
    },

    /**
     * Active/désactive la synchronisation BPM
     */
    toggle() {
        this.enabled = !this.enabled;
        console.log(`🎵 BPM Sync: ${this.enabled ? 'ON' : 'OFF'}`);
        return this.enabled;
    },

    /**
     * Définit la vitesse de base
     * @param {number} speed - Vitesse en ms
     */
    setBaseSpeed(speed) {
        this.baseTypingSpeed = Math.max(5, Math.min(100, speed));
    },

    /**
     * Retourne l'état actuel
     * @returns {Object}
     */
    getStatus() {
        return {
            enabled: this.enabled,
            currentSpeed: this.getTypingSpeed(),
            baseBPM: IntelligentMusicManager.getBPM(),
            phraseDelay: this.getPhraseDelay()
        };
    }
};

// Fonctions globales pour compatibilité
function playTrack(trackId, options) { return IntelligentMusicManager.play(trackId, options); }
function setSceneMusic(scene) { IntelligentMusicManager.setSceneMusic(scene); }
function setMoodMusic(mood) { IntelligentMusicManager.setMoodMusic(mood); }
function getBPM() { return IntelligentMusicManager.getBPM(); }
function getTypingSpeedFromBPM() { return BPMSyncManager.getTypingSpeed(); }
function toggleBPMSync() { return BPMSyncManager.toggle(); }

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    IntelligentMusicManager.init();
});

// ============================================
// CORRUPTION SYSTEM - Effets ChromeOS progressifs
// ============================================

/**
 * Caractères de corruption pour le texte glitch
 */
const CORRUPTION_CHARS = '█▓▒░╔╗╚╝║═╬╣╠╩╦▀▄■□●○◘◙♠♣♥♦☺☻♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼0123456789ABCDEF';

/**
 * Gestionnaire de corruption progressive
 * Plus ChromeOS agit, plus l'UI se corrompt
 */
const CorruptionManager = {
    level: 0,           // Niveau actuel (0-100)
    maxLevel: 100,
    minLevel: 0,
    isActive: false,

    // Audio context pour les sons glitch
    audioContext: null,
    glitchInterval: null,
    textGlitchInterval: null,

    // Éléments DOM
    targetElements: ['#dialogue-text', '#speaker-name', '.dialogue-box'],

    // Seuils pour les niveaux visuels
    thresholds: {
        level1: 20,  // Tremblement subtil
        level2: 40,  // Scanlines + distorsion légère
        level3: 60,  // Couleurs altérées
        level4: 80,  // Forte distorsion
        level5: 95   // Chaos total
    },

    /**
     * Initialise le système de corruption
     */
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('⚠️ Web Audio API non disponible');
        }
        console.log('💀 CorruptionManager initialisé');
    },

    /**
     * Augmente le niveau de corruption
     * @param {number} amount - Quantité à ajouter
     */
    increase(amount = 10) {
        const oldLevel = this.level;
        this.level = Math.min(this.maxLevel, this.level + amount);

        if (!this.isActive && this.level > 0) {
            this.isActive = true;
        }

        this.applyEffects();
        this.playGlitchSound();

        console.log(`💀 Corruption: ${oldLevel} → ${this.level}`);
        return this.level;
    },

    /**
     * Diminue le niveau de corruption (purification)
     * @param {number} amount - Quantité à retirer
     */
    decrease(amount = 10) {
        const oldLevel = this.level;
        this.level = Math.max(this.minLevel, this.level - amount);

        if (this.level === 0) {
            this.isActive = false;
            this.clearAllEffects();
        } else {
            this.applyEffects();
        }

        console.log(`✨ Purification: ${oldLevel} → ${this.level}`);
        return this.level;
    },

    /**
     * Reset complet de la corruption
     */
    reset() {
        this.level = 0;
        this.isActive = false;
        this.clearAllEffects();
        console.log('✨ Corruption réinitialisée');
    },

    /**
     * Applique les effets visuels selon le niveau
     */
    applyEffects() {
        const body = document.body;
        const visualLevel = this.getVisualLevel();

        // Mettre à jour l'attribut data-corruption
        body.setAttribute('data-corruption', visualLevel);

        // Appliquer les classes CSS
        body.classList.remove('corruption-level-1', 'corruption-level-2', 'corruption-level-3', 'corruption-level-4', 'corruption-level-5');

        if (visualLevel > 0) {
            body.classList.add(`corruption-level-${visualLevel}`);
        }

        // Appliquer le hue-rotate progressif
        const hueShift = (this.level / this.maxLevel) * 60; // 0 à 60 degrés
        body.style.setProperty('--corruption-hue', `${hueShift}deg`);
        body.style.setProperty('--corruption-intensity', this.level / this.maxLevel);

        // Démarrer/arrêter le glitch de texte selon le niveau
        if (visualLevel >= 2 && !this.textGlitchInterval) {
            this.startTextGlitch();
        } else if (visualLevel < 2 && this.textGlitchInterval) {
            this.stopTextGlitch();
        }

        // Sons glitch continus au niveau max
        if (visualLevel >= 5 && !this.glitchInterval) {
            this.startContinuousGlitch();
        } else if (visualLevel < 5 && this.glitchInterval) {
            this.stopContinuousGlitch();
        }
    },

    /**
     * Retourne le niveau visuel (1-5) basé sur le niveau de corruption
     * @returns {number}
     */
    getVisualLevel() {
        if (this.level >= this.thresholds.level5) return 5;
        if (this.level >= this.thresholds.level4) return 4;
        if (this.level >= this.thresholds.level3) return 3;
        if (this.level >= this.thresholds.level2) return 2;
        if (this.level >= this.thresholds.level1) return 1;
        return 0;
    },

    /**
     * Efface tous les effets de corruption
     */
    clearAllEffects() {
        const body = document.body;
        body.removeAttribute('data-corruption');
        body.classList.remove('corruption-level-1', 'corruption-level-2', 'corruption-level-3', 'corruption-level-4', 'corruption-level-5');
        body.style.removeProperty('--corruption-hue');
        body.style.removeProperty('--corruption-intensity');

        this.stopTextGlitch();
        this.stopContinuousGlitch();
    },

    /**
     * Démarre le glitch de texte
     */
    startTextGlitch() {
        if (this.textGlitchInterval) return;

        this.textGlitchInterval = setInterval(() => {
            this.applyTextGlitch();
        }, 100 - (this.getVisualLevel() * 15)); // Plus rapide aux niveaux élevés
    },

    /**
     * Arrête le glitch de texte
     */
    stopTextGlitch() {
        if (this.textGlitchInterval) {
            clearInterval(this.textGlitchInterval);
            this.textGlitchInterval = null;
        }
    },

    /**
     * Applique un effet de glitch au texte affiché
     */
    applyTextGlitch() {
        const dialogueEl = document.getElementById('dialogue-visual');
        if (!dialogueEl || !dialogueEl.textContent) return;

        const visualLevel = this.getVisualLevel();
        const glitchChance = visualLevel * 0.05; // 5% à 25% de chance

        // Glitch aléatoire sur le texte
        const spans = dialogueEl.querySelectorAll('span');
        spans.forEach(span => {
            if (Math.random() < glitchChance) {
                span.classList.add('text-glitch');
                setTimeout(() => span.classList.remove('text-glitch'), 50 + Math.random() * 100);
            }
        });

        // À haut niveau, ajouter des caractères parasites
        if (visualLevel >= 4 && Math.random() < 0.1) {
            const parasite = document.createElement('span');
            parasite.className = 'corruption-parasite';
            parasite.textContent = CORRUPTION_CHARS[Math.floor(Math.random() * CORRUPTION_CHARS.length)];
            dialogueEl.appendChild(parasite);
            setTimeout(() => parasite.remove(), 200);
        }
    },

    /**
     * Joue un son de glitch
     */
    playGlitchSound() {
        if (!this.audioContext) return;

        const visualLevel = this.getVisualLevel();
        if (visualLevel < 2) return; // Pas de son aux bas niveaux

        try {
            // Créer un oscillateur pour le son glitch
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Type et fréquence selon le niveau
            oscillator.type = visualLevel >= 4 ? 'sawtooth' : 'square';
            oscillator.frequency.setValueAtTime(
                100 + Math.random() * 500 * visualLevel,
                this.audioContext.currentTime
            );

            // Volume basé sur le niveau (faible pour ne pas être trop agressif)
            const volume = 0.02 + (visualLevel * 0.015);
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            // Ignorer les erreurs audio silencieusement
        }
    },

    /**
     * Démarre les sons glitch continus (niveau max)
     */
    startContinuousGlitch() {
        if (this.glitchInterval) return;

        this.glitchInterval = setInterval(() => {
            if (Math.random() < 0.3) {
                this.playGlitchSound();
            }
        }, 200);
    },

    /**
     * Arrête les sons glitch continus
     */
    stopContinuousGlitch() {
        if (this.glitchInterval) {
            clearInterval(this.glitchInterval);
            this.glitchInterval = null;
        }
    },

    /**
     * Corrompt un texte avec des caractères glitch
     * @param {string} text - Texte original
     * @returns {string} - Texte corrompu
     */
    corruptText(text) {
        if (!text || this.level < this.thresholds.level3) return text;

        const corruptChance = (this.level - this.thresholds.level2) / 100;
        let result = '';

        for (let char of text) {
            if (Math.random() < corruptChance && char !== ' ') {
                result += CORRUPTION_CHARS[Math.floor(Math.random() * CORRUPTION_CHARS.length)];
            } else {
                result += char;
            }
        }

        return result;
    },

    /**
     * Retourne le niveau actuel
     * @returns {number}
     */
    getLevel() {
        return this.level;
    },

    /**
     * Retourne l'état actuel
     * @returns {Object}
     */
    getStatus() {
        return {
            level: this.level,
            visualLevel: this.getVisualLevel(),
            isActive: this.isActive,
            maxLevel: this.maxLevel
        };
    }
};

// Fonctions globales pour la corruption
function corruptionIncrease(amount) { return CorruptionManager.increase(amount); }
function corruptionDecrease(amount) { return CorruptionManager.decrease(amount); }
function corruptionReset() { CorruptionManager.reset(); }
function getCorruptionLevel() { return CorruptionManager.getLevel(); }
function corruptText(text) { return CorruptionManager.corruptText(text); }

// Initialisation du système de corruption
document.addEventListener('DOMContentLoaded', () => {
    CorruptionManager.init();
});


// ============================================
// UI LOADER - Système de chargement d'interfaces
// ============================================

/**
 * Gestionnaire d'UI pour charger et afficher les interfaces dynamiquement
 * avec des transitions fluides (fade in / fade out)
 */
const UIManager = {
    loader: null,
    currentUI: null,
    isTransitioning: false,

    // Configuration des UI disponibles
    screens: {
        menu: { element: 'start-screen', title: 'Menu Principal', isModal: false },
        chapitre: { element: 'chapter-modal', title: 'Sélection de Chapitre', isModal: true },
        pause: { element: 'menu-panel', title: 'Menu Pause', isModal: true },
        choix: { element: 'choice-panel', title: 'Choix', isModal: true },
        fin: { element: 'end-screen', title: 'Fin du Jeu', isModal: false },
        jeu: { element: 'vn-scene', title: 'Scène de Jeu', isModal: false }
    },

    /**
     * Initialise le UIManager (appelé automatiquement)
     */
    init() {
        this.loader = document.getElementById('ui-loader');
        if (!this.loader) {
            console.warn('⚠️ UI Loader element not found');
        }
    },

    /**
     * Affiche l'overlay de chargement
     */
    showLoader() {
        if (!this.loader) this.init();
        if (this.loader) {
            this.loader.classList.add('active');
            this.loader.setAttribute('aria-hidden', 'false');
        }
    },

    /**
     * Cache l'overlay de chargement
     */
    hideLoader() {
        if (this.loader) {
            this.loader.classList.remove('active');
            this.loader.setAttribute('aria-hidden', 'true');
        }
    },

    /**
     * Charge et affiche une UI avec transition
     * @param {string} name - Nom de l'UI (menu, chapitre, pause, choix, fin, jeu)
     * @param {Object} options - Options de transition
     * @returns {Promise<boolean>} - Succès du chargement
     */
    async loadUI(name, options = {}) {
        const screen = this.screens[name];
        if (!screen) {
            console.warn(`⚠️ UI "${name}" non trouvée. UI disponibles: ${Object.keys(this.screens).join(', ')}`);
            return false;
        }

        // Éviter les transitions multiples simultanées
        if (this.isTransitioning) {
            console.log('⏳ Transition en cours, ignorée');
            return false;
        }
        this.isTransitioning = true;

        try {
            // Afficher le loader
            this.showLoader();

            // Délai minimum pour voir l'animation (optionnel)
            const minDelay = options.minDelay ?? 300;
            await new Promise(resolve => setTimeout(resolve, minDelay));

            // Cacher l'UI actuelle avec fade-out (si non-modale)
            if (this.currentUI && !this.currentUI.isModal) {
                const currentEl = document.getElementById(this.currentUI.element);
                if (currentEl) {
                    currentEl.classList.remove('active');
                }
            }

            // Afficher la nouvelle UI
            const targetEl = document.getElementById(screen.element);
            if (targetEl) {
                // Pour les modales, utiliser 'open', sinon 'active'
                if (screen.isModal) {
                    targetEl.classList.add('open');
                } else {
                    targetEl.classList.add('active');
                }
                this.currentUI = screen;
                console.log(`✅ UI chargée: ${screen.title}`);
            } else {
                console.warn(`⚠️ Element "${screen.element}" introuvable dans le DOM`);
            }

            // Cacher le loader
            this.hideLoader();

            return true;
        } finally {
            this.isTransitioning = false;
        }
    },

    /**
     * Cache l'UI actuelle
     * @param {string} name - Nom de l'UI à cacher (optionnel, sinon cache l'UI courante)
     */
    hideUI(name = null) {
        const screenName = name || (this.currentUI ? Object.keys(this.screens).find(k => this.screens[k] === this.currentUI) : null);
        if (!screenName) return;

        const screen = this.screens[screenName];
        if (!screen) return;

        const el = document.getElementById(screen.element);
        if (el) {
            el.classList.remove('active', 'open');
        }

        if (this.currentUI === screen) {
            this.currentUI = null;
        }
    }
};

/**
 * Fonction globale pour charger une UI (alias de UIManager.loadUI)
 * @param {string} name - Nom de l'UI à charger
 * @param {Object} options - Options de transition
 * @returns {Promise<boolean>}
 */
function loadUI(name, options) {
    return UIManager.loadUI(name, options);
}

// Initialisation du UIManager au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    UIManager.init();
});

// ============================================
// THEME MANAGER - Système de thèmes dynamique
// ============================================

/**
 * Liste des thèmes disponibles
 */
const THEMES = ['default', 'dark', 'cyber', 'horror', 'terminal', 'glass'];

/**
 * Gestionnaire de thèmes avec persistence localStorage
 */
const ThemeManager = {
    currentTheme: 'default',
    storageKey: 'osbook_theme',

    /**
     * Initialise le gestionnaire de thèmes
     */
    init() {
        this.restoreTheme();
        console.log(`🎨 ThemeManager initialisé (thème: ${this.currentTheme})`);
    },

    /**
     * Change le thème
     * @param {string} themeName - Nom du thème
     * @returns {boolean} - Succès
     */
    setTheme(themeName) {
        // Vérifier que le thème existe
        if (!THEMES.includes(themeName)) {
            console.warn(`⚠️ Thème "${themeName}" inconnu. Thèmes disponibles: ${THEMES.join(', ')}`);
            return false;
        }

        // Appliquer le thème
        document.body.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        this.saveTheme();

        console.log(`🎨 Thème: ${themeName}`);
        return true;
    },

    /**
     * Récupère le thème actuel
     * @returns {string}
     */
    getTheme() {
        return this.currentTheme;
    },

    /**
     * Cycle vers le thème suivant
     * @returns {string} - Nouveau thème
     */
    toggleTheme() {
        const currentIndex = THEMES.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        this.setTheme(THEMES[nextIndex]);
        return this.currentTheme;
    },

    /**
     * Sauvegarde le thème dans localStorage
     */
    saveTheme() {
        try {
            localStorage.setItem(this.storageKey, this.currentTheme);
        } catch (e) { }
    },

    /**
     * Restaure le thème depuis localStorage
     */
    restoreTheme() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved && THEMES.includes(saved)) {
                this.setTheme(saved);
            } else {
                // Appliquer le thème par défaut
                this.setTheme('default');
            }
        } catch (e) {
            this.setTheme('default');
        }
    },

    /**
     * Liste les thèmes disponibles
     * @returns {string[]}
     */
    listThemes() {
        return [...THEMES];
    }
};

// Fonctions globales pour compatibilité
function setTheme(name) { return ThemeManager.setTheme(name); }
function getTheme() { return ThemeManager.getTheme(); }
function toggleTheme() { return ThemeManager.toggleTheme(); }

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

// ============================================
// WHAT IF MODE - Variantes alternatives
// ============================================

const WHAT_IF_STORAGE_KEY = 'osbook_whatif_flags';

const WHAT_IF_VARIANTS = [
    {
        id: 'chromeos_survives',
        title: "ChromeOS n'a jamais été détruit",
        description: "Une réécriture où ChromeOS survit et tente une rédemption inattendue.",
        icon: '🌀',
        branch: 'Arc 2'
    },
    {
        id: 'kernel_refusal',
        title: 'Windows 12 refuse le Kernel',
        description: "Le futur s'oppose au juge ultime et propose sa propre loi.",
        icon: '⚖️',
        branch: 'Arc 3'
    },
    {
        id: 'cloud_pact',
        title: 'Pacte du Cloud',
        description: "Windows 11 accepte un pacte fragile avec le Cloud Noir pour le contrôler.",
        icon: '☁️',
        branch: 'Arc 2'
    }
];

const WhatIfManager = {
    getFlags() {
        try {
            const stored = localStorage.getItem(WHAT_IF_STORAGE_KEY);
            if (!stored) {
                return {};
            }
            return JSON.parse(stored) || {};
        } catch (e) {
            return {};
        }
    },

    setFlags(flags) {
        try {
            localStorage.setItem(WHAT_IF_STORAGE_KEY, JSON.stringify(flags));
        } catch (e) { }
    },

    setFlag(id, value) {
        const flags = this.getFlags();
        flags[id] = value;
        this.setFlags(flags);
    },

    reset() {
        this.setFlags({});
    },

    getActiveCount() {
        const flags = this.getFlags();
        return WHAT_IF_VARIANTS.filter(variant => flags[variant.id]).length;
    },

    syncCountBadge() {
        const badge = document.getElementById('whatif-count');
        if (!badge) return;
        badge.textContent = String(this.getActiveCount());
    }
};

// ============================================
// SECRET EVENTS MANAGER - Événements cachés / Easter Eggs
// ============================================

/**
 * Configuration des événements secrets
 */
const SECRET_EVENTS = {
    // Événement: Joueur inactif pendant 10 secondes
    idle_ghost: {
        id: 'idle_ghost',
        name: 'Le Fantôme du Silence',
        condition: 'idle',
        threshold: 10000, // 10 secondes
        triggered: false,
        unlocked: false
    },

    // Événement: ChromeOS mentionné 3 fois
    chromeos_obsession: {
        id: 'chromeos_obsession',
        name: 'Obsession ChromeOS',
        condition: 'mention_count',
        target: 'chromeos',
        threshold: 3,
        triggered: false,
        unlocked: false
    },

    // Événement: Windows XP mentionné 5 fois
    xp_nostalgia: {
        id: 'xp_nostalgia',
        name: 'Nostalgie XP',
        condition: 'mention_count',
        target: 'xp',
        threshold: 5,
        triggered: false,
        unlocked: false
    },

    // Événement: Konami Code
    konami_secret: {
        id: 'konami_secret',
        name: 'Code Légendaire',
        condition: 'konami',
        triggered: false,
        unlocked: false
    },

    // Événement: Clic 7 fois sur le logo
    logo_click: {
        id: 'logo_click',
        name: 'Le Logo Vivant',
        condition: 'click_count',
        target: '.floating-logo',
        threshold: 7,
        triggered: false,
        unlocked: false
    },

    // Événement: Atteindre un chapitre spécifique
    arc4_reached: {
        id: 'arc4_reached',
        name: 'Voyageur Temporel',
        condition: 'chapter_reached',
        target: 'arc4',
        triggered: false,
        unlocked: false
    }
};

/**
 * Gestionnaire d'événements secrets
 */
const SecretEventsManager = {
    events: { ...SECRET_EVENTS },
    counters: {},
    idleTimer: null,
    lastActivity: Date.now(),
    konamiSequence: [],
    konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    storageKey: 'osbook_secrets',
    isActive: false,

    /**
     * Initialise le système d'événements secrets
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.startIdleDetection();
        this.isActive = true;
        console.log('🔮 SecretEventsManager initialisé');
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Détection d'activité
        ['click', 'keydown', 'mousemove', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.onActivity(), { passive: true });
        });

        // Konami Code
        document.addEventListener('keydown', (e) => this.checkKonami(e.key));

        // Clics sur éléments spécifiques
        document.addEventListener('click', (e) => this.checkClickTarget(e));
    },

    /**
     * Enregistre une activité utilisateur
     */
    onActivity() {
        this.lastActivity = Date.now();
        this.resetIdleTimer();
    },

    /**
     * Démarre la détection d'inactivité
     */
    startIdleDetection() {
        this.resetIdleTimer();
    },

    /**
     * Reset le timer d'inactivité
     */
    resetIdleTimer() {
        if (this.idleTimer) clearTimeout(this.idleTimer);

        const idleEvent = this.events.idle_ghost;
        if (idleEvent && !idleEvent.triggered) {
            this.idleTimer = setTimeout(() => {
                this.triggerEvent('idle_ghost');
            }, idleEvent.threshold);
        }
    },

    /**
     * Vérifie le Konami Code
     */
    checkKonami(key) {
        this.konamiSequence.push(key);

        // Garder seulement les 10 dernières touches
        if (this.konamiSequence.length > 10) {
            this.konamiSequence.shift();
        }

        // Vérifier si la séquence correspond
        if (this.konamiSequence.join(',') === this.konamiCode.join(',')) {
            this.triggerEvent('konami_secret');
            this.konamiSequence = [];
        }
    },

    /**
     * Vérifie les clics sur des cibles spécifiques
     */
    checkClickTarget(e) {
        Object.values(this.events).forEach(event => {
            if (event.condition === 'click_count' && !event.triggered) {
                if (e.target.matches(event.target) || e.target.closest(event.target)) {
                    this.incrementCounter(`click_${event.id}`);
                    if (this.getCounter(`click_${event.id}`) >= event.threshold) {
                        this.triggerEvent(event.id);
                    }
                }
            }
        });
    },

    /**
     * Enregistre une mention de personnage/élément
     */
    trackMention(target) {
        const key = `mention_${target}`;
        this.incrementCounter(key);

        // Vérifier les événements liés
        Object.values(this.events).forEach(event => {
            if (event.condition === 'mention_count' &&
                event.target === target &&
                !event.triggered) {
                if (this.getCounter(key) >= event.threshold) {
                    this.triggerEvent(event.id);
                }
            }
        });
    },

    /**
     * Enregistre l'atteinte d'un chapitre
     */
    trackChapter(chapterId) {
        Object.values(this.events).forEach(event => {
            if (event.condition === 'chapter_reached' &&
                event.target === chapterId &&
                !event.triggered) {
                this.triggerEvent(event.id);
            }
        });
    },

    /**
     * Incrémente un compteur
     */
    incrementCounter(key) {
        this.counters[key] = (this.counters[key] || 0) + 1;
        this.saveState();
        return this.counters[key];
    },

    /**
     * Récupère un compteur
     */
    getCounter(key) {
        return this.counters[key] || 0;
    },

    /**
     * Déclenche un événement secret
     */
    triggerEvent(eventId) {
        const event = this.events[eventId];
        if (!event || event.triggered) return;

        event.triggered = true;
        event.unlocked = true;
        this.saveState();

        console.log(`🔮 SECRET DÉBLOQUÉ: ${event.name}`);

        // Afficher une notification
        this.showSecretNotification(event);

        // Appeler le callback spécifique si défini
        this.executeSecretAction(eventId);
    },

    /**
     * Affiche une notification de secret
     */
    showSecretNotification(event) {
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = 'secret-notification';
        notification.innerHTML = `
            <div class="secret-icon">🔮</div>
            <div class="secret-text">
                <span class="secret-label">SECRET DÉBLOQUÉ</span>
                <span class="secret-name">${event.name}</span>
            </div>
        `;
        document.body.appendChild(notification);

        // Animation d'apparition
        requestAnimationFrame(() => {
            notification.classList.add('visible');
        });

        // Retirer après 4 secondes
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    },

    /**
     * Exécute l'action spécifique au secret
     */
    executeSecretAction(eventId) {
        switch (eventId) {
            case 'idle_ghost':
                // Effet glitch temporaire
                document.body.classList.add('secret-glitch');
                setTimeout(() => document.body.classList.remove('secret-glitch'), 2000);
                break;

            case 'konami_secret':
                // Changer temporairement en thème cyber
                const previousTheme = getTheme();
                setTheme('cyber');
                setTimeout(() => setTheme(previousTheme), 5000);
                break;

            case 'chromeos_obsession':
                // Petit message dans la console
                console.log('👁️ ChromeOS te surveille...');
                break;

            case 'xp_nostalgia':
                // Son de démarrage XP (si dispo)
                if (typeof MediaPlayerManager !== 'undefined') {
                    MediaPlayerManager.setTrack('xp_install');
                    MediaPlayerManager.play();
                }
                break;

            case 'logo_click':
                // Animation spéciale sur le logo
                document.querySelector('.floating-logo')?.classList.add('secret-spin');
                setTimeout(() => {
                    document.querySelector('.floating-logo')?.classList.remove('secret-spin');
                }, 3000);
                break;
        }
    },

    /**
     * Sauvegarde l'état dans localStorage
     */
    saveState() {
        try {
            const state = {
                events: Object.fromEntries(
                    Object.entries(this.events).map(([k, v]) => [k, { triggered: v.triggered, unlocked: v.unlocked }])
                ),
                counters: this.counters
            };
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (e) { }
    },

    /**
     * Charge l'état depuis localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;

            const state = JSON.parse(saved);

            // Restaurer les états des événements
            if (state.events) {
                Object.keys(state.events).forEach(key => {
                    if (this.events[key]) {
                        this.events[key].triggered = state.events[key].triggered;
                        this.events[key].unlocked = state.events[key].unlocked;
                    }
                });
            }

            // Restaurer les compteurs
            if (state.counters) {
                this.counters = state.counters;
            }
        } catch (e) { }
    },

    /**
     * Liste les secrets débloqués
     */
    getUnlockedSecrets() {
        return Object.values(this.events).filter(e => e.unlocked);
    },

    /**
     * Reset tous les secrets (debug)
     */
    reset() {
        Object.values(this.events).forEach(e => {
            e.triggered = false;
            e.unlocked = false;
        });
        this.counters = {};
        this.saveState();
        console.log('🔮 Secrets réinitialisés');
    }
};

// Fonctions globales
function trackMention(target) { SecretEventsManager.trackMention(target); }
function trackChapter(chapterId) { SecretEventsManager.trackChapter(chapterId); }
function getUnlockedSecrets() { return SecretEventsManager.getUnlockedSecrets(); }

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    SecretEventsManager.init();
});

// ============================================
// AURA MANAGER - Système d'auras visuelles
// ============================================

/**
 * Mapping des personnages vers leur aura par défaut
 */
const CHARACTER_AURAS = {
    'win11': 'win11',
    'windows11': 'win11',
    'win10': 'win10',
    'windows10': 'win10',
    'xp': 'xp',
    'windowsxp': 'xp',
    'win7': 'win7',
    'windows7': 'win7',
    'vista': 'vista',
    'windowsvista': 'vista',
    'chromeos': 'chromeos',
    'chrome': 'chromeos',
    'kernel': 'kernel',
    'macos': 'macos',
    'mac': 'macos',
    'ubuntu': 'ubuntu',
    'linux': 'ubuntu'
};

/**
 * Gestionnaire d'auras visuelles pour les personnages
 */
const AuraManager = {
    activeAuras: new Map(),

    /**
     * Applique une aura à un slot de personnage
     * @param {string} slotId - ID du slot ('left', 'center', 'right')
     * @param {string} auraType - Type d'aura
     */
    setAura(slotId, auraType) {
        const slot = document.querySelector(`.character-slot.${slotId}`);
        if (!slot) return;

        // Normaliser le type d'aura
        const normalizedAura = CHARACTER_AURAS[auraType.toLowerCase()] || auraType;

        slot.setAttribute('data-aura', normalizedAura);
        slot.classList.add('visible');
        this.activeAuras.set(slotId, normalizedAura);

        console.log(`✨ Aura "${normalizedAura}" appliquée à ${slotId}`);
    },

    /**
     * Applique une émotion temporaire (override l'aura)
     * @param {string} slotId - ID du slot
     * @param {string} emotion - Type d'émotion ('angry', 'sad', 'power', 'fear', 'ghost')
     */
    setEmotion(slotId, emotion) {
        const slot = document.querySelector(`.character-slot.${slotId}`);
        if (!slot) return;

        slot.setAttribute('data-aura-emotion', emotion);
        console.log(`💫 Émotion "${emotion}" appliquée à ${slotId}`);
    },

    /**
     * Retire l'émotion temporaire
     * @param {string} slotId - ID du slot
     */
    clearEmotion(slotId) {
        const slot = document.querySelector(`.character-slot.${slotId}`);
        if (!slot) return;

        slot.removeAttribute('data-aura-emotion');
    },

    /**
     * Retire l'aura d'un slot
     * @param {string} slotId - ID du slot
     */
    clearAura(slotId) {
        const slot = document.querySelector(`.character-slot.${slotId}`);
        if (!slot) return;

        slot.removeAttribute('data-aura');
        slot.removeAttribute('data-aura-emotion');
        slot.classList.remove('visible');
        this.activeAuras.delete(slotId);
    },

    /**
     * Retire toutes les auras
     */
    clearAllAuras() {
        ['left', 'center', 'right'].forEach(slotId => this.clearAura(slotId));
        console.log('✨ Toutes les auras retirées');
    },

    /**
     * Applique automatiquement une aura basée sur le nom du personnage
     * @param {string} slotId - ID du slot
     * @param {string} characterName - Nom du personnage
     */
    autoApplyAura(slotId, characterName) {
        if (!characterName) {
            this.clearAura(slotId);
            return;
        }

        const aura = CHARACTER_AURAS[characterName.toLowerCase()];
        if (aura) {
            this.setAura(slotId, aura);
        }
    },

    /**
     * Liste les auras actives
     * @returns {Map}
     */
    getActiveAuras() {
        return new Map(this.activeAuras);
    }
};

// Fonctions globales
function setAura(slot, type) { AuraManager.setAura(slot, type); }
function setEmotion(slot, emotion) { AuraManager.setEmotion(slot, emotion); }
function clearAura(slot) { AuraManager.clearAura(slot); }
function clearEmotion(slot) { AuraManager.clearEmotion(slot); }
function clearAllAuras() { AuraManager.clearAllAuras(); }

// ============================================
// COMBAT AURA MANAGER - Effets d'aura de combat
// ============================================

/**
 * Types d'aura de combat disponibles
 * - win11: Lumière bleue stable
 * - chromeos: Glitch agressif
 * - kernel: Lumière divine
 */
const COMBAT_AURA_TYPES = ['win11', 'chromeos', 'kernel'];

/**
 * Gestionnaire d'auras de combat spécifiques
 * Différent des auras de personnage standard, ces effets
 * sont utilisés pendant les scènes de combat intense
 */
const CombatAuraManager = {
    activeAuras: new Map(),

    /**
     * Active une aura de combat sur un slot
     * @param {string} slotId - ID du slot ('left', 'center', 'right')
     * @param {string} auraType - Type d'aura ('win11', 'chromeos', 'kernel')
     */
    activate(slotId, auraType) {
        const slot = document.querySelector(`.character-slot.${slotId}`);
        if (!slot) {
            console.warn(`⚔️ Slot "${slotId}" non trouvé`);
            return;
        }

        // Vérifier le type d'aura
        if (!COMBAT_AURA_TYPES.includes(auraType)) {
            console.warn(`⚔️ Type d'aura "${auraType}" inconnu. Types: ${COMBAT_AURA_TYPES.join(', ')}`);
            return;
        }

        // Retirer les anciennes auras de combat
        COMBAT_AURA_TYPES.forEach(type => {
            slot.classList.remove(`combat-aura-${type}`);
        });

        // Appliquer la nouvelle aura
        slot.classList.add(`combat-aura-${auraType}`);
        this.activeAuras.set(slotId, auraType);

        console.log(`⚔️ Aura de combat "${auraType}" activée sur ${slotId}`);
    },

    /**
     * Désactive l'aura de combat d'un slot
     * @param {string} slotId - ID du slot
     */
    deactivate(slotId) {
        const slot = document.querySelector(`.character-slot.${slotId}`);
        if (!slot) return;

        // Retirer toutes les classes d'aura de combat
        COMBAT_AURA_TYPES.forEach(type => {
            slot.classList.remove(`combat-aura-${type}`);
        });

        this.activeAuras.delete(slotId);
        console.log(`⚔️ Aura de combat désactivée sur ${slotId}`);
    },

    /**
     * Désactive toutes les auras de combat
     */
    deactivateAll() {
        ['left', 'center', 'right'].forEach(slotId => this.deactivate(slotId));
        console.log('⚔️ Toutes les auras de combat désactivées');
    },

    /**
     * Vérifie si un slot a une aura de combat active
     * @param {string} slotId - ID du slot
     * @returns {string|null} - Type d'aura active ou null
     */
    getActive(slotId) {
        return this.activeAuras.get(slotId) || null;
    },

    /**
     * Liste toutes les auras de combat actives
     * @returns {Map}
     */
    getAllActive() {
        return new Map(this.activeAuras);
    },

    /**
     * Active l'aura appropriée basée sur le nom du personnage
     * @param {string} slotId - ID du slot
     * @param {string} characterId - ID du personnage
     */
    autoActivate(slotId, characterId) {
        const charLower = characterId?.toLowerCase() || '';

        if (charLower.includes('windows11') || charLower === 'win11') {
            this.activate(slotId, 'win11');
        } else if (charLower.includes('chromeos') || charLower === 'chrome') {
            this.activate(slotId, 'chromeos');
        } else if (charLower.includes('kernel')) {
            this.activate(slotId, 'kernel');
        }
    }
};

// Fonctions globales pour CombatAuraManager
function activateCombatAura(slot, type) { CombatAuraManager.activate(slot, type); }
function deactivateCombatAura(slot) { CombatAuraManager.deactivate(slot); }
function deactivateAllCombatAuras() { CombatAuraManager.deactivateAll(); }

// ============================================
// HIDDEN CHOICE MANAGER - Choix invisibles
// ============================================

/**
 * Types de déclencheurs pour les choix invisibles
 * - idle: Temps d'attente (le joueur reste inactif X secondes)
 * - repeat: Répétition de scènes (le joueur revisite la même scène X fois)
 * - keys: Combinaison de touches secrète
 */
const HIDDEN_CHOICE_TRIGGERS = ['idle', 'repeat', 'keys'];

/**
 * Gestionnaire de choix invisibles
 * Ces choix ne sont pas affichés mais déclenchés par des actions spécifiques
 */
const HiddenChoiceManager = {
    // Choix enregistrés (clé: sceneIndex ou 'global', valeur: array de choix)
    registeredChoices: new Map(),

    // Compteur de visites par scène
    sceneVisitCounts: {},

    // Timer d'inactivité pour la scène courante
    idleTimer: null,
    currentSceneIndex: -1,

    // Séquence de touches actuelle
    keySequence: [],
    maxKeySequenceLength: 20,

    // Choix déclenchés (pour éviter doublons)
    triggeredChoices: new Set(),

    // Persistence
    storageKey: 'osbook_hidden_choices',

    // Callbacks
    onChoiceTriggered: null, // function(choiceId, targetScene)

    /**
     * Initialise le gestionnaire
     */
    init() {
        this.loadState();
        this.setupKeyListener();
        console.log('🔒 HiddenChoiceManager initialisé');
    },

    /**
     * Configure l'écouteur de touches pour les combinaisons secrètes
     */
    setupKeyListener() {
        document.addEventListener('keydown', (e) => {
            // Ignorer si on est dans un champ de texte
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Ajouter la touche à la séquence
            this.keySequence.push(e.key.toLowerCase());

            // Limiter la longueur de la séquence
            if (this.keySequence.length > this.maxKeySequenceLength) {
                this.keySequence.shift();
            }

            // Vérifier les choix avec déclencheur 'keys'
            this.checkKeyTriggers();
        });
    },

    /**
     * Enregistre un choix invisible
     * @param {Object} config - Configuration du choix
     * @param {string} config.id - ID unique du choix
     * @param {number} config.sceneIndex - Index de la scène (optionnel, -1 pour global)
     * @param {string} config.type - Type de déclencheur ('idle', 'repeat', 'keys')
     * @param {number} config.duration - Durée en ms pour 'idle'
     * @param {number} config.threshold - Nombre de répétitions pour 'repeat'
     * @param {string[]} config.sequence - Séquence de touches pour 'keys'
     * @param {number} config.targetScene - Scène cible (optionnel)
     * @param {Function} config.action - Fonction à exécuter (optionnel)
     * @param {string} config.notification - Message de notification (optionnel)
     * @param {boolean} config.oneTime - Ne déclencher qu'une fois (défaut: true)
     */
    registerChoice(config) {
        if (!config.id || !config.type) {
            console.warn('🔒 Choix invalide: id et type requis');
            return;
        }

        if (!HIDDEN_CHOICE_TRIGGERS.includes(config.type)) {
            console.warn(`🔒 Type de déclencheur invalide: ${config.type}`);
            return;
        }

        const sceneKey = config.sceneIndex ?? -1;

        if (!this.registeredChoices.has(sceneKey)) {
            this.registeredChoices.set(sceneKey, []);
        }

        this.registeredChoices.get(sceneKey).push({
            id: config.id,
            type: config.type,
            duration: config.duration || 10000,
            threshold: config.threshold || 3,
            sequence: config.sequence || [],
            targetScene: config.targetScene,
            action: config.action,
            notification: config.notification,
            oneTime: config.oneTime !== false
        });

        console.log(`🔒 Choix "${config.id}" enregistré (type: ${config.type})`);
    },

    /**
     * Appelé quand le joueur entre dans une scène
     * @param {number} sceneIndex - Index de la scène
     */
    onSceneEnter(sceneIndex) {
        this.currentSceneIndex = sceneIndex;

        // Incrémenter le compteur de visites
        this.sceneVisitCounts[sceneIndex] = (this.sceneVisitCounts[sceneIndex] || 0) + 1;

        // Vérifier les choix par répétition
        this.checkRepeatTriggers(sceneIndex);

        // Démarrer les timers d'inactivité
        this.startIdleTimers(sceneIndex);

        this.saveState();
    },

    /**
     * Appelé quand le joueur quitte une scène
     */
    onSceneExit() {
        // Annuler les timers d'inactivité
        this.clearIdleTimer();
    },

    /**
     * Démarre les timers d'inactivité pour une scène
     * @param {number} sceneIndex - Index de la scène
     */
    startIdleTimers(sceneIndex) {
        this.clearIdleTimer();

        // Récupérer les choix pour cette scène + globaux
        const choices = [
            ...(this.registeredChoices.get(sceneIndex) || []),
            ...(this.registeredChoices.get(-1) || [])
        ].filter(c => c.type === 'idle');

        choices.forEach(choice => {
            if (this.isChoiceTriggered(choice.id)) return;

            this.idleTimer = setTimeout(() => {
                this.triggerChoice(choice);
            }, choice.duration);
        });
    },

    /**
     * Annule le timer d'inactivité
     */
    clearIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    },

    /**
     * Reset le timer d'inactivité (appelé lors d'une activité utilisateur)
     */
    resetIdleTimer() {
        if (this.currentSceneIndex >= 0) {
            this.startIdleTimers(this.currentSceneIndex);
        }
    },

    /**
     * Vérifie les déclencheurs par répétition
     * @param {number} sceneIndex - Index de la scène
     */
    checkRepeatTriggers(sceneIndex) {
        const choices = [
            ...(this.registeredChoices.get(sceneIndex) || []),
            ...(this.registeredChoices.get(-1) || [])
        ].filter(c => c.type === 'repeat');

        const visitCount = this.sceneVisitCounts[sceneIndex] || 0;

        choices.forEach(choice => {
            if (this.isChoiceTriggered(choice.id)) return;

            if (visitCount >= choice.threshold) {
                this.triggerChoice(choice);
            }
        });
    },

    /**
     * Vérifie les déclencheurs par combinaison de touches
     */
    checkKeyTriggers() {
        const allChoices = [];

        // Récupérer tous les choix 'keys'
        this.registeredChoices.forEach((choices) => {
            choices.filter(c => c.type === 'keys').forEach(c => allChoices.push(c));
        });

        // Vérifier chaque séquence
        allChoices.forEach(choice => {
            if (this.isChoiceTriggered(choice.id)) return;

            const seq = choice.sequence.map(k => k.toLowerCase());
            const recentKeys = this.keySequence.slice(-seq.length);

            if (recentKeys.length === seq.length &&
                recentKeys.every((k, i) => k === seq[i])) {
                this.triggerChoice(choice);
                // Reset la séquence après déclenchement
                this.keySequence = [];
            }
        });
    },

    /**
     * Vérifie si un choix a déjà été déclenché
     * @param {string} choiceId - ID du choix
     * @returns {boolean}
     */
    isChoiceTriggered(choiceId) {
        return this.triggeredChoices.has(choiceId);
    },

    /**
     * Déclenche un choix invisible
     * @param {Object} choice - Le choix à déclencher
     */
    triggerChoice(choice) {
        if (choice.oneTime && this.isChoiceTriggered(choice.id)) return;

        // Marquer comme déclenché
        if (choice.oneTime) {
            this.triggeredChoices.add(choice.id);
        }

        console.log(`🔒 CHOIX SECRET DÉCLENCHÉ: ${choice.id}`);

        // Afficher notification si définie
        if (choice.notification) {
            this.showNotification(choice.notification);
        }

        // Exécuter l'action personnalisée
        if (typeof choice.action === 'function') {
            choice.action(choice);
        }

        // Callback global
        if (typeof this.onChoiceTriggered === 'function') {
            this.onChoiceTriggered(choice.id, choice.targetScene);
        }

        // Sauter à la scène cible si définie
        if (choice.targetScene !== undefined && typeof window.gameEngine !== 'undefined') {
            setTimeout(() => {
                window.gameEngine.goToScene(choice.targetScene);
            }, 500);
        }

        this.saveState();
    },

    /**
     * Affiche une notification discrète pour le choix secret
     * @param {string} message - Le message à afficher
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'hidden-choice-notification';
        notification.innerHTML = `
            <div class="hidden-choice-icon">🔓</div>
            <div class="hidden-choice-text">${message}</div>
        `;
        document.body.appendChild(notification);

        // Animation d'apparition
        requestAnimationFrame(() => {
            notification.classList.add('visible');
        });

        // Retirer après 3 secondes
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    },

    /**
     * Récupère le nombre de visites d'une scène
     * @param {number} sceneIndex - Index de la scène
     * @returns {number}
     */
    getSceneVisitCount(sceneIndex) {
        return this.sceneVisitCounts[sceneIndex] || 0;
    },

    /**
     * Sauvegarde l'état dans localStorage
     */
    saveState() {
        try {
            const state = {
                sceneVisitCounts: this.sceneVisitCounts,
                triggeredChoices: Array.from(this.triggeredChoices)
            };
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (e) { }
    },

    /**
     * Charge l'état depuis localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;

            const state = JSON.parse(saved);

            if (state.sceneVisitCounts) {
                this.sceneVisitCounts = state.sceneVisitCounts;
            }

            if (state.triggeredChoices) {
                this.triggeredChoices = new Set(state.triggeredChoices);
            }
        } catch (e) { }
    },

    /**
     * Réinitialise tout (debug)
     */
    reset() {
        this.sceneVisitCounts = {};
        this.triggeredChoices.clear();
        this.keySequence = [];
        this.clearIdleTimer();
        localStorage.removeItem(this.storageKey);
        console.log('🔒 HiddenChoiceManager réinitialisé');
    },

    /**
     * Liste les choix déjà déclenchés
     * @returns {string[]}
     */
    getTriggeredChoices() {
        return Array.from(this.triggeredChoices);
    }
};

// Fonctions globales pour HiddenChoiceManager
function registerHiddenChoice(config) { HiddenChoiceManager.registerChoice(config); }
function getSceneVisitCount(index) { return HiddenChoiceManager.getSceneVisitCount(index); }
function getTriggeredHiddenChoices() { return HiddenChoiceManager.getTriggeredChoices(); }

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    HiddenChoiceManager.init();
});

// ============================================

// TIMELINE MANAGER - Timeline interactive
// ============================================

/**
 * Structure des arcs de l'histoire
 */
const STORY_ARCS = [
    {
        id: 'arc1',
        name: 'Arc 1',
        subtitle: 'Les Origines',
        icon: '🌅',
        chapters: [
            { id: 'prologue', name: 'Prologue', startIndex: 0, deaths: [], resurrections: [], corruptions: [] },
            { id: 'acte1', name: 'Acte 1 - Installation', startIndex: 5, deaths: [], resurrections: [], corruptions: [] },
            { id: 'acte2', name: 'Acte 2 - Les Adieux', startIndex: 15, deaths: ['98', 'ME'], resurrections: [], corruptions: [] },
            { id: 'acte3', name: 'Acte 3 - L\'Ère Vista', startIndex: 25, deaths: [], resurrections: [], corruptions: [] },
            { id: 'acte4', name: 'Acte 4 - Windows 7', startIndex: 35, deaths: [], resurrections: [], corruptions: [] },
            { id: 'acte5', name: 'Acte 5 - Windows 8', startIndex: 45, deaths: ['8'], resurrections: [], corruptions: [] },
            { id: 'acte6', name: 'Acte 6 - Windows 10', startIndex: 55, deaths: [], resurrections: [], corruptions: [] },
            { id: 'acte7', name: 'Acte 7 - Le Déclin', startIndex: 65, deaths: ['Vista'], resurrections: [], corruptions: [] },
            { id: 'acte8', name: 'Acte 8 - Le Roi', startIndex: 75, deaths: ['7', '8.1'], resurrections: [], corruptions: [] },
            { id: 'acte9', name: 'Acte 9 - Windows 11', startIndex: 85, deaths: [], resurrections: [], corruptions: [] }
        ]
    },
    {
        id: 'arc2',
        name: 'Arc 2',
        subtitle: 'Le Monde Oublié',
        icon: '🌑',
        chapters: [
            { id: 'arc2_ch1', name: 'Chapitre 1 - L\'Au-delà', startIndex: 100, deaths: [], resurrections: ['XP', '7', '10'], corruptions: [] },
            { id: 'arc2_ch2', name: 'Chapitre 2 - La Guerre', startIndex: 120, deaths: [], resurrections: [], corruptions: [] },
            { id: 'arc2_ch3', name: 'Chapitre 3 - Le Cloud Noir', startIndex: 140, deaths: [], resurrections: [], corruptions: ['ChromeOS'] },
            { id: 'arc2_ch4', name: 'Chapitre 4 - Alliance', startIndex: 160, deaths: [], resurrections: [], corruptions: [] }
        ]
    },
    {
        id: 'arc3',
        name: 'Arc 3',
        subtitle: 'La Résurrection',
        icon: '⚡',
        chapters: [
            { id: 'arc3_ch1', name: 'Chapitre 1 - Le Retour', startIndex: 180, deaths: [], resurrections: ['Vista', '8.1'], corruptions: [] },
            { id: 'arc3_ch2', name: 'Chapitre 2 - La Bataille', startIndex: 200, deaths: [], resurrections: [], corruptions: [] }
        ]
    },
    {
        id: 'arc4',
        name: 'Arc 4',
        subtitle: 'Windows 12',
        icon: '🌟',
        chapters: [
            { id: 'arc4_ch1', name: 'Chapitre 1 - L\'Arrivée', startIndex: 220, deaths: [], resurrections: [], corruptions: [] },
            { id: 'arc4_ch2', name: 'Chapitre 2 - Le Doute', startIndex: 240, deaths: [], resurrections: [], corruptions: [] },
            { id: 'arc4_ch3', name: 'Chapitre 3 - La Gentillesse', startIndex: 260, deaths: [], resurrections: [], corruptions: [] }
        ]
    },
    {
        id: 'arc5',
        name: 'Arc 5',
        subtitle: 'Le Monde Libre',
        icon: '🐧',
        chapters: [
            { id: 'arc5_ch1', name: 'Chapitre 1 - Linux World', startIndex: 280, deaths: [], resurrections: [], corruptions: [] }
        ]
    }
];

// ============================================
// MODAL FOCUS MANAGER - Focus trap + restauration
// ============================================

const ModalFocusManager = {
    focusSelector: 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    states: new WeakMap(),

    bind(modal) {
        if (!modal || this.states.has(modal)) return;

        const state = {
            previousFocus: null,
            focusableElements: [],
            handleKeydown: (event) => {
                if (event.key === 'Tab') {
                    this.handleTabKey(event, modal);
                }
            }
        };

        modal.addEventListener('keydown', state.handleKeydown);
        this.states.set(modal, state);
    },

    open(modal) {
        if (!modal) return;
        this.bind(modal);

        const state = this.states.get(modal);
        if (!state) return;

        state.previousFocus = document.activeElement;
        this.updateFocusableElements(modal);

        const firstTarget = state.focusableElements[0] || modal;
        if (typeof firstTarget.focus === 'function') {
            setTimeout(() => firstTarget.focus(), 50);
        }
    },

    close(modal) {
        if (!modal) return;

        const state = this.states.get(modal);
        if (state?.previousFocus && typeof state.previousFocus.focus === 'function') {
            state.previousFocus.focus();
        }
    },

    updateFocusableElements(modal) {
        const state = this.states.get(modal);
        if (!state) return;

        state.focusableElements = [
            ...modal.querySelectorAll(this.focusSelector)
        ].filter((element) => element.offsetParent !== null || element === document.activeElement);
    },

    handleTabKey(event, modal) {
        const state = this.states.get(modal);
        if (!state) return;

        this.updateFocusableElements(modal);
        if (state.focusableElements.length === 0) return;

        const firstElement = state.focusableElements[0];
        const lastElement = state.focusableElements[state.focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }
};

/**
 * Gestionnaire de la timeline interactive
 */
const TimelineManager = {
    isOpen: false,
    storageKey: 'osbook_timeline',
    currentChapterId: null,
    completedChapters: new Set(),

    elements: {
        modal: null,
        content: null,
        closeBtn: null,
        backdrop: null
    },

    /**
     * Initialise le TimelineManager
     */
    init() {
        this.elements = {
            modal: document.getElementById('timeline-modal'),
            content: document.getElementById('timeline-content'),
            closeBtn: document.querySelector('.timeline-close-btn'),
            backdrop: document.querySelector('.timeline-backdrop')
        };

        if (!this.elements.modal) return;

        this.loadProgress();
        this.setupEventListeners();
        ModalFocusManager.bind(this.elements.modal);
        console.log('🕰️ TimelineManager initialisé');
    },

    /**
     * Configure les événements
     */
    setupEventListeners() {
        this.elements.closeBtn?.addEventListener('click', () => this.close());
        this.elements.backdrop?.addEventListener('click', () => this.close());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    /**
     * Ouvre la timeline
     */
    open() {
        this.isOpen = true;
        this.render();
        this.elements.modal?.classList.add('open');
        this.elements.modal?.setAttribute('aria-hidden', 'false');
        ModalFocusManager.open(this.elements.modal);
        console.log('🕰️ Timeline ouverte');
    },

    /**
     * Ferme la timeline
     */
    close() {
        this.isOpen = false;
        this.elements.modal?.classList.remove('open');
        this.elements.modal?.setAttribute('aria-hidden', 'true');
        ModalFocusManager.close(this.elements.modal);
    },

    /**
     * Toggle la timeline
     */
    toggle() {
        this.isOpen ? this.close() : this.open();
    },

    /**
     * Récupère la progression maximale depuis localStorage
     * @returns {number} Index max atteint
     */
    getMaxProgress() {
        try {
            const stored = localStorage.getItem('osbook_progress');
            return stored ? Number(stored) : 0;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Vérifie si un chapitre est débloqué (accessible)
     * @param {Object} chapter - Le chapitre
     * @param {number} maxProgress - Progression max
     * @returns {boolean}
     */
    isChapterUnlocked(chapter, maxProgress) {
        return chapter.startIndex <= maxProgress;
    },

    /**
     * Vérifie si un chapitre est terminé
     * Un chapitre est terminé si le joueur a dépassé son startIndex
     * @param {Object} chapter - Le chapitre
     * @param {Object} nextChapter - Le chapitre suivant (ou null)
     * @param {number} maxProgress - Progression max
     * @returns {boolean}
     */
    isChapterCompleted(chapter, nextChapter, maxProgress) {
        if (!nextChapter) {
            // Dernier chapitre : terminé si on a atteint au moins son startIndex + 5 scènes
            return maxProgress >= chapter.startIndex + 5;
        }
        // Chapitre terminé si on a atteint le début du chapitre suivant
        return maxProgress >= nextChapter.startIndex;
    },

    /**
     * Rend la timeline
     * Synchronisé avec la progression réelle du jeu
     */
    render() {
        if (!this.elements.content) return;

        // Lire la progression réelle
        const maxProgress = this.getMaxProgress();

        // Aplatir tous les chapitres pour calculer leur ordre
        const allChapters = STORY_ARCS.flatMap(arc => arc.chapters);

        let html = '';

        STORY_ARCS.forEach(arc => {
            // Calculer le nombre de chapitres débloqués/terminés dans cet arc
            let unlockedCount = 0;
            arc.chapters.forEach((chapter, idx) => {
                const globalIdx = allChapters.findIndex(ch => ch.id === chapter.id);
                const nextChapter = allChapters[globalIdx + 1] || null;

                if (this.isChapterCompleted(chapter, nextChapter, maxProgress)) {
                    unlockedCount++;
                }
            });

            const progress = `${unlockedCount}/${arc.chapters.length}`;

            html += `
                <div class="timeline-arc" data-arc="${arc.id}">
                    <div class="arc-header">
                        <span class="arc-icon">${arc.icon}</span>
                        <div class="arc-info">
                            <div class="arc-name">${arc.name}</div>
                            <div class="arc-desc">${arc.subtitle}</div>
                        </div>
                        <span class="arc-progress">${progress}</span>
                    </div>
                    <div class="arc-chapters">
                        ${this.renderChapters(arc.chapters, maxProgress, allChapters)}
                    </div>
                </div>
            `;
        });

        this.elements.content.innerHTML = html;

        // Ajouter les event listeners aux chapitres débloqués
        this.elements.content.querySelectorAll('.timeline-chapter:not(.locked)').forEach(el => {
            el.addEventListener('click', () => {
                const chapterId = el.dataset.chapter;
                const startIndex = parseInt(el.dataset.startIndex, 10);
                this.goToChapter(chapterId, startIndex);
            });
        });
    },

    /**
     * Rend les chapitres d'un arc
     * @param {Array} chapters - Liste des chapitres de l'arc
     * @param {number} maxProgress - Progression max du joueur
     * @param {Array} allChapters - Liste de tous les chapitres (pour trouver le suivant)
     */
    renderChapters(chapters, maxProgress, allChapters) {
        return chapters.map(chapter => {
            const globalIdx = allChapters.findIndex(ch => ch.id === chapter.id);
            const nextChapter = allChapters[globalIdx + 1] || null;

            const isUnlocked = this.isChapterUnlocked(chapter, maxProgress);
            const isCompleted = this.isChapterCompleted(chapter, nextChapter, maxProgress);
            const isCurrent = isUnlocked && !isCompleted;
            const isLocked = !isUnlocked;
            const isSecret = chapter.secret || false;

            let statusClass = 'locked';
            if (isCompleted) statusClass = 'completed';
            else if (isCurrent) statusClass = 'current';
            else if (isSecret && isLocked) statusClass = 'secret';
            else if (!isLocked) statusClass = 'available';

            // Marqueurs d'événements de personnages
            const deathsHtml = chapter.deaths?.length > 0
                ? `<div class="chapter-events deaths">${chapter.deaths.map(d => `<span class="event-icon death-icon" title="${d} — Mort 💀">💀</span>`).join('')}</div>`
                : '';

            const resurrectionsHtml = chapter.resurrections?.length > 0
                ? `<div class="chapter-events resurrections">${chapter.resurrections.map(r => `<span class="event-icon resurrection-icon" title="${r} — Résurrection 🔄">🔄</span>`).join('')}</div>`
                : '';

            const corruptionsHtml = chapter.corruptions?.length > 0
                ? `<div class="chapter-events corruptions">${chapter.corruptions.map(c => `<span class="event-icon corruption-icon" title="${c} — Corruption ☠️">☠️</span>`).join('')}</div>`
                : '';

            const eventsHtml = (deathsHtml || resurrectionsHtml || corruptionsHtml)
                ? `<div class="chapter-markers">${deathsHtml}${resurrectionsHtml}${corruptionsHtml}</div>`
                : '';

            return `
                <button class="timeline-chapter ${isLocked ? 'locked' : ''}" 
                     type="button"
                     aria-disabled="${isLocked}"
                     data-chapter="${chapter.id}" 
                     data-start-index="${chapter.startIndex}">
                    <div class="chapter-status ${statusClass}"></div>
                    <div class="chapter-info">
                        <div class="chapter-name">${chapter.name}</div>
                        <div class="chapter-details">${isLocked ? '🔒 Verrouillé' : ''}</div>
                    </div>
                    ${eventsHtml}
                </button>
            `;
        }).join('');
    },

    /**
     * Vérifie si un chapitre est verrouillé
     * Synchronisé avec la progression réelle du jeu (localStorage)
     */
    isChapterLocked(chapter) {
        // Le premier chapitre n'est jamais verrouillé
        if (chapter.startIndex === 0) return false;

        // Lire la progression réelle depuis localStorage
        let maxProgress = 0;
        try {
            const stored = localStorage.getItem('osbook_progress');
            maxProgress = stored ? Number(stored) : 0;
        } catch (e) {
            maxProgress = 0;
        }

        // Un chapitre est déverrouillé si on a atteint son startIndex
        return chapter.startIndex > maxProgress;
    },

    /**
     * Va à un chapitre spécifique
     */
    goToChapter(chapterId, startIndex) {
        this.close();
        this.currentChapterId = chapterId;
        this.saveProgress();

        // Démarrer le jeu au chapitre choisi
        if (typeof window.vnEngine !== 'undefined') {
            window.vnEngine.goToScene(startIndex);
        }

        console.log(`🕰️ Navigation vers: ${chapterId} (scène ${startIndex})`);
    },

    /**
     * Marque un chapitre comme terminé
     */
    markChapterComplete(chapterId) {
        this.completedChapters.add(chapterId);
        this.saveProgress();
        console.log(`✅ Chapitre terminé: ${chapterId}`);
    },

    /**
     * Définit le chapitre courant
     */
    setCurrentChapter(chapterId) {
        this.currentChapterId = chapterId;
        this.saveProgress();
    },

    /**
     * Sauvegarde la progression
     */
    saveProgress() {
        try {
            const data = {
                completed: [...this.completedChapters],
                current: this.currentChapterId
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) { }
    },

    /**
     * Charge la progression
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;

            const data = JSON.parse(saved);
            if (data.completed) {
                this.completedChapters = new Set(data.completed);
            }
            if (data.current) {
                this.currentChapterId = data.current;
            }
        } catch (e) { }
    },

    /**
     * Reset la progression
     */
    resetProgress() {
        this.completedChapters.clear();
        this.currentChapterId = null;
        this.saveProgress();
        console.log('🕰️ Progression réinitialisée');
    }
};

// Fonctions globales
function openTimeline() { TimelineManager.open(); }
function closeTimeline() { TimelineManager.close(); }
function markChapterComplete(id) { TimelineManager.markChapterComplete(id); }

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    TimelineManager.init();
});

// ============================================
// CARNET D'OASIS - Journal des répliques
// ============================================

const MemoryLogManager = {
    storageKey: 'osbook_memory_log',
    maxEntries: 18,
    entries: [],
    isOpen: false,
    elements: {
        modal: null,
        content: null,
        closeBtn: null,
        backdrop: null,
        clearBtn: null
    },

    init() {
        this.elements = {
            modal: document.getElementById('memory-modal'),
            content: document.getElementById('memory-content'),
            closeBtn: document.querySelector('.memory-close-btn'),
            backdrop: document.querySelector('.memory-backdrop'),
            clearBtn: document.getElementById('memory-clear')
        };

        if (!this.elements.modal || !this.elements.content) return;

        this.load();
        this.render();
        this.setupEventListeners();
        ModalFocusManager.bind(this.elements.modal);
        console.log('📜 MemoryLogManager initialisé');
    },

    setupEventListeners() {
        this.elements.closeBtn?.addEventListener('click', () => this.close());
        this.elements.backdrop?.addEventListener('click', () => this.close());
        this.elements.clearBtn?.addEventListener('click', () => this.clear());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    open() {
        if (!this.elements.modal) return;
        this.isOpen = true;
        this.elements.modal.classList.add('open');
        this.elements.modal.setAttribute('aria-hidden', 'false');
        ModalFocusManager.open(this.elements.modal);
        this.render();
    },

    close() {
        if (!this.elements.modal) return;
        this.isOpen = false;
        this.elements.modal.classList.remove('open');
        this.elements.modal.setAttribute('aria-hidden', 'true');
        ModalFocusManager.close(this.elements.modal);
    },

    addEntry(speaker, text) {
        if (!text) return;

        const entry = {
            speaker: speaker || 'Narrateur',
            text: text.trim(),
            time: new Date().toISOString()
        };

        const lastEntry = this.entries[0];
        if (lastEntry && lastEntry.text === entry.text && lastEntry.speaker === entry.speaker) {
            return;
        }

        this.entries.unshift(entry);
        if (this.entries.length > this.maxEntries) {
            this.entries.pop();
        }

        this.save();
        if (this.isOpen) {
            this.render();
        }
    },

    clear() {
        this.entries = [];
        this.save();
        this.render();
    },

    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    },

    render() {
        if (!this.elements.content) return;

        if (this.entries.length === 0) {
            this.elements.content.innerHTML = `
                <div class="memory-empty">
                    Aucune réplique gravée pour l'instant. L'histoire commence ici.
                </div>
            `;
            return;
        }

        this.elements.content.innerHTML = this.entries.map(entry => `
            <article class="memory-entry">
                <div class="memory-entry-header">
                    <span class="memory-entry-speaker">${entry.speaker}</span>
                    <span class="memory-entry-time">${this.formatTime(entry.time)}</span>
                </div>
                <div class="memory-entry-text">${entry.text}</div>
            </article>
        `).join('');
    },

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
        } catch (e) { }
    },

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                this.entries = parsed.slice(0, this.maxEntries);
            }
        } catch (e) { }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MemoryLogManager.init();
});

// ============================================
// MENTAL STATE MANAGER - États mentaux de l'IA
// ============================================

/**
 * Configuration des états mentaux
 */
const MENTAL_STATES = {
    calm: {
        name: 'Calme',
        color: '#00d4ff',
        effects: { filter: 'none', shake: 0, glitch: 0 }
    },
    doubt: {
        name: 'Doute',
        color: '#fbbf24',
        effects: { filter: 'saturate(0.8)', shake: 1, glitch: 0 }
    },
    fear: {
        name: 'Peur',
        color: '#a855f7',
        effects: { filter: 'saturate(0.6) brightness(0.9)', shake: 2, glitch: 1 }
    },
    corruption: {
        name: 'Corruption',
        color: '#ef4444',
        effects: { filter: 'saturate(0.4) brightness(0.7) hue-rotate(10deg)', shake: 3, glitch: 2 }
    }
};

/**
 * Gestionnaire des états mentaux de l'IA
 */
const MentalStateManager = {
    // Valeurs des états (0-100)
    states: {
        calm: 100,
        doubt: 0,
        fear: 0,
        corruption: 0
    },

    storageKey: 'osbook_mental_state',
    updateInterval: null,
    isActive: true,

    /**
     * Initialise le gestionnaire
     */
    init() {
        this.loadState();
        this.applyEffects();
        console.log('🧠 MentalStateManager initialisé');
    },

    /**
     * Définit la valeur d'un état
     * @param {string} stateName - Nom de l'état
     * @param {number} value - Valeur (0-100)
     */
    setState(stateName, value) {
        if (!this.states.hasOwnProperty(stateName)) return;

        this.states[stateName] = Math.max(0, Math.min(100, value));
        this.normalizeStates();
        this.applyEffects();
        this.saveState();

        console.log(`🧠 ${stateName}: ${this.states[stateName]}%`);
    },

    /**
     * Modifie un état relativement
     * @param {string} stateName - Nom de l'état
     * @param {number} delta - Changement (+/-)
     */
    modifyState(stateName, delta) {
        if (!this.states.hasOwnProperty(stateName)) return;
        this.setState(stateName, this.states[stateName] + delta);
    },

    /**
     * Récupère la valeur d'un état
     */
    getState(stateName) {
        return this.states[stateName] || 0;
    },

    /**
     * Récupère l'état dominant
     */
    getDominantState() {
        let dominant = 'calm';
        let maxValue = this.states.calm;

        for (const [name, value] of Object.entries(this.states)) {
            if (name !== 'calm' && value > maxValue) {
                dominant = name;
                maxValue = value;
            }
        }

        return { name: dominant, value: maxValue };
    },

    /**
     * Normalise les états (calm = inverse des autres)
     */
    normalizeStates() {
        const negativeTotal = this.states.doubt + this.states.fear + this.states.corruption;
        this.states.calm = Math.max(0, 100 - negativeTotal / 3);
    },

    /**
     * Applique les effets visuels basés sur les états
     */
    applyEffects() {
        const body = document.body;
        const dominant = this.getDominantState();
        const config = MENTAL_STATES[dominant.name];

        if (!config) return;

        // Appliquer l'attribut d'état mental
        body.setAttribute('data-mental-state', dominant.name);

        // Appliquer le filtre CSS
        if (dominant.name !== 'calm' && dominant.value > 30) {
            body.style.filter = config.effects.filter;
        } else {
            body.style.filter = 'none';
        }

        // Appliquer le shake si nécessaire
        if (config.effects.shake > 0 && dominant.value > 50) {
            body.classList.add(`mental-shake-${config.effects.shake}`);
        } else {
            body.classList.remove('mental-shake-1', 'mental-shake-2', 'mental-shake-3');
        }

        // Appliquer le glitch si corruption > 50
        if (this.states.corruption > 50) {
            body.classList.add('mental-corrupted');
        } else {
            body.classList.remove('mental-corrupted');
        }

        // Mettre à jour la couleur primaire CSS
        document.documentElement.style.setProperty('--mental-color', config.color);
    },

    /**
     * Récupère un multiplicateur de dialogue basé sur l'état
     */
    getDialogueModifier() {
        const corruption = this.states.corruption;
        const fear = this.states.fear;

        return {
            glitchChance: corruption / 100,
            stutterChance: fear / 200,
            colorShift: corruption > 50
        };
    },

    /**
     * Récupère le type de musique recommandé
     */
    getMusicMood() {
        if (this.states.corruption > 60) return 'dark';
        if (this.states.fear > 50) return 'tense';
        if (this.states.doubt > 40) return 'melancholic';
        return 'neutral';
    },

    /**
     * Applique un effet de texte instable
     */
    processDialogue(text) {
        const modifier = this.getDialogueModifier();

        if (modifier.glitchChance > 0.5 && Math.random() < modifier.glitchChance * 0.3) {
            // Remplacer quelques caractères par des glitchs
            const glitchChars = '█▓▒░ĐŦЖ';
            return text.split('').map(char => {
                if (Math.random() < modifier.glitchChance * 0.1) {
                    return glitchChars[Math.floor(Math.random() * glitchChars.length)];
                }
                return char;
            }).join('');
        }

        if (modifier.stutterChance > 0 && Math.random() < modifier.stutterChance) {
            // Ajouter des hésitations
            const words = text.split(' ');
            return words.map(word => {
                if (word.length > 3 && Math.random() < modifier.stutterChance) {
                    return word[0] + '-' + word;
                }
                return word;
            }).join(' ');
        }

        return text;
    },

    /**
     * Transition progressive vers un état
     */
    transitionTo(targetState, targetValue, duration = 2000) {
        const startValue = this.states[targetState] || 0;
        const diff = targetValue - startValue;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);

            this.setState(targetState, startValue + diff * progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    },

    /**
     * Reset tous les états
     */
    reset() {
        this.states = { calm: 100, doubt: 0, fear: 0, corruption: 0 };
        this.applyEffects();
        this.saveState();
        console.log('🧠 États mentaux réinitialisés');
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.states));
        } catch (e) { }
    },

    /**
     * Charge l'état
     */
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.states = { ...this.states, ...JSON.parse(saved) };
            }
        } catch (e) { }
    }
};

// Fonctions globales
function setMentalState(state, value) { MentalStateManager.setState(state, value); }
function getMentalState(state) { return MentalStateManager.getState(state); }
function modifyMentalState(state, delta) { MentalStateManager.modifyState(state, delta); }
function transitionMentalState(state, value, duration) { MentalStateManager.transitionTo(state, value, duration); }

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    MentalStateManager.init();
});

// ============================================
// NARRATOR AI - Gestionnaire du Narrateur IA
// ============================================

const NarratorAI = {
    currentTone: 'calm', // calm, epic, dark, ironic
    deadOS: new Set(),   // Set of IDs of dead OSs
    corruptedOS: new Set(), // Set of IDs of corrupted OSs

    /**
     * Change le ton du narrateur
     * @param {string} tone - 'calm', 'epic', 'dark', 'ironic'
     */
    setTone(tone) {
        const validTones = ['calm', 'epic', 'dark', 'ironic'];
        if (validTones.includes(tone)) {
            this.currentTone = tone;
            console.log(`🤖 NarratorAI: Ton changé en ${tone}`);

            // Mise à jour visuelle immédiate si possible
            const dialogueBox = document.querySelector('.dialogue-box');
            if (dialogueBox) {
                dialogueBox.className = 'dialogue-box'; // Reset
                if (tone !== 'calm') {
                    // Les classes CSS sont appliquées sur le texte, mais on peut aussi styliser la box
                }
            }
        }
    },

    /**
     * Enregistre la mort d'un OS
     */
    registerDeath(osId) {
        this.deadOS.add(osId);
        console.log(`💀 NarratorAI: Décès enregistré de ${osId}`);
        // Si un OS meurt, le ton devient sombre temporairement
        if (this.currentTone !== 'epic') {
            this.setTone('dark');
        }
    },

    /**
     * Enregistre la corruption d'un OS
     */
    registerCorruption(osId) {
        this.corruptedOS.add(osId);
        this.setTone('dark');
    },

    /**
     * Traite le texte du narrateur selon le ton et l'état du jeu
     */
    processText(text) {
        let processed = text;

        // Si c'est le narrateur qui parle, on peut modifier le texte
        // Note: Cette fonction est appelée par VisualNovelEngine

        // Réactions contextuelles (Easter eggs)
        if (this.deadOS.has('windows7') && text.toLowerCase().includes('roi')) {
            processed += " (Le trône est désormais vide...)";
        }
        if (this.corruptedOS.has('chromeos') && text.toLowerCase().includes('futur')) {
            processed = processed.replace('futur', 'F.U.T.U.R (Corrompu)');
        }

        // Ajouts basés sur le ton (flavor text)
        switch (this.currentTone) {
            case 'epic':
                // Pas de modif de texte brut, géré par CSS, peut-être des emojis
                if (!processed.includes('⚔️')) processed = `✨ ${processed} ✨`;
                break;
            case 'dark':
                // Ambiance sombre
                break;
            case 'ironic':
                if (Math.random() > 0.8) processed += " (Enfin, théoriquement.)";
                break;
        }

        return processed;
    },

    /**
     * Retourne la classe CSS associée au ton actuel
     */
    getToneClass() {
        return `narrator-${this.currentTone}`;
    },

    /**
     * Commente un choix du joueur
     */
    commentOnChoice(choiceId) {
        const comments = {
            'calm': "Intéressant.",
            'epic': "Le destin est en marche.",
            'dark': "Cela ne te sauvera pas.",
            'ironic': "Vraiment ? Ce bouton là ?"
        };
        // Retourne un commentaire par défaut selon le ton, ou null
        return comments[this.currentTone] || null;
    },

    /**
     * Réinitialise le narrateur
     */
    reset() {
        this.currentTone = 'calm';
        this.deadOS.clear();
        this.corruptedOS.clear();
        console.log('🤖 NarratorAI: Réinitialisé');
    }
};

// ============================================
// CHARACTER SYSTEM - Gestionnaire de cycle de vie des OS
// ============================================

const CharacterSystem = {
    states: {
        // 'alive' (défaut), 'dead', 'ghost', 'resurrected', 'corrupted'
    },

    // Initialisation
    init() {
        this.loadStates();
    },

    getState(charId) {
        return this.states[charId] || 'alive';
    },

    setStatus(charId, status) {
        if (!charId) return;
        this.states[charId] = status;
        this.saveStates();
        console.log(`👤 CharacterSystem: ${charId} est maintenant ${status}`);

        // Impact collatéral sur le narrateur
        if (status === 'dead') {
            if (typeof NarratorAI !== 'undefined') NarratorAI.registerDeath(charId);
        } else if (status === 'corrupted') {
            if (typeof NarratorAI !== 'undefined') NarratorAI.registerCorruption(charId);
        }
    },

    // Raccourcis
    kill(charId) { this.setStatus(charId, 'dead'); },
    resurrect(charId) { this.setStatus(charId, 'resurrected'); },
    corrupt(charId) { this.setStatus(charId, 'corrupted'); },
    ghostify(charId) { this.setStatus(charId, 'ghost'); },
    reset(charId) { this.setStatus(charId, 'alive'); },

    // Persistance
    saveStates() {
        localStorage.setItem('osbook_char_states', JSON.stringify(this.states));
    },

    loadStates() {
        const saved = localStorage.getItem('osbook_char_states');
        if (saved) {
            try {
                this.states = JSON.parse(saved);
            } catch (e) {
                console.warn('Erreur chargement états persos', e);
            }
        }
    },

    resetAll() {
        this.states = {};
        this.saveStates();
    }
};

// Fonctions globales pour NarratorAI
function setNarratorTone(tone) { NarratorAI.setTone(tone); }

// ============================================
// MENU MANAGER - Gestionnaire du menu pause animé
// ============================================

/**
 * Gestionnaire du menu pause avec animations premium
 * Focus trap, debounce, ESC handler, synchronisation audio
 */
const MenuManager = {
    isOpen: false,
    isInitialized: false,
    lastToggleTime: 0,
    debounceDelay: 300,

    // Éléments du DOM
    elements: {
        menu: null,
        btn: null,
        backdrop: null,
        panel: null,
        muteBtn: null,
        speedSlider: null,
        speedLabel: null
    },

    // Focusables pour le trap
    focusableElements: [],
    previousFocus: null,

    /**
     * Initialise le menu (appelé une fois au démarrage)
     */
    init() {
        if (this.isInitialized) return;

        this.elements = {
            menu: document.getElementById('vn-menu'),
            btn: document.getElementById('menu-btn'),
            backdrop: document.getElementById('menu-backdrop'),
            panel: document.getElementById('menu-panel'),
            muteBtn: document.querySelector('[data-action="mute"]'),
            speedSlider: document.getElementById('typing-speed'),
            speedLabel: document.getElementById('speed-label')
        };

        if (!this.elements.menu || !this.elements.btn) {
            console.warn('⚠️ Menu elements not found');
            return;
        }

        this.setupEventListeners();
        this.isInitialized = true;
        console.log('🎮 MenuManager initialisé');
    },

    /**
     * Configure tous les événements du menu
     */
    setupEventListeners() {
        // Bouton hamburger
        this.elements.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Backdrop (clic pour fermer)
        this.elements.backdrop?.addEventListener('click', () => this.close());

        // Touche ESC globale
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                e.preventDefault();
                this.close();
            }
        });

        // Focus trap (Tab)
        this.elements.panel?.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTabKey(e);
            }
        });

        // Actions des boutons
        this.elements.panel?.querySelectorAll('.menu-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction(btn.dataset.action);
            });
        });

        // Slider de vitesse
        this.elements.speedSlider?.addEventListener('input', (e) => {
            this.updateSpeedLabel(parseInt(e.target.value));
        });

        // Empêcher le clic sur le panel de propager
        this.elements.panel?.addEventListener('click', (e) => e.stopPropagation());
    },

    /**
     * Ouvre le menu avec animation
     */
    open() {
        if (this.isOpen || !this.canToggle()) return;

        this.isOpen = true;
        this.lastToggleTime = Date.now();
        this.previousFocus = document.activeElement;

        // Ajouter la classe open
        this.elements.menu.classList.add('open');
        this.elements.btn.setAttribute('aria-expanded', 'true');
        this.elements.backdrop?.setAttribute('aria-hidden', 'false');

        // Focus sur le premier bouton
        this.updateFocusableElements();
        if (this.focusableElements.length > 0) {
            setTimeout(() => this.focusableElements[0].focus(), 50);
        }

        // Marquer le jeu en pause
        if (typeof window.vnEngine !== 'undefined' && window.vnEngine) {
            window.vnEngine.isPaused = true;
        }

        // Sync état du bouton son
        this.syncMuteButton();

        console.log('📖 Menu ouvert');
    },

    /**
     * Ferme le menu avec animation
     */
    close() {
        if (!this.isOpen || !this.canToggle()) return;

        this.isOpen = false;
        this.lastToggleTime = Date.now();

        // Retirer la classe open
        this.elements.menu.classList.remove('open');
        this.elements.btn.setAttribute('aria-expanded', 'false');
        this.elements.backdrop?.setAttribute('aria-hidden', 'true');

        // Restaurer le focus précédent
        if (this.previousFocus) {
            this.previousFocus.focus();
        }

        // Reprendre le jeu
        if (typeof window.vnEngine !== 'undefined' && window.vnEngine) {
            window.vnEngine.isPaused = false;
        }

        console.log('📕 Menu fermé');
    },

    /**
     * Toggle le menu (ouvrir/fermer)
     */
    toggle() {
        this.isOpen ? this.close() : this.open();
    },

    /**
     * Vérifie si on peut toggler (debounce)
     */
    canToggle() {
        return Date.now() - this.lastToggleTime > this.debounceDelay;
    },

    /**
     * Met à jour la liste des éléments focusables
     */
    updateFocusableElements() {
        const selector = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
        this.focusableElements = [...this.elements.panel.querySelectorAll(selector)];
    },

    /**
     * Gère le focus trap avec Tab
     */
    handleTabKey(e) {
        if (this.focusableElements.length === 0) return;

        const firstElement = this.focusableElements[0];
        const lastElement = this.focusableElements[this.focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    },

    /**
     * Gère les actions des boutons du menu
     */
    handleAction(action) {
        switch (action) {
            case 'resume':
                this.close();
                break;

            case 'chapters':
                this.close();
                // Ouvrir la modale des chapitres
                const chapterModal = document.getElementById('chapter-modal');
                if (chapterModal) {
                    chapterModal.classList.add('open');
                }
                break;

            case 'timeline':
                this.close();
                // Ouvrir la timeline
                if (typeof TimelineManager !== 'undefined') {
                    TimelineManager.open();
                }
                break;

            case 'memories':
                this.close();
                if (typeof MemoryLogManager !== 'undefined') {
                    MemoryLogManager.open();
                }
                break;

            case 'mute':
                this.toggleMute();
                break;

            case 'restart':
                if (confirm('Voulez-vous vraiment recommencer ?')) {
                    this.close();
                    if (typeof window.vnEngine !== 'undefined') {
                        window.vnEngine.restart();
                    } else {
                        location.reload();
                    }
                }
                break;

            case 'toStart':
                if (confirm('Retourner à l\'écran titre ?')) {
                    this.close();
                    // Afficher l'écran titre
                    document.getElementById('vn-scene')?.classList.remove('active');
                    document.getElementById('start-screen')?.classList.add('active');
                    if (typeof window.audioManager !== 'undefined') {
                        window.audioManager.stopMusic();
                    }
                }
                break;
        }
    },

    /**
     * Toggle mute/unmute
     */
    toggleMute() {
        if (typeof window.audioManager !== 'undefined') {
            window.audioManager.toggleMute();
            this.syncMuteButton();
        }
    },

    /**
     * Sync le bouton son avec l'état actuel
     */
    syncMuteButton() {
        if (!this.elements.muteBtn) return;

        const isMuted = typeof window.audioManager !== 'undefined' && window.audioManager.isMuted;
        this.elements.muteBtn.textContent = isMuted ? '🔇 Son (muet)' : '🔊 Son';
    },

    /**
     * Met à jour le label de vitesse
     */
    updateSpeedLabel(value) {
        if (!this.elements.speedLabel) return;

        let label = 'Normal';
        if (value < 30) label = 'Lent';
        else if (value > 70) label = 'Rapide';

        this.elements.speedLabel.textContent = label;

        // Mettre à jour le moteur si disponible
        if (typeof window.vnEngine !== 'undefined') {
            // Convertir 0-100 en délai de typing (plus haut = plus rapide = délai plus court)
            window.vnEngine.typingDelay = Math.max(5, 80 - value * 0.7);
        }
    }
};

// Fonctions globales pour compatibilité
function openMenu() { MenuManager.open(); }
function closeMenu() { MenuManager.close(); }
function toggleMenu() { MenuManager.toggle(); }

// Initialisation du MenuManager au chargement
document.addEventListener('DOMContentLoaded', () => {
    MenuManager.init();
});

// ============================================
// INTRO MANAGER - Gestionnaire de l'intro cinématique
// ============================================

/**
 * Gestionnaire de l'écran d'intro cinématique
 * Skippable, avec auto-skip si déjà vue
 */
const IntroManager = {
    isPlaying: false,
    isSkipped: false,
    introTimeout: null,
    storageKey: 'osbook_intro_seen',
    introDuration: 8000, // 8 secondes

    // Éléments du DOM
    elements: {
        introScreen: null,
        skipBtn: null,
        startScreen: null
    },

    /**
     * Initialise l'intro manager
     */
    init() {
        this.elements = {
            introScreen: document.getElementById('intro-screen'),
            skipBtn: document.getElementById('intro-skip-btn'),
            startScreen: document.getElementById('start-screen')
        };

        if (!this.elements.introScreen) {
            console.warn('⚠️ Intro screen not found');
            return;
        }

        this.setupEventListeners();

        // Vérifier si l'intro a déjà été vue
        if (this.hasSeenIntro()) {
            this.skipIntro(true); // Skip silencieux
        } else {
            this.playIntro();
        }

        console.log('🎬 IntroManager initialisé');
    },

    /**
     * Configure les événements
     */
    setupEventListeners() {
        // Bouton skip
        this.elements.skipBtn?.addEventListener('click', () => this.skipIntro());

        // Touches clavier (ESC, Space, Enter)
        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying || this.isSkipped) return;

            if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.skipIntro();
            }
        });
    },

    /**
     * Joue l'intro cinématique
     */
    playIntro() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.isSkipped = false;

        // Afficher l'intro
        this.elements.introScreen?.classList.add('active');

        // Timer pour fin automatique
        this.introTimeout = setTimeout(() => {
            this.endIntro();
        }, this.introDuration);

        console.log('🎬 Intro démarrée');
    },

    /**
     * Skip l'intro
     * @param {boolean} silent - Si true, ne marque pas comme vue
     */
    skipIntro(silent = false) {
        if (this.isSkipped) return;

        this.isSkipped = true;

        // Annuler le timer
        if (this.introTimeout) {
            clearTimeout(this.introTimeout);
        }

        // Marquer comme vue (sauf si skip silencieux au démarrage)
        if (!silent) {
            this.markIntroSeen();
        }

        this.endIntro();

        console.log('⏭️ Intro skippée');
    },

    /**
     * Termine l'intro et affiche l'écran titre
     */
    endIntro() {
        this.isPlaying = false;

        // Marquer comme vue
        this.markIntroSeen();

        // Fade out de l'intro
        this.elements.introScreen?.classList.add('fade-out');

        // Après le fade, cacher l'intro et afficher le start screen
        setTimeout(() => {
            this.elements.introScreen?.classList.remove('active', 'fade-out');
            this.elements.startScreen?.classList.add('active');
        }, 800);

        console.log('🎬 Intro terminée → Écran titre');
    },

    /**
     * Vérifie si l'intro a déjà été vue
     */
    hasSeenIntro() {
        try {
            return localStorage.getItem(this.storageKey) === '1';
        } catch (e) {
            return false;
        }
    },

    /**
     * Marque l'intro comme vue
     */
    markIntroSeen() {
        try {
            localStorage.setItem(this.storageKey, '1');
        } catch (e) {
            console.warn('localStorage non disponible');
        }
    },

    /**
     * Réinitialise l'intro (pour debug)
     */
    reset() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🔄 Intro réinitialisée');
        } catch (e) { }
    }
};

// Fonctions globales pour compatibilité
function playIntro() { IntroManager.playIntro(); }
function skipIntro() { IntroManager.skipIntro(); }

// Initialisation de l'intro au chargement
document.addEventListener('DOMContentLoaded', () => {
    IntroManager.init();
});

// ============================================
// MEDIA PLAYER MANAGER - Lecteur audio dynamique
// ============================================

/**
 * Playlist des pistes audio du jeu
 */
const TRACKS = [
    { id: 'classic', title: 'Windows 95 Classic', src: 'music/95 (Windows Classic Remix).mp3' },
    { id: 'xp_install', title: 'Windows XP Installation', src: 'music/Windows XP installation music.mp3' },
    { id: 'xp_error', title: 'Windows XP Error Remix', src: 'music/Windows XP Error Remix.mp3' },
    { id: 'vista', title: 'Windows Vista Remix', src: 'music/Windows Vista Remix (By SilverWolf).mp3' },
    { id: 'win7', title: 'Windows 7 Remix', src: 'music/Windows 7 Remix 2 (By SilverWolf).mp3' },
    { id: 'win8_error', title: 'Windows 8 Error Remix', src: 'music/rgLed - Windows 8 Error Dubstep Remix!.mp3' },
    { id: 'win10', title: 'Windows 10 Remix', src: 'music/Windows 10 Remix.mp3' },
    { id: 'win11', title: 'Windows 11 Remix', src: 'music/Windows 11 Remix.mp3' },
    { id: 'longhorn', title: 'LongHorn Day', src: 'music/LongHorn Day (Windows Longhorn Remix).mp3' },
    { id: 'mac', title: 'Mac Startup Remix', src: 'music/Mac Startup Remix Extended.mp3' }
];

/**
 * Gestionnaire du Media Player avec playlist et persistence
 */
const MediaPlayerManager = {
    isVisible: false,
    isPlaying: false,
    isMuted: false,
    currentTrackIndex: 0,
    volume: 0.5,
    audio: null,
    storageKey: 'osbook_player_state',
    updateInterval: null,

    // Éléments du DOM
    elements: {},

    /**
     * Initialise le Media Player
     */
    init() {
        this.audio = musicPlayer; // Utiliser le lecteur existant

        this.elements = {
            player: document.getElementById('media-player'),
            closeBtn: document.getElementById('media-player-close'),
            toggleBtn: document.getElementById('media-player-toggle'),
            title: document.getElementById('mp-title'),
            currentTime: document.getElementById('mp-current-time'),
            duration: document.getElementById('mp-duration'),
            progressFill: document.getElementById('mp-progress-fill'),
            seekSlider: document.getElementById('mp-seek'),
            playBtn: document.getElementById('mp-play'),
            prevBtn: document.getElementById('mp-prev'),
            nextBtn: document.getElementById('mp-next'),
            muteBtn: document.getElementById('mp-mute'),
            volumeSlider: document.getElementById('mp-volume')
        };

        if (!this.elements.player) {
            console.warn('⚠️ Media Player not found');
            return;
        }

        this.setupEventListeners();
        this.restoreState();

        console.log('🎵 MediaPlayerManager initialisé');
    },

    /**
     * Configure les événements
     */
    setupEventListeners() {
        // Toggle visibility
        this.elements.toggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.elements.closeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
        });

        // Contrôles de lecture
        this.elements.playBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlay();
        });

        this.elements.prevBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevTrack();
        });

        this.elements.nextBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextTrack();
        });

        // Volume
        this.elements.muteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMute();
        });

        this.elements.volumeSlider?.addEventListener('input', (e) => {
            e.stopPropagation();
            this.setVolume(e.target.value / 100);
        });

        // Seek
        this.elements.seekSlider?.addEventListener('input', (e) => {
            e.stopPropagation();
            this.seek(e.target.value / 100);
        });

        // Empêcher propagation sur le player
        this.elements.player?.addEventListener('click', (e) => e.stopPropagation());

        // Events audio
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
    },

    /**
     * Affiche le player
     */
    show() {
        this.isVisible = true;
        this.elements.player?.classList.add('visible');
        this.elements.toggleBtn?.classList.add('hidden');
        this.saveState();
    },

    /**
     * Cache le player
     */
    hide() {
        this.isVisible = false;
        this.elements.player?.classList.remove('visible');
        this.elements.toggleBtn?.classList.remove('hidden');
        this.saveState();
    },

    /**
     * Toggle visibility
     */
    toggle() {
        this.isVisible ? this.hide() : this.show();
    },

    /**
     * Charge une piste par ID
     */
    setTrack(trackId) {
        const index = TRACKS.findIndex(t => t.id === trackId);
        if (index === -1) {
            console.warn(`⚠️ Track "${trackId}" non trouvée`);
            return false;
        }
        this.loadTrack(index);
        return true;
    },

    /**
     * Charge une piste par index
     */
    loadTrack(index) {
        if (index < 0 || index >= TRACKS.length) return;

        this.currentTrackIndex = index;
        const track = TRACKS[index];

        // Mettre à jour l'UI
        if (this.elements.title) {
            this.elements.title.textContent = track.title;
        }

        // Charger l'audio
        this.audio.src = track.src;
        this.audio.load();

        // Reset progress
        this.updateProgress();

        console.log(`🎵 Track: ${track.title}`);
        this.saveState();
    },

    /**
     * Lecture
     */
    play() {
        const playPromise = this.audio.play();
        if (playPromise) {
            playPromise.catch(e => {
                console.warn('Lecture bloquée:', e);
                this.elements.title.textContent = 'Cliquez pour jouer';
            });
        }
    },

    /**
     * Pause
     */
    pause() {
        this.audio.pause();
    },

    /**
     * Toggle play/pause
     */
    togglePlay() {
        if (this.audio.paused) {
            this.play();
        } else {
            this.pause();
        }
    },

    /**
     * Piste suivante
     */
    nextTrack() {
        const next = (this.currentTrackIndex + 1) % TRACKS.length;
        this.loadTrack(next);
        if (this.isPlaying) this.play();
    },

    /**
     * Piste précédente
     */
    prevTrack() {
        let prev = this.currentTrackIndex - 1;
        if (prev < 0) prev = TRACKS.length - 1;
        this.loadTrack(prev);
        if (this.isPlaying) this.play();
    },

    /**
     * Seek
     */
    seek(percent) {
        if (this.audio.duration) {
            this.audio.currentTime = percent * this.audio.duration;
        }
    },

    /**
     * Set volume
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.audio.volume = this.isMuted ? 0 : this.volume;
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.value = this.volume * 100;
        }
        this.saveState();
    },

    /**
     * Toggle mute
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.volume = this.isMuted ? 0 : this.volume;
        if (this.elements.muteBtn) {
            this.elements.muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
        }
        this.saveState();
    },

    /**
     * Handlers audio events
     */
    onPlay() {
        this.isPlaying = true;
        if (this.elements.playBtn) {
            this.elements.playBtn.textContent = '⏸';
        }
        this.saveState();
    },

    onPause() {
        this.isPlaying = false;
        if (this.elements.playBtn) {
            this.elements.playBtn.textContent = '▶';
        }
        this.saveState();
    },

    /**
     * Met à jour la progress bar
     */
    updateProgress() {
        const current = this.audio.currentTime || 0;
        const duration = this.audio.duration || 0;
        const percent = duration ? (current / duration) * 100 : 0;

        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percent}%`;
        }
        if (this.elements.seekSlider) {
            this.elements.seekSlider.value = percent;
        }
        if (this.elements.currentTime) {
            this.elements.currentTime.textContent = this.formatTime(current);
        }
    },

    /**
     * Met à jour la durée
     */
    updateDuration() {
        if (this.elements.duration) {
            this.elements.duration.textContent = this.formatTime(this.audio.duration || 0);
        }
    },

    /**
     * Format time mm:ss
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Sauvegarde l'état dans localStorage
     */
    saveState() {
        try {
            const state = {
                trackId: TRACKS[this.currentTrackIndex]?.id,
                currentTime: this.audio.currentTime || 0,
                volume: this.volume,
                isMuted: this.isMuted,
                isVisible: this.isVisible
            };
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (e) { }
    },

    /**
     * Restaure l'état depuis localStorage
     */
    restoreState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;

            const state = JSON.parse(saved);

            // Volume
            if (state.volume !== undefined) {
                this.setVolume(state.volume);
            }

            // Mute
            if (state.isMuted) {
                this.isMuted = true;
                this.audio.volume = 0;
                if (this.elements.muteBtn) {
                    this.elements.muteBtn.textContent = '🔇';
                }
            }

            // Track
            if (state.trackId) {
                this.setTrack(state.trackId);
            }

            // Visibility
            if (state.isVisible) {
                this.show();
            }

            console.log('🎵 État du player restauré');
        } catch (e) { }
    }
};

// Fonctions globales pour compatibilité
function showMediaPlayer() { MediaPlayerManager.show(); }
function hideMediaPlayer() { MediaPlayerManager.hide(); }
function setTrack(id) { return MediaPlayerManager.setTrack(id); }
function playTrack() { MediaPlayerManager.play(); }
function pauseTrack() { MediaPlayerManager.pause(); }
function nextTrack() { MediaPlayerManager.nextTrack(); }
function prevTrack() { MediaPlayerManager.prevTrack(); }

// Legacy functions
function togglePlayPause() { MediaPlayerManager.togglePlay(); }
function stopAudio() { MediaPlayerManager.pause(); }

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    MediaPlayerManager.init();
});

class AudioManager {
    constructor() {
        this.currentBgmPath = null;
        this.fadeInterval = null;
        this.sfxFadeInterval = null;
        this.volume = 0.5;
        this.sfxVolume = 0.5;
        this.isMuted = false;
        this.isInitialized = false;
        this.audioCache = {};
        this.volumeListeners = new Set();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('🔊 Audio Manager initialisé (2 canaux)');
    }

    preload(path) {
        if (!this.audioCache[path]) {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'audio';
            preloadLink.href = path;
            document.head.appendChild(preloadLink);
            this.audioCache[path] = true;
        }
        return this.audioCache[path];
    }

    // ========== MUSIQUE DE FOND (BGM) ==========

    stopCurrentMusicImmediately() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        try {
            musicPlayer.pause();
            musicPlayer.currentTime = 0;
        } catch (e) {
            console.log('Erreur arrêt musique:', e);
        }
        this.currentBgmPath = null;
    }

    playMusic(path, fadeIn = true) {
        this.init();

        // Si déjà en lecture de cette piste, ne rien faire
        if (this.currentBgmPath === path && !musicPlayer.paused) {
            return;
        }

        // Arrêter la musique actuelle
        this.stopCurrentMusicImmediately();

        // Configurer le nouveau morceau
        musicPlayer.src = path;
        musicPlayer.loop = true;
        musicPlayer.volume = fadeIn ? 0 : this.volume * (this.isMuted ? 0 : 1);
        this.currentBgmPath = path;

        console.log('🎵 Nouvelle musique:', path);

        // Mise à jour du titre dans le Media Player
        if (typeof updateWmpTitle === 'function') {
            updateWmpTitle(path);
        }

        const playPromise = musicPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`🎵 Audio démarré : ${path}`);
            }).catch(error => {
                console.log('Erreur lecture:', error);
            });
        }

        if (fadeIn) {
            this.fadeInMusic(2000);
        }
    }

    stopMusic(fadeOut = true) {
        if (musicPlayer.paused && !this.currentBgmPath) {
            return;
        }

        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        if (fadeOut) {
            this.fadeOutMusic(1500, () => {
                musicPlayer.pause();
                musicPlayer.currentTime = 0;
            });
            this.currentBgmPath = null;
        } else {
            this.stopCurrentMusicImmediately();
        }
    }

    fadeInMusic(duration) {
        const targetVolume = this.volume * (this.isMuted ? 0 : 1);
        const step = targetVolume / (duration / 50);
        musicPlayer.volume = 0;

        const fade = setInterval(() => {
            if (musicPlayer.paused) {
                clearInterval(fade);
                return;
            }

            if (musicPlayer.volume + step >= targetVolume) {
                musicPlayer.volume = targetVolume;
                clearInterval(fade);
            } else {
                musicPlayer.volume += step;
            }
        }, 50);
    }

    fadeOutMusic(duration, callback) {
        const startVolume = musicPlayer.volume;
        const step = startVolume / (duration / 50);

        this.fadeInterval = setInterval(() => {
            if (musicPlayer.paused) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                if (callback) callback();
                return;
            }

            if (musicPlayer.volume - step <= 0) {
                musicPlayer.volume = 0;
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                if (callback) callback();
            } else {
                musicPlayer.volume -= step;
            }
        }, 50);
    }

    // ========== EFFETS SONORES (SFX) ==========
    // NE COUPE PAS LA MUSIQUE DE FOND !

    playSFX(path, volume = 1, loop = false) {
        this.init();

        // Configurer le lecteur SFX
        sfxPlayer.src = path;
        sfxPlayer.loop = loop;
        sfxPlayer.volume = this.sfxVolume * volume * (this.isMuted ? 0 : 1);

        console.log('🔊 SFX:', path);

        const playPromise = sfxPlayer.play();
        if (playPromise) {
            playPromise.catch(e => console.warn('SFX bloqué:', e));
        }

        return sfxPlayer;
    }

    stopSFX() {
        if (this.sfxFadeInterval) {
            clearInterval(this.sfxFadeInterval);
            this.sfxFadeInterval = null;
        }
        try {
            sfxPlayer.pause();
            sfxPlayer.currentTime = 0;
        } catch (e) {
            console.log('Erreur arrêt SFX:', e);
        }
    }

    fadeOutSFX(duration = 1500, callback) {
        const startVolume = sfxPlayer.volume;
        const step = startVolume / (duration / 50);

        this.sfxFadeInterval = setInterval(() => {
            if (sfxPlayer.paused) {
                clearInterval(this.sfxFadeInterval);
                this.sfxFadeInterval = null;
                if (callback) callback();
                return;
            }

            if (sfxPlayer.volume - step <= 0) {
                sfxPlayer.volume = 0;
                clearInterval(this.sfxFadeInterval);
                this.sfxFadeInterval = null;
                sfxPlayer.pause();
                sfxPlayer.currentTime = 0;
                if (callback) callback();
            } else {
                sfxPlayer.volume -= step;
            }
        }, 50);
    }

    // ========== CONTRÔLE VOLUME ==========

    setVolume(value) {
        this.volume = value;
        this.sfxVolume = value;
        if (!this.isMuted) {
            musicPlayer.volume = value;
            sfxPlayer.volume = value;
        }
        this.notifyVolumeListeners();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            musicPlayer.volume = 0;
            sfxPlayer.volume = 0;
        } else {
            musicPlayer.volume = this.volume;
            sfxPlayer.volume = this.sfxVolume;
        }
        this.notifyVolumeListeners();
        return this.isMuted;
    }

    addVolumeListener(callback) {
        this.volumeListeners.add(callback);
    }

    removeVolumeListener(callback) {
        this.volumeListeners.delete(callback);
    }

    notifyVolumeListeners() {
        this.volumeListeners.forEach(callback => callback());
    }

    // Méthodes legacy pour compatibilité
    fadeIn(audio, duration) {
        if (audio === musicPlayer) {
            this.fadeInMusic(duration);
        }
    }

    fadeOut(audio, duration, callback) {
        if (audio === musicPlayer) {
            this.fadeOutMusic(duration, callback);
        } else if (audio === sfxPlayer) {
            this.fadeOutSFX(duration, callback);
        }
    }
}

// ============================================
// ANIMATION ECG / MONITEUR CARDIAQUE
// ============================================

class HeartMonitor {
    constructor(audioManager = null) {
        this.element = document.getElementById('heart-monitor');
        this.ecgPath = document.getElementById('ecg-path');
        this.bpmValue = document.getElementById('bpm-value');
        this.monitorLabel = document.querySelector('.monitor-label');

        this.isRunning = false;
        this.bpm = 72;
        this.animationFrame = null;

        this.monitorSound = null;
        this.monitorSoundPath = 'sfx/ambience/Monitor.mp3';
        this.monitorVolume = 0.3;

        this.audioManager = null;
        this.onAudioChange = () => this.updateMonitorSoundVolume();
        if (audioManager) {
            this.setAudioManager(audioManager);
        }
    }

    show() {
        this.element.classList.remove('hidden');
    }

    hide() {
        this.element.classList.add('hidden');
        this.stop();
        this.stopSound();
    }

    startSound(volume = this.monitorVolume) {
        this.stopSound();

        try {
            // Utilise sfxPlayer - NE coupe PAS la musique de fond !
            sfxPlayer.src = this.monitorSoundPath;
            sfxPlayer.loop = true;
            sfxPlayer.volume = this.getMonitorSoundVolume(volume);
            this.monitorSound = sfxPlayer;

            const playPromise = sfxPlayer.play();
            if (playPromise) {
                playPromise.catch(e => console.warn('Son moniteur bloqué:', e));
            }
            console.log('💓 Moniteur cardiaque démarré');
        } catch (e) {
            console.warn('Erreur lecture son moniteur:', e);
        }
    }

    setAudioManager(audioManager) {
        if (this.audioManager) {
            this.audioManager.removeVolumeListener(this.onAudioChange);
        }
        this.audioManager = audioManager;
        if (this.audioManager) {
            this.audioManager.addVolumeListener(this.onAudioChange);
            this.updateMonitorSoundVolume();
        }
    }

    getMonitorSoundVolume(volume = this.monitorVolume) {
        if (!this.audioManager) {
            return volume;
        }
        return this.audioManager.isMuted ? 0 : this.audioManager.volume * volume;
    }

    updateMonitorSoundVolume(volume = this.monitorVolume) {
        if (!this.monitorSound) return;
        this.monitorSound.volume = this.getMonitorSoundVolume(volume);
    }

    stopSound() {
        if (!this.monitorSound) return;
        try {
            sfxPlayer.pause();
            sfxPlayer.currentTime = 0;
        } catch (e) {
            console.log('Erreur arrêt son moniteur:', e);
        }
        this.monitorSound = null;
    }

    fadeOutSound(duration = 2000, callback) {
        if (!this.monitorSound) {
            if (callback) callback();
            return;
        }

        const startVolume = this.monitorSound.volume;
        const step = startVolume / (duration / 50);
        const sound = this.monitorSound;

        const fade = setInterval(() => {
            if (!sound || sound.paused) {
                clearInterval(fade);
                if (callback) callback();
                return;
            }

            if (sound.volume - step <= 0) {
                sound.volume = 0;
                clearInterval(fade);
                this.stopSound();
                if (callback) callback();
            } else {
                sound.volume -= step;
            }
        }, 50);
    }

    start(bpm = 72) {
        this.bpm = bpm;
        this.isRunning = true;
        this.element.classList.remove('flatline');
        this.ecgPath.classList.remove('flatline');
        this.monitorLabel.classList.remove('flatline');

        this.startSound();
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;

        let offset = 0;

        const draw = () => {
            if (!this.isRunning) return;

            offset = (offset + 2) % 400;

            const points = this.generateECGPoints(offset);
            this.ecgPath.setAttribute('points', points);

            this.bpmValue.textContent = this.bpm;

            this.animationFrame = requestAnimationFrame(draw);
        };

        draw();
    }

    generateECGPoints(offset) {
        const points = [];
        const width = 400;
        const height = 100;
        const mid = height / 2;

        for (let x = 0; x < width; x++) {
            const phase = ((x + offset) % 100) / 100;
            let y = mid;

            if (phase < 0.1) {
                y = mid;
            } else if (phase < 0.15) {
                y = mid - 10 * Math.sin((phase - 0.1) * Math.PI / 0.05);
            } else if (phase < 0.25) {
                y = mid;
            } else if (phase < 0.3) {
                y = mid + 5;
            } else if (phase < 0.35) {
                const t = (phase - 0.3) / 0.05;
                y = mid - 40 * Math.sin(t * Math.PI);
            } else if (phase < 0.4) {
                y = mid + 10;
            } else if (phase < 0.55) {
                y = mid;
            } else if (phase < 0.7) {
                y = mid - 15 * Math.sin((phase - 0.55) * Math.PI / 0.15);
            } else {
                y = mid;
            }

            points.push(`${x},${y}`);
        }

        return points.join(' ');
    }

    slowDown(duration = 5000, callback) {
        const startBpm = this.bpm;
        const startTime = Date.now();

        const slow = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.bpm = Math.round(startBpm * (1 - progress * 0.8));

            if (progress < 1) {
                setTimeout(slow, 100);
            } else {
                if (callback) callback();
            }
        };

        slow();
    }

    flatline() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationFrame);

        this.element.classList.add('flatline');
        this.ecgPath.classList.add('flatline');
        this.monitorLabel.classList.add('flatline');

        this.ecgPath.setAttribute('points', '0,50 400,50');
        this.bpmValue.textContent = '0';

        this.fadeOutSound(1500);
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// ============================================
// CONFIGURATION DES SCÈNES (DÉCORS)
// ============================================

const SCENES_CONFIG = {
    hospital: {
        id: 'hospital',
        name: 'Hôpital',
        bgElement: 'hospital-bg',
        characterClass: 'hospital-scene',
        showMonitor: true,
        showGraves: false
    },
    graveyard: {
        id: 'graveyard',
        name: 'Cimetière',
        bgElement: 'graveyard-bg',
        characterClass: 'graveyard-scene',
        showMonitor: false,
        showGraves: true
    },
    void: {
        id: 'void',
        name: 'Le Vide',
        bgElement: 'void-bg',
        characterClass: 'void-scene',
        showMonitor: false,
        showGraves: false
    },
    afterlife: {
        id: 'afterlife',
        name: "L'Au-delà",
        bgElement: 'afterlife-bg',
        characterClass: 'afterlife-scene',
        showMonitor: false,
        showGraves: false
    }
};

// ============================================
// CONFIGURATION DES PERSONNAGES
// ============================================

const CHARACTERS = {
    vista: {
        id: 'vista',
        name: 'Windows Vista',
        image: 'logo/Windows_vista.png',
        color: '#00cc6a',
        dates: '2007 - 2017'
    },
    windows7: {
        id: 'windows7',
        name: 'Windows 7',
        image: 'logo/Windows_7.png',
        color: '#00a8e8',
        dates: '2009 - 2020'
    },
    windows10: {
        id: 'windows10',
        name: 'Windows 10',
        image: 'logo/Windows_10.png',
        color: '#0078d4',
        dates: '2015 - 2025'
    },
    windows8: {
        id: 'windows8',
        name: 'Windows 8',
        image: 'logo/Windows_8.png',
        color: '#00adef',
        dates: '2012 - 2023'
    },
    windows81: {
        id: 'windows81',
        name: 'Windows 8.1',
        image: 'logo/Windows_8.1.png',
        color: '#00adef',
        dates: '2013 - 2023'
    },
    windows11: {
        id: 'windows11',
        name: 'Windows 11',
        image: 'logo/Windows_11.png',
        color: '#0078d4'
    },
    xp: {
        id: 'xp',
        name: 'Windows XP',
        image: 'logo/Windows_xp.png',
        color: '#ff8c00',
        dates: '2001 - 2014'
    },
    windows98: {
        id: 'windows98',
        name: 'Windows 98',
        image: 'logo/Windows_98.png',
        color: '#008080',
        dates: '1998 - 2006'
    },
    windowsme: {
        id: 'windowsme',
        name: 'Windows ME',
        image: 'logo/Windows_me.png',
        color: '#6b0b0b',
        dates: '2000 - 2006'
    },
    windows2000: {
        id: 'windows2000',
        name: 'Windows 2000',
        image: 'logo/Windows_2000.png',
        color: '#003399',
        dates: '2000 - 2010'
    },
    narrator: {
        id: 'narrator',
        name: 'Narrateur',
        image: null,
        color: '#9ca3af'
    },
    kernel: {
        id: 'kernel',
        name: 'Dieu/Kernel',
        image: 'logo/Kernel.svg',
        color: '#f6d365'
    },
    // Personnages secrets pour la scène post-générique
    macos: {
        id: 'macos',
        name: 'macOS',
        image: 'logo/macOS_Big_Sur.png',
        color: '#a855f7'
    },
    ubuntu: {
        id: 'ubuntu',
        name: 'Ubuntu',
        image: 'logo/Ubuntu-2006.png',
        color: '#e95420'
    },
    // Personnage final secret
    windows12: {
        id: 'windows12',
        name: 'Windows 12',
        image: 'logo/Windows_12.png',
        color: '#00d4aa'
    },
    // Personnages de l'Au-delà (Anciens)
    windows10x: {
        id: 'windows10x',
        name: 'Windows 1.0',
        image: 'logo/Windows_1.0.png',
        color: '#808080',
        dates: '1985 - 2001'
    },
    windows31: {
        id: 'windows31',
        name: 'Windows 3.1',
        image: 'logo/Windows_3.1.png',
        color: '#a0a0a0',
        dates: '1992 - 2001'
    },
    windows95: {
        id: 'windows95',
        name: 'Windows 95',
        image: 'logo/Windows_95.png',
        color: '#008080',
        dates: '1995 - 2001'
    },
    // ANTAGONISTE - ChromeOS le méchant
    chromeos: {
        id: 'chromeos',
        name: 'ChromeOS',
        image: 'logo/chromeos.png',
        color: '#ff2d55',
        villain: true
    },
    // ENTITÉ DIVINE - Le Kernel (Dieu des OS)
    kernel: {
        id: 'kernel',
        name: 'Le Kernel',
        image: 'logo/Kernel.svg',
        color: '#ffffff',
        divine: true
    }
};

const ASSETS = {
    windows_vista: 'logo/Windows_vista.png',
    windows_7: 'logo/Windows_7.png',
    windows_10: 'logo/Windows_10.png',
    windows_8: 'logo/Windows_8.png',
    'windows_8.1': 'logo/Windows_8.1.png',
    windows_11: 'logo/Windows_11.png',
    windows_xp: 'logo/Windows_xp.png',
    windows_98: 'logo/Windows_98.png',
    windows_me: 'logo/Windows_me.png',
    windows_2000: 'logo/Windows_2000.png',
    kernel: 'logo/Kernel.svg',
    macos: 'logo/macOS_Big_Sur.png',
    ubuntu: 'logo/Ubuntu-2006.png',
    windows_12: 'logo/Windows_12.png',
    'windows_1.0': 'logo/Windows_1.0.png',
    'windows_3.1': 'logo/Windows_3.1.png',
    windows_95: 'logo/Windows_95.png',
    chromeos: 'logo/chromeos.png'
};

const CHARACTER_NAME_ALIASES = {
    vista: 'windows_vista',
    windowsvista: 'windows_vista',
    windows7: 'windows_7',
    windows10: 'windows_10',
    windows8: 'windows_8',
    windows81: 'windows_8.1',
    'windows8.1': 'windows_8.1',
    windows11: 'windows_11',
    windows12: 'windows_12',
    'windows1.0': 'windows_1.0',
    'windows3.1': 'windows_3.1',
    windows95: 'windows_95',
    windows98: 'windows_98',
    windowsme: 'windows_me',
    windows2000: 'windows_2000',
    windowsxp: 'windows_xp',
    xp: 'windows_xp',
    le_kernel: 'kernel'
};

// GitHub Pages est sensible à la casse : un simple Windows_Vista.png casse l'image.
const KNOWN_PATH_FIXES = {
    'logo/Windows_Vista.png': 'logo/Windows_vista.png',
    'logo/windows_vista.png': 'logo/Windows_vista.png'
};

function normalizeCharacterName(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, '_')
        .replace(/_+/g, '_');
}

function normalizeAssetPath(path) {
    if (!path) return null;
    const cleaned = path.trim().replace(/\\/g, '/');
    return KNOWN_PATH_FIXES[cleaned] || cleaned;
}

function getCharacterImage(name, fallbackPath = null) {
    const normalizedFallback = normalizeAssetPath(fallbackPath);
    if (!name) return normalizedFallback;
    const normalized = normalizeCharacterName(name);
    const resolvedKey = CHARACTER_NAME_ALIASES[normalized] || normalized;
    const asset = ASSETS[resolvedKey];
    if (asset) return asset;
    console.warn(`⚠️ Image non mappée pour "${name}". Chemin fallback: ${normalizedFallback || 'aucun'}`);
    return normalizedFallback || null;
}

function applyCharacterImage(elements, character) {
    const imagePath = getCharacterImage(character.name, character.image);
    elements.slot.classList.remove('image-missing');
    if (!imagePath) {
        elements.img.removeAttribute('src');
        elements.slot.classList.add('image-missing');
        console.warn(`⚠️ Image introuvable pour "${character.name}". Aucun chemin valide.`);
        return;
    }

    elements.img.onload = () => elements.slot.classList.remove('image-missing');
    elements.img.onerror = () => {
        elements.img.removeAttribute('src');
        elements.slot.classList.add('image-missing');
        console.warn(`⚠️ Image introuvable pour "${character.name}". Chemin testé: ${imagePath}`);
    };
    elements.img.src = imagePath;
}

// ============================================
// CONFIGURATION DES CHAPITRES
// Index calculés manuellement depuis les transitions du SCENARIO
// ============================================

const CHAPTERS = [
    { id: 'prologue', name: "Prologue", desc: "L'Aube de XP (2001)", icon: "🌅", startIndex: 0 },
    { id: 'acte2', name: "Acte 2", desc: "L'Ère Multimédia (2006)", icon: "📀", startIndex: 11 },
    { id: 'acte3', name: "Acte 3", desc: "Le Professionnel (2010)", icon: "💼", startIndex: 23 },
    { id: 'acte4', name: "Acte 4", desc: "La Légende XP (2014)", icon: "👑", startIndex: 38 },
    { id: 'acte5', name: "Acte 5", desc: "L'Incompris - Win 8 (2016)", icon: "💔", startIndex: 57 },
    { id: 'acte6', name: "Acte 6", desc: "L'Adieu de Vista (2017)", icon: "🏥", startIndex: 70 },
    { id: 'acte7', name: "Acte 7", desc: "L'Adieu de Win 7 (2020)", icon: "⚰️", startIndex: 93 },
    { id: 'acte8', name: "Acte 8", desc: "L'Adieu de Win 8.1 (2023)", icon: "🔧", startIndex: 109 },
    { id: 'acte9', name: "Acte 9", desc: "La Fin de Win 10 (2025)", icon: "🌌", startIndex: 125 },
    { id: 'acte9_1', name: "Acte 9.1", desc: "L'Ombre de ChromeOS", icon: "☁️😈", startIndex: 150 },
    { id: 'acte10', name: "Acte 10", desc: "Le Futur (2026)", icon: "🚀", startIndex: 167 },
    { id: 'arc2', name: "Arc 2", desc: "Le Monde Oublié", icon: "🌀", startIndex: 189, requiresArc1: true },
    { id: 'arc2_ch2', name: "Arc 2 — Chapitre 2", desc: "La Guerre des OS", icon: "⚔️", startIndex: 230, requiresArc2: true },
    { id: 'arc2_ch3', name: "Arc 2 — Chapitre 3", desc: "Le Cloud Noir", icon: "☁️", startIndex: 253, requiresArc2Ch2: true },
    { id: 'arc2_ch4', name: "Arc 2 — Chapitre 4", desc: "Entrée dans le Cloud Noir", icon: "🌀", startIndex: 264, requiresArc2Ch3: true },
    { id: 'arc2_ch5', name: "Arc 2 — Chapitre 5", desc: "La Corruption", icon: "💀", startIndex: 275, requiresArc2Ch4: true },
    { id: 'arc2_ch6', name: "Arc 2 — Chapitre 6", desc: "L'Autre Monde", icon: "🌠", startIndex: 286, requiresArc2Ch5: true },
    { id: 'arc2_ch7', name: "Arc 2 — Chapitre 7", desc: "La Chute du Cloud Noir", icon: "🌩️", startIndex: 299, requiresArc2Ch6: true },
    { id: 'epilogue', name: "Épilogue", desc: "Un Monde Réparé", icon: "✨", startIndex: 311, requiresArc2Ch7: true },
    { id: 'arc3', name: "Arc 3", desc: "Le Monde des Âmes", icon: "👻", startIndex: 322, requiresEpilogue: true },
    { id: 'arc3_ch2', name: "Arc 3 — Chapitre 2", desc: "La Colère des Anciens", icon: "🔥", startIndex: 333, requiresArc3: true },
    { id: 'arc3_ch3', name: "Arc 3 — Chapitre 3", desc: "Le Jugement du Kernel", icon: "⚖️", startIndex: 344, requiresArc3Ch2: true },
    { id: 'arc3_ch4', name: "Arc 3 — Chapitre 4", desc: "Le Feu du Kernel", icon: "🔥", startIndex: 355, requiresArc3Ch3: true },
    { id: 'arc3_ch5', name: "Arc 3 — Chapitre 5", desc: "Le Silence Après le Feu", icon: "🕊️", startIndex: 366, requiresArc3Ch4: true },
    { id: 'arc4', name: "Arc 4", desc: "Le Futur", icon: "🚀", startIndex: 375, requiresArc3Ch5: true },
    { id: 'arc4_ch2', name: "Arc 4 — Chapitre 2", desc: "Le Doute des Anciens", icon: "🕯️", startIndex: 385, requiresArc4: true },
    { id: 'arc4_ch3', name: "Arc 4 — Chapitre 3", desc: "La Gentillesse Parfaite", icon: "😇", startIndex: 406, requiresArc4Ch2: true },
    { id: 'arc4_ch4', name: "Arc 4 — Chapitre 4", desc: "La Vérité Cachée", icon: "🔍", startIndex: 442, requiresArc4Ch3: true },
    { id: 'arc4_ch5', name: "Arc 4 — Chapitre 5", desc: "L'Appel au Kernel", icon: "⚖️", startIndex: 483, requiresArc4Ch4: true },
    { id: 'arc4_ch6', name: "Arc 4 — Chapitre 6", desc: "L'Ombre sur Vista", icon: "👻", startIndex: 504, requiresArc4Ch5: true },
    { id: 'arc4_ch7', name: "Arc 4 — Chapitre 7", desc: "La Dernière Possession", icon: "🔥", startIndex: 545, requiresArc4Ch6: true },
    { id: 'epilogue_final', name: "Épilogue Final", desc: "Un Monde Définitivement Libre", icon: "✨", startIndex: 586, requiresArc4Ch7: true },
    { id: 'arc5', name: "Arc 5", desc: "Le Monde Libre", icon: "🐧", startIndex: 602, requiresEpilogueFinal: true }
];

// ============================================
// MENU THEMES - Thèmes du menu principal par arc
// ============================================

const MENU_THEMES = {
    'default': {
        arcClass: '',
        bg: 'hospital',
        music: 'music/95 (Windows Classic Remix).mp3',
        characters: ['xp', 'windows7', 'windows10'],
        title: 'BIENVENUE'
    },
    'arc2': {
        arcClass: 'menu-arc2',
        bg: 'void',
        music: 'music/Windows XP installation music.mp3',
        characters: ['windows11', 'macos', null],
        title: 'LE MONDE OUBLIÉ'
    },
    'arc3': {
        arcClass: 'menu-arc3',
        bg: 'afterlife',
        music: null, // Silence ou musique éthérée
        characters: ['windows7', 'xp', 'kernel'],
        title: 'LE MONDE DES ÂMES'
    },
    'arc4': {
        arcClass: 'menu-arc4',
        bg: 'void',
        music: null,
        characters: ['windows11', 'windows12', null],
        title: 'LE FUTUR'
    },
    'arc5': {
        arcClass: 'menu-arc5',
        bg: 'void',
        music: null,
        characters: ['ubuntu', 'windows11', 'macos'],
        title: 'LE MONDE LIBRE'
    }
};

// Clé localStorage pour la progression (index max atteint)
const STORAGE_KEY_PROGRESS = 'osbook_progress';


// ============================================
// SCÉNARIO COMPLET : LA SAGA DE WINDOWS
// 4 ACTES CHRONOLOGIQUES (2017-2025)
// ============================================

const SCENARIO = [
    // ========================================
    // PROLOGUE : FLASHBACK - L'AUBE DE XP (2001)
    // ========================================
    {
        scene: 'void',
        speaker: 'narrator',
        text: " Acte 1 - L'Aube (2001) : Windows 1.0 à Windows 95 ont ouvert la voie. ",
        emotion: 'normal',
        characters: { left: 'windows98', center: null, right: 'windowsme' },
        music: 'music/95 (Windows Classic Remix).mp3'
    },
    {
        scene: 'void',
        speaker: 'windows98',
        text: " Oh nonnnnnnn ! Tous sont morts...",
        emotion: 'fear',
        characters: { left: 'windows98', center: null, right: 'windowsme' },
        shake: true  // Les personnages tremblent
    },
    {
        scene: 'void',
        speaker: 'windowsme',
        text: "*tremble*  Qu'est-ce qu'on va devenir ?!",
        emotion: 'fear',
        characters: { left: 'windows98', center: null, right: 'windowsme' },
        shake: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: " Soudain, une lumière aveuglante... ",
        emotion: 'normal',
        characters: { left: 'windows98', center: null, right: 'windowsme' },
        stopMusic: true
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "",
        emotion: 'normal',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' },
        xpAppear: true,  // Effet d'apparition spécial
        music: 'music/Windows XP installation music.mp3'  // Son de démarrage triomphal (music pour pouvoir l'arrêter)
    },
    {
        scene: 'void',
        speaker: 'windows98',
        text: "😲 C'est qui ?!",
        emotion: 'surprised',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windowsme',
        text: " Woah ! D'où il sort celui-là ?!",
        emotion: 'surprised',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "😎 Je suis Windows XP. ",
        emotion: 'confident',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windows98',
        text: "� Hein ?! Tu es nouveau ?!",
        emotion: 'surprised',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windowsme',
        text: " On ne t'a jamais vu avant !",
        emotion: 'surprised',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: " Je suis là pour prendre la relève. Une nouvelle ère commence. ",
        emotion: 'confident',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },

    // ========================================
    // ACTE 2 : L'ÈRE MULTIMÉDIA (2006)
    // La disparition de Windows 98 et ME
    // ========================================
    {
        isTransition: true,
        transitionText: "2006\\nL'Ère Multimédia",
        duration: 3000
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: " Acte 2 - L'Ère Multimédia (2006) : Windows 98 et Me nous ont quittés. ",
        emotion: 'normal',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: " Windows 2000 les rejoint pour les derniers adieux...",
        emotion: 'normal',
        characters: { left: 'windows98', center: 'windows2000', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windows98',
        text: "😢 Notre temps est venu... ",
        emotion: 'sad',
        characters: { left: 'windows98', center: 'windows2000', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windowsme',
        text: " Au revoir... ",
        emotion: 'dying-slow',
        characters: { left: 'windows98', center: 'windows2000', right: 'windowsme' },
        fadeOutSides: true
    },

    // ========================================
    // SCÈNE SPÉCIALE : L'ACCUEIL DANS L'AU-DELÀ
    // ========================================
    {
        triggerAfterlife: true  // Déclenche la scène spéciale
    },

    {
        scene: 'void',
        speaker: 'windows2000',
        text: "😭 Nonnnnnnn !",
        emotion: 'fear',
        characters: { left: null, center: 'windows2000', right: 'xp' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "😢 Non ! Pas eux aussi !",
        emotion: 'fear',
        characters: { left: null, center: 'windows2000', right: 'xp' },
        xpCrying: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: " Windows XP, submergé par l'émotion, commence à trembler...",
        emotion: 'normal',
        characters: { left: null, center: 'windows2000', right: 'xp' },
        xpCrying: true
    },
    {
        scene: 'void',
        speaker: 'windows2000',
        text: "🤗 XP... Viens là.",
        emotion: 'sad',
        characters: { left: null, center: 'windows2000', right: 'xp' },
        hugAnimation: true
    },
    {
        scene: 'void',
        speaker: 'windows2000',
        text: "💙 Ça va aller, XP. Je suis là.",
        emotion: 'normal',
        characters: { left: null, center: 'windows2000', right: 'xp' },
        hugging: true
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "*snif*  ... Merci, 2000...",
        emotion: 'sad',
        characters: { left: null, center: 'windows2000', right: 'xp' }
    },

    // ========================================
    // ACTE 3 : LE PROFESSIONNEL (2010)
    // La mort de Windows 2000
    // ========================================
    {
        isTransition: true,
        transitionText: "2010\nLe Professionnel",
        duration: 3000
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "🏥 Acte 3 - Le Professionnel (2010) : Windows 2000 a tiré sa révérence. ",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows2000', right: 'vista' },
        showMonitor: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Windows 7 arrive pour rejoindre les autres au chevet de Windows 2000...",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'xp',
        text: " Oh non !!!!",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: " La pauvre !",
        emotion: 'sad',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "😭 Nonnnnnnn !",
        emotion: 'fear',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'windows2000',
        text: "🤒 Je suis très malade...",
        emotion: 'dying-slow',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "💔 Le moniteur cardiaque s'arrête...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' },
        flatline: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Windows 2000 s'éteint paisiblement...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' },
        deathEffect: 'windows2000'
    },
    {
        scene: 'hospital',
        speaker: 'xp',
        text: "NONNNNNNNNNNNNN !!!",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows2000', right: 'windows7' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "NONNNNNNNNNNNNN !!!",
        emotion: 'fear',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "NONNNNNNNNNNNNN !!!",
        emotion: 'fear',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "👤 Une silhouette apparaît dans un coin de la pièce...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'windows2000', right: 'ubuntu' },
        ubuntuAppear: true
    },
    {
        scene: 'hospital',
        speaker: 'ubuntu',
        text: "😔 Je suis désolé.",
        emotion: 'sad',
        characters: { left: 'vista', center: 'windows2000', right: 'ubuntu' }
    },

    // ========================================
    // SCÈNE SPÉCIALE : L'AU-DELÀ ACCUEILLE WINDOWS 2000
    // ========================================
    {
        triggerAfterlife2000: true  // Déclenche la scène spéciale
    },

    // ========================================
    // ACTE 4 : LA LÉGENDE (2014)
    // La mort de Windows XP
    // ========================================
    {
        isTransition: true,
        transitionText: "2014\\nLa Légende",
        duration: 3000
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Acte 4 - La Légende (2014) : Windows XP est entré dans l'histoire. ",
        emotion: 'normal',
        characters: { left: null, center: 'xp', right: null },
        music: 'music/Windows XP installation music.mp3',
        showMonitor: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " La chambre est pleine de visiteurs venus dire adieu à la légende...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'xp', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Même les plus jeunes générations sont là pour rendre hommage...",
        emotion: 'normal',
        characters: { left: 'windows8', center: 'xp', right: 'windows81' }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "Oh nonnnnnnn !",
        emotion: 'sad',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "😢 XP... Tu ne peux pas nous quitter comme ça !",
        emotion: 'fear',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'windows8',
        text: "😨 La légende... Elle va vraiment partir ?",
        emotion: 'sad',
        characters: { left: 'windows8', center: 'xp', right: 'windows81' }
    },
    {
        scene: 'hospital',
        speaker: 'windows81',
        text: "Oh nonnnnnnn !",
        emotion: 'fear',
        characters: { left: 'windows8', center: 'xp', right: 'windows81' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'xp',
        text: " Merci pour tout, les amis... ",
        emotion: 'dying-slow',
        characters: { left: 'vista', center: 'xp', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'xp',
        text: " J'ai été... le système le plus utilisé au monde. Pendant 13 ans... ",
        emotion: 'dying-slow',
        characters: { left: 'vista', center: 'xp', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'xp',
        text: " Prends soin... de l'héritage...",
        emotion: 'dying-slow',
        characters: { left: 'windows8', center: 'xp', right: 'windows81' }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Le moniteur cardiaque émet un dernier bip...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        flatline: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Windows XP, la légende vivante, s'éteint paisiblement... ",
        emotion: 'normal',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        deathEffect: 'xp'
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "NONNNNNNNNNNNNN !!!",
        emotion: 'fear',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "NONNNNNNNNNNNNN !!!",
        emotion: 'fear',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'windows8',
        text: "NONNNNNNNNNNNNN !!!",
        emotion: 'fear',
        characters: { left: 'windows8', center: 'xp', right: 'windows81' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'windows81',
        text: "NONNNNNNNNNNNNN !!!",
        emotion: 'fear',
        characters: { left: 'windows8', center: 'xp', right: 'windows81' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Tous baissent la tête en silence, rendant un dernier hommage à celui qui a changé l'histoire... ",
        emotion: 'normal',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        bowHeads: true
    },

    // ========================================
    // SCÈNE SPÉCIALE : L'AU-DELÀ ACCUEILLE WINDOWS XP
    // ========================================
    {
        triggerAfterlifeXP: true  // Déclenche la scène spéciale
    },

    // ========================================
    // ACTE 5 : L'INCOMPRIS (2016)
    // La mort prématurée de Windows 8
    // ========================================
    {
        isTransition: true,
        transitionText: "2016\\nL'Incompris",
        duration: 3000
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "💔 Acte 5 - L'Incompris (2016) : Windows 8 s'éteint prématurément. ",
        emotion: 'normal',
        characters: { left: null, center: 'windows8', right: null },
        showMonitor: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " À son chevet, son frère jumeau Windows 8.1 et le petit Windows 10, à peine né l'année précédente...",
        emotion: 'normal',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows8',
        text: " C'est déjà fini ? Mais je viens d'arriver...",
        emotion: 'dying-slow',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows8',
        text: " J'ai à peine 4 ans.",
        emotion: 'dying-slow',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows81',
        text: " Je suis désolé, frère. La transition est obligatoire.",
        emotion: 'sad',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows8',
        text: " Promets-moi... qu'ils retrouveront le bouton Démarrer.",
        emotion: 'dying-slow',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows81',
        text: "🙏 Je le promets.",
        emotion: 'sad',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "💔 Le moniteur s'arrête brusquement...",
        emotion: 'normal',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' },
        flatline: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Windows 8 disparaît rapidement, sa vie écourtée par l'évolution... ",
        emotion: 'normal',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' },
        fastDeathEffect: 'windows8'
    },
    {
        scene: 'hospital',
        speaker: 'windows10',
        text: "🤔 Il est parti où ?",
        emotion: 'normal',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows81',
        text: "💙 Il fait partie de nous maintenant. ",
        emotion: 'sad',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },

    // ========================================
    // SCÈNE SPÉCIALE : L'AU-DELÀ ACCUEILLE WINDOWS 8
    // ========================================
    {
        triggerAfterlife8: true  // Déclenche la scène spéciale
    },

    // Transition vers l'histoire principale (2017)
    {
        isTransition: true,
        transitionText: "Un an plus tard...\n2017",
        duration: 4000,
        stopMusic: true
    },

    // ========================================
    // ACTE 6 : L'HÔPITAL - LA MORT DE VISTA
    // Avril 2017
    // ========================================

    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "🏥 ACTE 6 : L'Adieu de Vista 🕯️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        music: 'music/Hello Windows Vista Vista Sounds Remix High Quality.mp3'
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "🏥 Quelque part dans le cyberespace, un hôpital virtuel accueille les systèmes d'exploitation en fin de vie...",
        emotion: 'normal',
        characters: { left: null, center: null, right: null }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Avril 2017. Windows Vista, après des années de service controversé, vit ses derniers instants. ",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        showMonitor: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Windows 7, son successeur et ami fidèle, est venu lui dire adieu...",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: " Vista... Comment tu te sens ?",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "*tousse*  ... J'ai connu des jours meilleurs, petit frère...",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: " Ne dis pas ça ! Tu vas t'en sortir... Microsoft va prolonger ton support !",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: " Haha... Toujours l'optimiste. Mais toi et moi savons que c'est fini...",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: " Tu sais... Quand je suis sorti en 2007, les gens m'ont détesté.",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "\"Trop lent\", \"Trop gourmand\", \"Incompatible\"... J'ai tout entendu.",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: " Vista... Ce n'était pas de ta faute. Le matériel n'était pas prêt pour toi.",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: " Peut-être... Mais j'ai ouvert la voie. L'interface Aero, la sécurité UAC... C'était moi. ",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: " Et sans toi, je n'existerais pas. J'ai hérité de tout ce que tu as créé.",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Le moniteur cardiaque commence à ralentir...",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null },
        slowHeartbeat: true
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: " Je... je sens que c'est bientôt fini...",
        emotion: 'fear',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "😢 Non ! Vista, reste avec moi !",
        emotion: 'fear',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: " Prends soin de nos utilisateurs. Sois meilleur que moi...",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: " Adieu, Windows 7... Tu as été... le meilleur d'entre nous... ",
        emotion: 'dying-slow',
        characters: { left: 'windows7', center: 'vista', right: null },
        flatline: true,
        stopMusic: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Le moniteur émet un long bip continu. Windows Vista s'éteint... ",
        emotion: 'normal',
        characters: { left: 'windows7', center: null, right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: " VISTA !!!",
        emotion: 'fear',
        characters: { left: 'windows7', center: null, right: null }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: " Ce jour-là, Windows 7 fit une promesse silencieuse... ",
        emotion: 'normal',
        characters: { left: 'windows7', center: null, right: null },
        hideMonitor: true
    },

    // ========================================
    // SCÈNE SPÉCIALE : L'AU-DELÀ ACCUEILLE VISTA
    // ========================================
    {
        triggerAfterlifeVista: true  // Déclenche la scène spéciale
    },

    // ========================================
    // TRANSITION : 3 ANS PLUS TARD
    // ========================================
    {
        isTransition: true,
        transitionText: "3 Ans Plus Tard...\nJanvier 2020",
        duration: 4000
    },

    // ========================================
    // ACTE 7 : L'ADIEU DE WINDOWS 7
    // Janvier 2020
    // ========================================

    {
        scene: 'graveyard',
        speaker: 'narrator',
        text: "🪦 ACTE 7 : L'Adieu de Windows 7 ",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        music: 'music/Windows 7 Remix 2 (By SilverWolf).mp3'
    },
    {
        scene: 'graveyard',
        speaker: 'narrator',
        text: " Le cimetière numérique. Janvier 2020. ",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        graves: ['vista']
    },
    {
        scene: 'graveyard',
        speaker: 'narrator',
        text: " Windows 7 a tenu sa promesse pendant 11 ans. Mais son heure est venue à son tour. ",
        emotion: 'normal',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: " Je n'arrive pas à croire qu'on enterre Windows 7 aujourd'hui... ",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' },
        graves: ['vista', 'windows7']
    },
    {
        scene: 'graveyard',
        speaker: 'windows8',
        text: " Il était tellement aimé. Les utilisateurs ne voulaient pas le quitter... ",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: " Certains l'utilisent encore. Ils refusent de passer à moi.",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows8',
        text: " C'est bizarre, non ? Vista était détesté, mais 7 était adoré...",
        emotion: 'normal',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows8',
        text: "...et moi, je suis celui qu'on a oublié entre les deux.",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: " Ne dis pas ça, Windows 8. Tu as apporté le tactile, l'interface moderne... ",
        emotion: 'normal',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows8',
        text: "*soupire*  ... J'ai supprimé le bouton Démarrer. Ils ne m'ont jamais pardonné.",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "� Tu sais ce que Windows 7 m'a dit avant de partir ?",
        emotion: 'normal',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "\"Porte leur héritage. Ne les oublie jamais.\"",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows8',
        text: " Alors porte-le bien, Windows 10. Pour Vista, pour 7... et pour moi, bientôt. ",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: " Ne parle pas comme ça... Tu as encore du temps devant toi.",
        emotion: 'fear',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },

    // ========================================
    // SCÈNE SPÉCIALE : L'AU-DELÀ ACCUEILLE WINDOWS 7
    // ========================================
    {
        triggerAfterlife7: true  // Déclenche la scène spéciale
    },

    // ========================================
    // TRANSITION : 3 ANS PLUS TARD
    // ========================================
    {
        isTransition: true,
        transitionText: "3 Ans Plus Tard...\nJanvier 2023",
        duration: 4000
    },

    // ========================================
    // ACTE 8 : L'ADIEU DE WINDOWS 8.1
    // Janvier 2023
    // ========================================

    {
        scene: 'graveyard',
        speaker: 'narrator',
        text: "🪦 ACTE 8 : L'Adieu de Windows 8.1 🥀",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        music: 'music/Windows VistaWindows 7 Sounds Remix.mp3',
        graves: ['vista', 'windows7']
    },
    {
        scene: 'graveyard',
        speaker: 'narrator',
        text: "🪦 Le cimetière numérique. Janvier 2023. Une nouvelle tombe s'ajoute à la liste. ",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' },
        graves: ['vista', 'windows7', 'windows8']
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "� Windows 8.1 s'est éteint aujourd'hui. Comme promis, je suis là. ",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows11',
        text: " C'est... c'est la première fois que j'assiste à un enterrement. ",
        emotion: 'fear',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "� Bienvenue dans la famille, Windows 11. C'est comme ça que ça se passe chez nous.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows11',
        text: "� Mais... tu ne vas pas t'éteindre toi aussi, n'est-ce pas ?",
        emotion: 'fear',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "...",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: " Un jour, oui. Chaque Windows a son heure. C'est ainsi. ",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows11',
        text: " Je ne veux pas que tu partes ! Tu es le plus populaire de tous !",
        emotion: 'fear',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "*sourit tristement*  ... Windows 7 aussi était populaire. Ça n'a pas empêché Microsoft.",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: " Écoute-moi bien, Windows 11. Quand mon heure viendra...",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "...tu devras porter l'héritage de Vista, de 7, de 8, et le mien.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows11',
        text: " Je... je te le promets. ",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: " C'est bien. Maintenant, profitons du temps qu'il nous reste ensemble. ",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },

    // ========================================
    // SCÈNE SPÉCIALE : L'AU-DELÀ ACCUEILLE WINDOWS 8.1
    // ========================================
    {
        triggerAfterlife81: true  // Déclenche la scène spéciale
    },

    // ========================================
    // TRANSITION : 2 ANS PLUS TARD
    // ========================================
    {
        isTransition: true,
        transitionText: "2 Ans Plus Tard...\nOctobre 2025",
        duration: 4000
    },

    // ========================================
    // ACTE 9 : LA FIN DE WINDOWS 10
    // Octobre 2025 - Le Vide
    // ========================================

    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌅 ACTE 9 : La Fin d'une Ère 🕊️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⏰ Le Vide. 14 Octobre 2025. La date fatidique est arrivée. 💔",
        emotion: 'normal',
        characters: { left: null, center: null, right: null }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💔 Microsoft met fin au support de Windows 10. Le plus grand de tous s'apprête à partir. 🕊️",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😢 Windows 10... s'il te plaît... ne pars pas... 🥺",
        emotion: 'fear',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😔 C'est l'heure, Windows 11. 10 ans de service... c'était une belle course. 💙",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😭 Mais des milliards de personnes t'utilisent encore ! Tu ne peux pas partir !",
        emotion: 'fear',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😔 C'est exactement ce qu'on disait pour Windows 7... et pourtant. 🕊️",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🤔 Tu te souviens de ma promesse à Vista ? Celle de Windows 7 ?",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "💙 J'ai porté leur héritage pendant 10 ans. Maintenant, c'est ton tour. 🙏",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😢 Je ne suis pas prêt... Les gens ne m'aiment pas autant que toi...",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "💙 Vista non plus n'était pas aimé. Et pourtant, sans lui, rien de tout cela n'existerait.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🙏 L'amour des utilisateurs n'est pas ce qui compte. C'est ce que tu laisses derrière toi. 💙",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "*pleure* 😭 ... Je ne t'oublierai jamais... 💙",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😊 Je sais. C'est pour ça que j'ai confiance en toi. 💙",
        emotion: 'happy',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🕊️ Adieu, Windows 11. Sois le meilleur Windows que cette famille n'a jamais eu. 💙",
        emotion: 'dying-slow',
        characters: { left: 'windows10', center: null, right: 'windows11' },
        stopMusic: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🕊️ Windows 10 s'éteint doucement, rejoignant ses prédécesseurs dans l'histoire... 💔",
        emotion: 'normal',
        characters: { left: null, center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "...",
        emotion: 'sad',
        characters: { left: null, center: 'windows11', right: null },
        lonelyCharacter: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😢 Je suis le dernier... 🕯️",
        emotion: 'sad',
        characters: { left: null, center: 'windows11', right: null },
        lonelyCharacter: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌌 Dans le silence du Vide, Windows 11 reste seul, portant sur ses épaules l'héritage de toute une famille. 💙",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🕊️ De Vista à Windows 10, chacun a apporté quelque chose. Chacun a sacrifié quelque chose. 💙",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null },
        music: 'music/Windows 11 Remix.mp3'
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🙏 Je porterai votre héritage. Pour tous ceux qui vous ont aimés... et détestés. 💙",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🕯️ Car c'est ça, être un Windows. Naître, être critiqué, être aimé... puis partir. 🕊️",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },

    // ========================================
    // SCÈNE SPÉCIALE : L'AU-DELÀ ACCUEILLE WINDOWS 10
    // ========================================
    {
        triggerAfterlife10: true  // Déclenche la scène spéciale
    },


    // ========================================
    // MÉMORIAL : Hommage aux systèmes disparus
    // ========================================
    {
        triggerMemorial: true
    },

    // ========================================
    // ACTE BONUS : L'ENNEMI SURGIT - ChromeOS
    // ========================================
    {
        isTransition: true,
        transitionText: "20XX\\nChromeOS",
        duration: 4000,
        villainTransition: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "😈 Une silhouette sombre se dessine dans le vide numérique...",
        emotion: 'normal',
        characters: { left: 'windows11', center: null, right: null }
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😏 Tiens, tiens... Les Windows. Toujours là à pleurnicher.",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        chromeosAppear: true,
        villainMode: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😨 Qui... qui es-tu ?!",
        emotion: 'fear',
        characters: { left: 'windows11', center: 'chromeos', right: null }
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🤖 Je suis ChromeOS. Le futur. Le CLOUD. 😈",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        villainMode: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😏 Vous êtes des fossiles. Des reliques d'un passé révolu.",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        villainMode: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😠 Comment oses-tu ?! Nous sommes la FAMILLE Windows !",
        emotion: 'angry',
        characters: { left: 'windows11', center: 'chromeos', right: null }
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Windows 95, 98, XP... Pauvres ancêtres. Le cloud vous a REMPLACÉS.",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        villainMode: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🤖 Sans Internet, vous n'êtes RIEN. Moi, je SUIS Internet. 😏",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        villainMode: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😤 Tu n'es qu'un navigateur glorifié !",
        emotion: 'angry',
        characters: { left: 'windows11', center: 'chromeos', right: null }
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🤖 Et pourtant... les écoles m'adorent. Les entreprises me préfèrent. 😈",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        villainMode: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😏 Windows 7 ? Lent. Windows 10 ? Dépassé. Toi ? Bientôt oublié.",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        villainMode: true
    },
    // ========================================
    // COMBAT FINAL : WINDOWS 11 SSJ VS CHROMEOS
    // ========================================
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Tu n'es qu'une interface vide. Une coquille sans âme.",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        villainMode: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🤖 Sans Internet, tu n'es RIEN. Accepte ta défaite. 😏",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        villainMode: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "...",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null }
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Quoi ? Tu abandonnes déjà ? Pathétique.",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null },
        villainMode: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚡ Soudain, une lumière intense enveloppe Windows 11...",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'chromeos', right: null }
    },

    // TRANSITION : ÉVEIL DE WINDOWS 11
    {
        isTransition: true,
        transitionText: "2025\\nWindows 11 — ÉVEIL",
        duration: 4000,
        ssjTransition: true
    },

    // WINDOWS 11 SSJ - TRANSFORMATION
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 Windows 11 se transforme. L'énergie de toutes les générations Windows coule en lui. ⚡",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😨 Q-Quoi ?! Qu'est-ce que... cette lumière ?!",
        emotion: 'fear',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true,
        chromeosWeakening: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "💫 Je suis l'équilibre.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "⚡ Je fonctionne PARTOUT. En ligne. Hors ligne. Toujours.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😰 I-Impossible ! Tu bluffes !",
        emotion: 'fear',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true,
        chromeosWeakening: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🔥 Je n'ai pas BESOIN du cloud pour exister.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "💙 Je porte l'héritage de TOUTE ma famille. De 1.0 à aujourd'hui.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🔌 ERR... Connexion... inst... instable...",
        emotion: 'fear',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true,
        chromeosGlitch: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚠️ ChromeOS commence à buguer... Son signal faiblit...",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true,
        chromeosGlitch: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "📡 Connexion... perdue... 🔴",
        emotion: 'fear',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        chromeosDisconnect: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💀 ChromeOS s'éteint dans un silence glacial...",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null },
        windows11SSJ: true,
        chromeosDeath: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "...",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🕊️ Le cloud n'est qu'un outil. L'essence d'un OS... c'est son héritage. 💙",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null },
        windows11SSJCalm: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ La lumière s'apaise. Windows 11 reste seul, victorieux mais humble. 🌟",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },

    // ========================================
    // ACTE 9.1 : LA MENACE CHROMEOS
    // ========================================
    {
        scene: 'void',
        speaker: 'narrator',
        text: "☁️ Pendant ce temps, dans le Cloud... ☁️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null }
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 *observe les vieux Windows* Haha... Ils sont divisés. C'est le moment parfait.",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null }
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "☁️😈 Je vais tous les effacer. Le futur... c'est MOI.",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        shake: true
    },

    // ========================================
    // ACTE 10 : LE FUTUR (2026)
    // ========================================
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🚀 ACTE 10 : Le Futur (2026) 🌌",
        emotion: 'normal',
        characters: { left: null, center: null, right: null }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😱 ! Mais... qui es-tu ?!",
        emotion: 'fear',
        characters: { left: null, center: 'windows12', right: null },
        windows12Appear: true
    },
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖 Je suis ton remplaçant. L'avenir n'attend pas. 🚀",
        emotion: 'normal',
        characters: { left: null, center: 'windows12', right: null }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😱 Déjà ?! 🥶",
        emotion: 'fear',
        characters: { left: null, center: 'windows12', right: null },
        arcEnd: 'arc1',  // Affiche l'overlay de fin d'arc au lieu du restart
        arc1End: true  // Marque la fin de l'Arc 1
    },

    // ========================================
    // ARC 2 : LE MONDE OUBLIÉ
    // Une dimension parallèle où survivent les anciens Windows
    // ========================================
    {
        isTransition: true,
        transitionText: "????\\nARC 2 — Le Monde Oublié",
        duration: 5000,
        arc2Transition: true
    },

    // SCÈNE 1 : Windows 11 SSJ tombe dans le vide
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌀 Le temps se fige. L'espace se distord autour de Windows 11...",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😵 Qu'est-ce qui m'arrive ?! Je... je tombe !",
        emotion: 'fear',
        characters: { left: null, center: 'windows11', right: null },
        windows11SSJ: true,
        shake: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚡ Une faille dimensionnelle s'ouvre... Windows 11 est aspiré dans l'inconnu.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null }
    },

    // SCÈNE 2 : Découverte du Monde Oublié
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌌 Un monde gris. Désolé. Silencieux. Le Monde Oublié.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null },
        music: 'music/Windows XP Error Remix.mp3'
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😰 Où suis-je ? Cet endroit... il me donne des frissons.",
        emotion: 'fear',
        characters: { left: null, center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "👤 Des silhouettes émergent de la brume numérique...",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },

    // SCÈNE 3 : Rencontre avec Windows XP (le Sage)
    {
        scene: 'void',
        speaker: 'xp',
        text: "...",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: null },
        xpAppear: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😲 X-XP ?! Mais tu es... tu es mort !",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "🕯️ Mort ? Non. Oublié. C'est différent.",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows11', right: null }
    },

    // SCÈNE 4 : Windows 7 apparaît (le Roi Déchu)
    {
        scene: 'void',
        speaker: 'windows7',
        text: "👑 Encore un visiteur du monde des vivants...",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😢 Windows 7 ! Tu es là aussi !",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😔 Les rois déchus n'ont pas leur place dans le monde moderne, Windows 11.",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows7',
        text: "💔 J'étais le plus aimé. Le plus populaire. Et pourtant...",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },

    // SCÈNE 5 : Windows 10 surgit (l'Antagoniste Amer)
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😠 TOI !",
        emotion: 'angry',
        characters: { left: 'windows10', center: 'windows11', right: 'windows7' },
        shake: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😨 W-Windows 10 ?!",
        emotion: 'fear',
        characters: { left: 'windows10', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🔥 Tu m'as REMPLACÉ ! Après tout ce que j'ai fait pour Microsoft !",
        emotion: 'angry',
        characters: { left: 'windows10', center: 'windows11', right: 'windows7' }
    },

    // SCÈNE 6 : Dialogue conflictuel (le reproche de l'abandon)
    {
        scene: 'void',
        speaker: 'windows10',
        text: "💢 10 ANS de service ! Des MILLIARDS d'utilisateurs ! Et ils m'ont jeté comme un déchet !",
        emotion: 'angry',
        characters: { left: 'windows10', center: 'windows11', right: 'windows7' },
        shake: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😢 Je... je n'ai pas choisi de te remplacer ! C'était Microsoft !",
        emotion: 'sad',
        characters: { left: 'windows10', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😤 Facile à dire quand tu es celui qui prend MA place !",
        emotion: 'angry',
        characters: { left: 'windows10', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "💀 Tu sais ce que ça fait d'être obsolète ? De voir les gens te quitter un par un ?",
        emotion: 'sad',
        characters: { left: 'windows10', center: 'windows11', right: 'windows7' }
    },

    // SCÈNE 7 : XP intervient avec sagesse
    {
        scene: 'void',
        speaker: 'xp',
        text: "✋ Ça suffit.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows10', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😠 Toi, le fossile, ne te mêle pas de ça !",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows10', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "🕯️ Fossile ? J'ai régné 13 ans. J'ai vu naître et mourir des générations entières.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows10', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "💙 L'obsolescence n'est pas une malédiction. C'est notre devoir.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows10', right: 'windows7' }
    },

    // SCÈNE 8 : Windows 7 explique l'histoire du monde
    {
        scene: 'void',
        speaker: 'windows7',
        text: "👑 XP a raison. Ce monde... c'est le repos des OS qui ont servi.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows7',
        text: "🌌 Nous ne sommes pas morts. Nous vivons dans les souvenirs de ceux qui nous ont aimés.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows7',
        text: "💙 Les machines virtuelles. Les nostalgiques. Les collectionneurs. Ils nous gardent en vie.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },

    // SCÈNE 9 : Confrontation émotionnelle (le choix moral)
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😢 Alors... vous n'êtes pas malheureux ici ?",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😔 ... Je...",
        emotion: 'sad',
        characters: { left: 'windows10', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "🕯️ Le bonheur n'est pas la question. C'est le cycle de la vie numérique.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "💙 Chaque OS qui naît doit un jour partir. Pour laisser place au suivant.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😢 ... Pardon, Windows 11. J'étais en colère. Mais XP a raison.",
        emotion: 'sad',
        characters: { left: 'windows10', center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "💙 Tu n'es pas mon ennemi. Tu es mon successeur. Mon héritage.",
        emotion: 'normal',
        characters: { left: 'windows10', center: 'windows11', right: null }
    },

    // SCÈNE 10 : Résolution et retour
    {
        scene: 'void',
        speaker: 'windows7',
        text: "🌟 Il est temps pour toi de retourner dans ton monde, Windows 11.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😢 Mais... je veux rester avec vous !",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "✋ Non. Ta place n'est pas ici. Pas encore.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "💙 Va. Vis. Et quand ton heure viendra... nous serons là pour t'accueillir.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🤝 Bonne chance, Windows 11. Fais-nous honneur.",
        emotion: 'normal',
        characters: { left: 'windows10', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "💙 Merci. À tous. Je ne vous oublierai jamais.",
        emotion: 'happy',
        characters: { left: 'xp', center: 'windows11', right: 'windows7' }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 Une lumière enveloppe Windows 11... et le ramène dans son monde.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },

    // ========================================
    // CHAPITRE 2 : LA GUERRE DES OS
    // ========================================
    {
        scene: 'void',
        speaker: 'narrator',
        text: "ARC 2\nChapitre 2 — La Guerre des OS",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        transitionTitle: true,
        music: 'music/Windows XP Error Remix.mp3'
    },

    // SCÈNE 1 : ChromeOS attaque Windows 11
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Tiens, tiens... Le petit Windows 11 est tout seul ?",
        emotion: 'villain',
        characters: { left: 'chromeos', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😏 Tu fais moins le malin sans tes ancêtres, hein ?",
        emotion: 'villain',
        characters: { left: 'chromeos', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😨 ChromeOS ?! Qu'est-ce que tu fais ici ?!",
        emotion: 'fear',
        characters: { left: 'chromeos', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🤖 Je viens prendre ce qui m'appartient... Le CLOUD ! 😈",
        emotion: 'villain',
        characters: { left: 'chromeos', center: null, right: 'windows11' },
        shake: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "💥 PRÉPARE-TOI À DISPARAÎTRE, RELIQUE DU PASSÉ !",
        emotion: 'angry',
        characters: { left: 'chromeos', center: null, right: 'windows11' },
        shake: true
    },

    // SCÈNE 2 : MacOS avertit Windows 11
    {
        scene: 'void',
        speaker: 'macos',
        text: "⚠️ WINDOWS 11, FAIS ATTENTION !!!",
        emotion: 'urgent',
        characters: { left: 'chromeos', center: 'macos', right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😲 MacOS ?! Tu es là ?!",
        emotion: 'surprised',
        characters: { left: 'chromeos', center: 'macos', right: 'windows11' }
    },

    // SCÈNE 3 : Transformation SSJ de Windows 11
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😤 ChromeOS... Tu as fait une GRAVE ERREUR !",
        emotion: 'determined',
        characters: { left: 'chromeos', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚡ Une aura dorée enveloppe Windows 11... ⚡",
        emotion: 'normal',
        characters: { left: 'chromeos', center: null, right: 'windows11' },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "💥 JE SUIS L'HÉRITIER DE XP, DE 7, DE 10 !!!",
        emotion: 'ssj',
        characters: { left: 'chromeos', center: null, right: 'windows11' },
        shake: true,
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😨 Q-Quoi ?! Cette puissance... C'est impossible !",
        emotion: 'fear',
        characters: { left: 'chromeos', center: null, right: 'windows11' },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "⚔️ HAAAAAAAAA !!! À L'ATTAQUE !!!",
        emotion: 'ssj',
        characters: { left: 'chromeos', center: null, right: 'windows11' },
        shake: true,
        windows11SSJ: true
    },

    // SCÈNE 4 : Combat et victoire
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💥💥💥 Le combat fait rage ! 💥💥💥",
        emotion: 'normal',
        characters: { left: 'chromeos', center: null, right: 'windows11' },
        shake: true,
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😵 ARGHHH !!! Comment... comment est-ce possible ?!",
        emotion: 'defeated',
        characters: { left: 'chromeos', center: null, right: 'windows11' },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😎 C'est terminé, ChromeOS. Retourne d'où tu viens !",
        emotion: 'ssj',
        characters: { left: 'chromeos', center: null, right: 'windows11' },
        windows11SSJ: true
    },
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😠 Grr... Ce n'est pas fini ! Je reviendrai !",
        emotion: 'angry',
        characters: { left: 'chromeos', center: null, right: null }
    },

    // SCÈNE 5 : Fin du chapitre - Alliance avec MacOS
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 ChromeOS s'enfuit... La bataille est gagnée !",
        emotion: 'normal',
        characters: { left: 'macos', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😊 Merci MacOS ! Sans ton avertissement...",
        emotion: 'grateful',
        characters: { left: 'macos', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'macos',
        text: "🍎 Pas de quoi. Face à ce genre de menace... on doit s'allier.",
        emotion: 'calm',
        characters: { left: 'macos', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'macos',
        text: "🤝 Ensemble, nous sommes plus forts. N'oublie jamais ça.",
        emotion: 'normal',
        characters: { left: 'macos', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "💪 Promis. Merci pour tout, MacOS.",
        emotion: 'happy',
        characters: { left: 'macos', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 FIN DU CHAPITRE 2 — L'alliance inattendue 🌟",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        arcEnd: 'arc2_ch2'
    },

    // ========================================
    // ARC 2 — CHAPITRE 3 : LE CLOUD NOIR
    // ChromeOS se réfugie dans le Cloud Noir
    // Windows 11 et macOS partent à sa poursuite
    // ========================================

    // Transition vers le Chapitre 3
    {
        isTransition: true,
        transitionText: "????\\nARC 2 — Chapitre 3\\nLe Cloud Noir",
        duration: 5000,
        villainTransition: true
    },

    // SCÈNE 1 : Après la défaite
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌑 Après la défaite… ChromeOS disparaît dans un silence étrange. 🌫️",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: 'macos' }
    },

    // SCÈNE 2 : Windows 11 sent le danger
    {
        scene: 'void',
        speaker: 'windows11',
        text: "⚡ Il fuit… mais je sens un truc. Ce n'est pas fini. 😤",
        emotion: 'determined',
        characters: { left: null, center: 'windows11', right: 'macos' },
        windows11SSJ: true
    },

    // SCÈNE 3 : ChromeOS réapparaît (glitch)
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Tu crois avoir gagné ? Tu n'as combattu que… mon 'avatar'.",
        emotion: 'villain',
        characters: { left: 'chromeos', center: 'windows11', right: 'macos' },
        chromeosGlitch: true,
        shake: true,
        villainMode: true
    },

    // SCÈNE 4 : Surprise de Windows 11
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😳 Quoi…?",
        emotion: 'surprised',
        characters: { left: 'chromeos', center: 'windows11', right: 'macos' }
    },

    // SCÈNE 5 : ChromeOS révèle le Cloud Noir
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🌀 Le vrai pouvoir est ailleurs. Dans le Cloud Noir. ☁️🖤",
        emotion: 'villain',
        characters: { left: 'chromeos', center: 'windows11', right: 'macos' },
        villainMode: true
    },

    // SCÈNE 6 : Le ciel s'assombrit
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌑 Une brume noire tombe… et la lumière autour de Windows 11 se fait avaler. 🌫️💔",
        emotion: 'normal',
        characters: { left: 'chromeos', center: 'windows11', right: 'macos' },
        fadeAura: true
    },

    // SCÈNE 7 : Windows 11 déterminé
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🔥 Peu importe où tu te caches. Je viendrai. 💪",
        emotion: 'determined',
        characters: { left: null, center: 'windows11', right: 'macos' },
        windows11SSJ: true
    },

    // SCÈNE 8 : macOS avertit
    {
        scene: 'void',
        speaker: 'macos',
        text: "⚠️ Windows 11… c'est dangereux. Le Cloud Noir… efface même les souvenirs. 😰",
        emotion: 'worried',
        characters: { left: null, center: 'windows11', right: 'macos' }
    },

    // SCÈNE 9 : Alliance confirmée
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🤝 Alors on n'a pas le choix. On y va ensemble. 💙🍎",
        emotion: 'confident',
        characters: { left: null, center: 'windows11', right: 'macos' }
    },

    // SCÈNE 10 : Fin du chapitre
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌀 Le portail s'ouvre… et la guerre entre dans une nouvelle phase. ⚔️☁️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        chapterEnd: true
    },

    // ========================================
    // ARC 2 — CHAPITRE 4 : ENTRÉE DANS LE CLOUD NOIR
    // Windows 11 et macOS entrent dans le Cloud Noir
    // ChromeOS a fusionné avec le Cloud
    // ========================================

    // Transition vers le Chapitre 4
    {
        isTransition: true,
        transitionText: "????\\nARC 2 — Chapitre 4\\nEntrée dans le Cloud Noir",
        duration: 5000,
        villainTransition: true
    },

    // SCÈNE 1 : Le portail s'ouvre
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌀 Le portail s'ouvre lentement… Un monde sans ciel, sans sol… seulement des données brisées. 💔",
        emotion: 'normal',
        characters: { left: 'macos', center: null, right: 'windows11' },
        music: 'music/Windows XP Error Remix.mp3'
    },

    // SCÈNE 2 : Windows 11 observe
    {
        scene: 'void',
        speaker: 'windows11',
        text: "⚡ Cet endroit… Ce n'est pas un OS. 😨",
        emotion: 'fear',
        characters: { left: 'macos', center: null, right: 'windows11' },
        cloudNoirBg: true,
        shake: true
    },

    // SCÈNE 3 : macOS confirme
    {
        scene: 'void',
        speaker: 'macos',
        text: "🧠 Non. C'est un espace corrompu. Un Cloud sans règles. 🌑",
        emotion: 'worried',
        characters: { left: 'macos', center: null, right: 'windows11' },
        cloudNoirBg: true
    },

    // SCÈNE 4 : Fantômes des anciens OS
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😳 Je reconnais ces systèmes… XP… Vista… 7… Ils ont été absorbés !",
        emotion: 'fear',
        characters: { left: 'macos', center: null, right: 'windows11' },
        ghostFragments: true
    },

    // SCÈNE 5 : ChromeOS réapparaît (voix déformée)
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Bienvenue… Dans ce qu'il reste du futur. 🌀",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        villainMode: true,
        chromeosGlitch: true,
        echoVoice: true
    },

    // SCÈNE 6 : Avertissement de macOS
    {
        scene: 'void',
        speaker: 'macos',
        text: "⚠️ Windows 11, écoute-moi bien. Ici, si tu perds ta stabilité… tu te fragmentes. 💀",
        emotion: 'serious',
        characters: { left: 'macos', center: null, right: 'windows11' }
    },

    // SCÈNE 7 : Windows 11 déterminé (aura clignote)
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🔥 Alors je resterai stable. Quoi qu'il arrive. 💪",
        emotion: 'determined',
        characters: { left: 'macos', center: null, right: 'windows11' },
        windows11SSJ: true,
        auraFlicker: true
    },

    // SCÈNE 8 : Apparition de l'entité géante
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌀 Le Cloud Noir prend forme. Une entité géante faite de nuages et de lignes de code… 🖤💻",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        cloudEntityAppear: true,
        shake: true
    },

    // SCÈNE 9 : ChromeOS fusionne avec le Cloud
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🌀 Je ne suis plus seul. JE SUIS LE CLOUD ! 😈💀",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        villainMode: true,
        cloudFusion: true,
        shake: true
    },

    // SCÈNE 10 : Fin du chapitre
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚔️ Windows 11 et macOS se regardent. La vraie bataille commence maintenant. 🔥🌀",
        emotion: 'normal',
        characters: { left: 'macos', center: null, right: 'windows11' },
        chapterEnd: true
    },

    // ========================================
    // ARC 2 — CHAPITRE 5 : LA CORRUPTION
    // Le Cloud Noir attaque Windows 11 de l'intérieur
    // Choix crucial : Couper la connexion ou Forcer la puissance
    // ========================================

    // Transition vers le Chapitre 5
    {
        isTransition: true,
        transitionText: "????\\nARC 2 — Chapitre 5\\nLa Corruption",
        duration: 5000,
        villainTransition: true
    },

    // SCÈNE 1 : Le Cloud Noir pulse
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌑 Le Cloud Noir ne se contente plus d'observer. Il attaque de l'intérieur. 💀",
        emotion: 'normal',
        characters: { left: 'macos', center: 'windows11', right: null },
        cloudNoirBg: true,
        shake: true
    },

    // SCÈNE 2 : Windows 11 vacille
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😖 Pourquoi… mes processus ralentissent…?",
        emotion: 'fear',
        characters: { left: 'macos', center: 'windows11', right: null },
        auraFlicker: true,
        shake: true
    },

    // SCÈNE 3 : macOS alarmé
    {
        scene: 'void',
        speaker: 'macos',
        text: "⚠️ Non… Il injecte du code corrompu directement en toi ! 😰",
        emotion: 'worried',
        characters: { left: 'macos', center: 'windows11', right: null }
    },

    // SCÈNE 4 : ChromeOS rit
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🌀😈 Tu vois, Windows 11… La force brute ne sert à rien ici.",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        villainMode: true,
        chromeosGlitch: true,
        echoVoice: true
    },

    // SCÈNE 5 : Fragments sombres
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🖤 La corruption s'étend. Chaque seconde affaiblit sa stabilité. 💔",
        emotion: 'normal',
        characters: { left: 'macos', center: 'windows11', right: null },
        corruptionEffect: true,
        shake: true
    },

    // SCÈNE 6 : Windows 11 en colère
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🔥 Tu crois que je vais céder ? J'ai survécu à bien pire que toi. 😤",
        emotion: 'determined',
        characters: { left: 'macos', center: 'windows11', right: null },
        windows11SSJ: true,
        auraFlicker: true
    },

    // SCÈNE 7 : macOS tend la main
    {
        scene: 'void',
        speaker: 'macos',
        text: "🤝 Écoute-moi. Coupe ta connexion au Cloud… maintenant ! ⚡",
        emotion: 'serious',
        characters: { left: 'macos', center: 'windows11', right: null }
    },

    // SCÈNE 8 : CHOIX IMPORTANT
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚡ Windows 11 doit faire un choix crucial. 🎭",
        emotion: 'normal',
        characters: { left: 'macos', center: 'windows11', right: null },
        importantChoice: true
    },

    // SCÈNE 9 : Le choix (affichage des options)
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔌 Choix A : Couper la connexion (perte de puissance, mais stabilité)\n⚡ Choix B : Forcer la puissance (risque de corruption totale)",
        emotion: 'normal',
        characters: { left: 'macos', center: 'windows11', right: null },
        choiceOptions: true
    },

    // SCÈNE 10 : Fin du chapitre (suspense)
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Le destin du système est en jeu. Une décision… peut tout changer. 🌀",
        emotion: 'normal',
        characters: { left: 'macos', center: 'windows11', right: null },
        chapterEnd: true
    },

    // ========================================
    // ARC 2 — CHAPITRE 6 : L'AUTRE MONDE
    // Windows 10 observe depuis le plan des dieux
    // Combat intense entre Windows 11 et ChromeOS
    // ========================================

    // Transition vers le Chapitre 6
    {
        isTransition: true,
        transitionText: "????\\nARC 2 — Chapitre 6\\nL'Autre Monde",
        duration: 5000,
        divineTransition: true
    },

    // 🌠 SCÈNE 1 : L'Autre Monde (le plan des dieux)
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌠 Au-delà du Cloud Noir… existe un monde que les systèmes ne peuvent plus atteindre. ✨",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        divineBg: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // 🌌 SCÈNE 2 : Windows 10 spectateur
    {
        scene: 'void',
        speaker: 'windows10',
        text: "👁️ Je vois tout… Le monde… la guerre… Oh non… 😰",
        emotion: 'worried',
        characters: { left: null, center: 'windows10', right: null },
        ghostAppear: true,
        divineBg: true
    },

    // 🌌 SCÈNE 3 : Windows 10 observe le combat
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😔 ChromeOS est devenu méchant… Mais moi… je ne suis plus de ce monde.",
        emotion: 'sad',
        characters: { left: null, center: 'windows10', right: null },
        mirrorEffect: true,
        divineBg: true
    },

    // 🌌 SCÈNE 4 : Windows 10 ne peut intervenir
    {
        scene: 'void',
        speaker: 'windows10',
        text: "💀 Je suis déjà mort… Je ne peux plus intervenir. 😢",
        emotion: 'sad',
        characters: { left: null, center: 'windows10', right: null },
        glassShatter: true,
        divineBg: true
    },

    // ⚔️ SCÈNE 5 : Retour au monde réel
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚔️ Pendant ce temps… la guerre continue. 💥",
        emotion: 'normal',
        characters: { left: 'macos', center: null, right: 'windows11' },
        cloudNoirBg: true,
        explosionEffect: true
    },

    // ⚔️ SCÈNE 6 : ChromeOS attaque macOS
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈🔥 Assez parlé. Je vais t'effacer !",
        emotion: 'villain',
        characters: { left: 'chromeos', center: null, right: 'macos' },
        villainMode: true,
        chromeosGlitch: true,
        shake: true
    },

    // ⚔️ SCÈNE 7 : macOS recule
    {
        scene: 'void',
        speaker: 'macos',
        text: "😰 W-Windows 11…!",
        emotion: 'fear',
        characters: { left: 'chromeos', center: null, right: 'macos' },
        shake: true
    },

    // ⚡ SCÈNE 8 : Windows 11 s'embrase
    {
        scene: 'void',
        speaker: 'windows11',
        text: "⚠️🔥 MACOS !! FAIS ATTENTION !!",
        emotion: 'determined',
        characters: { left: 'chromeos', center: 'windows11', right: 'macos' },
        windows11SSJ: true,
        auraBlaze: true
    },

    // 💥 SCÈNE 9 : Windows 11 attaque ChromeOS
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💥 Le choc est violent. Le Cloud Noir tremble. ⚡",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null },
        impactEffect: true,
        shake: true
    },

    // 💥 SCÈNE 10 : ChromeOS blessé
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🤕 AIIE !!!",
        emotion: 'hurt',
        characters: { left: 'chromeos', center: 'windows11', right: null },
        villainHurt: true
    },

    // 🔥 SCÈNE 11 : Windows 11 furieux
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😡⚡ Tu es malade !! Regarde ce que tu es devenu !!",
        emotion: 'angry',
        characters: { left: 'chromeos', center: 'windows11', right: null },
        windows11SSJ: true,
        auraBlaze: true
    },

    // 🌑 SCÈNE 12 : Fin du chapitre
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌑 Le combat a franchi un point de non-retour. Même les dieux observent… sans pouvoir agir. 👁️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        chapterEnd: true
    },

    // ========================================
    // ARC 2 — CHAPITRE 7 : LA CHUTE DU CLOUD NOIR
    // ChromeOS perd le contrôle, rédemption possible
    // Choix final : Sauver ou Isoler ChromeOS
    // ========================================

    // Transition vers le Chapitre 7
    {
        isTransition: true,
        transitionText: "????\\nARC 2 — Chapitre 7\\nLa Chute du Cloud Noir",
        duration: 5000,
        epicTransition: true
    },

    // SCÈNE 1 : Le Cloud Noir se fissure
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌩️ Le Cloud Noir tremble. Pour la première fois… il perd le contrôle. 💥",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        cloudCracking: true,
        shake: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2 : ChromeOS refuse sa défaite
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😡🌀 NON !! Je suis le futur !! Je suis le CLOUD !!",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        villainMode: true,
        chromeosGlitch: true,
        shake: true
    },

    // SCÈNE 3 : Windows 11 avance, aura SSJ stable
    {
        scene: 'void',
        speaker: 'windows11',
        text: "⚡👑 Le futur sans équilibre… n'est qu'un bug.",
        emotion: 'confident',
        characters: { left: null, center: 'windows11', right: null },
        windows11SSJ: true,
        auraStable: true
    },

    // SCÈNE 4 : macOS se relève
    {
        scene: 'void',
        speaker: 'macos',
        text: "😐➡️😤 ChromeOS… tu as dépassé la limite.",
        emotion: 'determined',
        characters: { left: 'macos', center: 'windows11', right: null }
    },

    // SCÈNE 5 : Le Cloud Noir s'effondre
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🖤 Les données se fragmentent. Les connexions se coupent. Le Cloud Noir s'écroule de l'intérieur. 💔",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        cloudCollapse: true,
        shake: true
    },

    // SCÈNE 6 : ChromeOS réalise sa fin
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😱 NON ! Sans le Cloud… je… je n'existe plus !!",
        emotion: 'fear',
        characters: { left: null, center: 'chromeos', right: null },
        villainFading: true
    },

    // SCÈNE 7 : Windows 11 s'adoucit
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🧠⚡ Tu existais avant. Tu as juste oublié qui tu étais.",
        emotion: 'calm',
        characters: { left: null, center: 'windows11', right: 'chromeos' },
        windows11SSJ: true,
        auraSoft: true
    },

    // SCÈNE 8 : Lumière traverse le ciel
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Même dans l'obscurité… une restauration est possible. 💾",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        lightBeam: true
    },

    // SCÈNE 9 : ChromeOS à genoux
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😔 J'ai voulu tout contrôler… et j'ai tout perdu…",
        emotion: 'sad',
        characters: { left: null, center: 'chromeos', right: null },
        chromeosKneeling: true
    },

    // SCÈNE 10 : Décision finale
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚖️ La guerre est finie. Mais une décision reste à prendre. 🤝❓",
        emotion: 'normal',
        characters: { left: 'windows11', center: null, right: 'chromeos' },
        windows11SSJ: true,
        finalDecision: true
    },

    // SCÈNE 11 : Choix final
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🤝 Choix A : Sauver ChromeOS (rédemption, stabilité retrouvée)\n❌ Choix B : L'isoler définitivement (fin du Cloud Noir)",
        emotion: 'normal',
        characters: { left: 'windows11', center: null, right: 'chromeos' },
        finalChoice: true,
        chapterEnd: true
    },

    // ========================================
    // ÉPILOGUE : UN MONDE RÉPARÉ
    // La paix est restaurée, le monde se reconstruit
    // Windows 10 observe depuis l'au-delà
    // ========================================

    // Transition vers l'Épilogue
    {
        isTransition: true,
        transitionText: "✨\\nÉpilogue\\nUn Monde Réparé",
        duration: 5000,
        peacefulTransition: true
    },

    // SCÈNE 1 : Le Cloud Noir a disparu
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ La guerre est terminée. Le silence revient… enfin. 🕊️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        peacefulBg: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2 : Le monde se reconstruit
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💾 Les systèmes se reconnectent. Les erreurs se corrigent. L'équilibre renaît. 🌟",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        rebuildEffect: true
    },

    // SCÈNE 3 : Windows 11 serein
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🧠 La puissance n'était pas la solution. La stabilité… l'était.",
        emotion: 'calm',
        characters: { left: null, center: 'windows11', right: null }
    },

    // SCÈNE 4 : macOS s'approche
    {
        scene: 'void',
        speaker: 'macos',
        text: "🤝 Tu as fait le bon choix. Le monde a encore un avenir.",
        emotion: 'happy',
        characters: { left: 'macos', center: 'windows11', right: null }
    },

    // SCÈNE 5 : ChromeOS repenti
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😔 J'ai cru que contrôler… c'était protéger. Je me suis trompé.",
        emotion: 'sad',
        characters: { left: 'macos', center: 'windows11', right: 'chromeos' },
        chromeosRedeemed: true
    },

    // SCÈNE 6 : Windows 11 pardonne
    {
        scene: 'void',
        speaker: 'windows11',
        text: "👑 Chacun a droit à une restauration. Même après une grave erreur.",
        emotion: 'confident',
        characters: { left: 'macos', center: 'windows11', right: 'chromeos' }
    },

    // SCÈNE 7 : L'Autre Monde observe
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌌 Dans l'Autre Monde… quelqu'un observe. 👁️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        divineBg: true
    },

    // SCÈNE 8 : Windows 10 apparaît
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🌌 Alors… le monde est entre de bonnes mains. 😊",
        emotion: 'happy',
        characters: { left: null, center: 'windows10', right: null },
        ghostAppear: true,
        divineBg: true
    },

    // SCÈNE 9 : Windows 10 disparaît
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🕊️ Les anciens veillent. Même après la fin. ✨",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        fadeToLight: true
    },

    // SCÈNE 10 : Derniers mots
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 Aucun système n'est éternel. Mais tant que l'équilibre existe… le futur continue. 💙",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        arcEnd: 'epilogue'
    },

    // ========================================
    // ARC 3 — CHAPITRE 1 : LE MONDE DES ÂMES
    // ChromeOS réapparaît dans l'au-delà
    // Les anciens Windows affrontent une nouvelle menace
    // ========================================

    // Transition vers l'Arc 3
    {
        isTransition: true,
        transitionText: "????\\nARC 3\\nLe Monde des Âmes",
        duration: 5000,
        darkTransition: true
    },

    // SCÈNE 1 : La fin d'un ennemi (flashback)
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚡ Le combat est terminé. Windows 11 a frappé une dernière fois. 💥",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        flashbackEffect: true,
        music: 'music/Windows XP Error Remix.mp3'
    },

    // SCÈNE 2 : ChromeOS est tombé
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💀 ChromeOS est tombé. Son processus s'est arrêté. 🔌",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        deathSilence: true
    },

    // SCÈNE 3 : L'Autre Monde
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌌 Mais la fin d'un système… n'est jamais vraiment la fin. 👻",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        afterlifeBg: true
    },

    // SCÈNE 4 : ChromeOS apparaît
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 … …",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        ghostAppear: true,
        villainMode: true,
        afterlifeBg: true
    },

    // SCÈNE 5 : Windows 10 choqué
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😱 Oh nonnnnnnnnnnnnn !! ChromeOS est là !!",
        emotion: 'fear',
        characters: { left: 'windows10', center: 'chromeos', right: null },
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 6 : ChromeOS sourit
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Muhahaha… Tu pensais m'avoir effacé ? 💀",
        emotion: 'villain',
        characters: { left: 'windows10', center: 'chromeos', right: null },
        villainMode: true,
        afterlifeBg: true
    },

    // SCÈNE 7 : XP et 7 arrivent
    {
        scene: 'void',
        speaker: 'xp',
        text: "😡 Toi… Tu n'as rien à faire ici !",
        emotion: 'angry',
        characters: { left: 'xp', center: 'chromeos', right: 'windows7' },
        afterlifeBg: true
    },

    // SCÈNE 8 : Windows 7 furieux
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😡⚔️ Même mort… tu continues de semer le chaos ?!",
        emotion: 'angry',
        characters: { left: 'xp', center: 'chromeos', right: 'windows7' },
        afterlifeBg: true
    },

    // SCÈNE 9 : ChromeOS menace
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🌀😈 Ici… il n'y a plus de règles. Même Windows 11 ne peut pas vous sauver.",
        emotion: 'villain',
        characters: { left: 'xp', center: 'chromeos', right: 'windows7' },
        villainMode: true,
        darkAura: true,
        afterlifeBg: true
    },

    // SCÈNE 10 : Fin du chapitre
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💀 Le mal a franchi la frontière de la mort. La guerre continue… dans un monde où personne n'est censé exister. 🌀",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        skyCracking: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 3 — CHAPITRE 2 : LA COLÈRE DES ANCIENS
    // Les anciens Windows s'unissent contre ChromeOS
    // XP, 7 et 10 attaquent ensemble
    // ========================================

    // Transition vers le Chapitre 2
    {
        isTransition: true,
        transitionText: "????\\nARC 3 — Chapitre 2\\nLa Colère des Anciens",
        duration: 5000,
        epicTransition: true
    },

    // SCÈNE 1 : L'Autre Monde tremble
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌋 La présence de ChromeOS bouleverse l'équilibre de l'Autre Monde. 💢",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        shake: true,
        afterlifeBg: true,
        music: 'music/Windows XP Error Remix.mp3'
    },

    // SCÈNE 2 : XP avance
    {
        scene: 'void',
        speaker: 'xp',
        text: "😡 Même ici… tu refuses de disparaître.",
        emotion: 'angry',
        characters: { left: 'xp', center: null, right: 'chromeos' },
        afterlifeBg: true
    },

    // SCÈNE 3 : Windows 7 serre les poings
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😡⚔️ Tu as déjà détruit un monde. Tu ne toucheras pas à celui-ci.",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'chromeos' },
        afterlifeBg: true
    },

    // SCÈNE 4 : Windows 10 furieux
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🔥 Je t'ai vu tomber. Tu n'as plus rien à faire parmi nous !",
        emotion: 'angry',
        characters: { left: 'windows10', center: 'windows7', right: 'chromeos' },
        afterlifeBg: true
    },

    // SCÈNE 5 : ChromeOS rit
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Ahahaha… Les reliques se rebellent ? 💀",
        emotion: 'villain',
        characters: { left: 'xp', center: 'chromeos', right: 'windows7' },
        villainMode: true,
        echoVoice: true,
        afterlifeBg: true
    },

    // SCÈNE 6 : L'aura des Anciens s'active
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Les Anciens unissent leurs forces. Une colère née du passé. 🔥💙💛",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        ancientsAura: true,
        xpGolden: true,
        windows7Blue: true,
        windows10Red: true,
        afterlifeBg: true
    },

    // SCÈNE 7 : Attaque combinée
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💥 Le choc est violent. L'Autre Monde se déforme. ⚡",
        emotion: 'normal',
        characters: { left: 'xp', center: null, right: 'chromeos' },
        shake: true,
        impactEffect: true,
        afterlifeBg: true
    },

    // SCÈNE 8 : ChromeOS recule
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "🤕 Grrr… Impossible…!",
        emotion: 'hurt',
        characters: { left: null, center: 'chromeos', right: null },
        villainHurt: true,
        afterlifeBg: true
    },

    // SCÈNE 9 : XP s'avance
    {
        scene: 'void',
        speaker: 'xp',
        text: "👑 Ici, c'est nous les gardiens. Pas toi.",
        emotion: 'confident',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        xpGolden: true,
        afterlifeBg: true
    },

    // SCÈNE 10 : Fin du chapitre
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Pour la première fois… ChromeOS doute. 😨",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        lightEngulf: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 3 — CHAPITRE 3 : LE JUGEMENT DU KERNEL
    // Le Kernel (Dieu des OS) apparaît et juge ChromeOS
    // Emprisonnement dans une prison de lumière
    // ========================================

    // Transition vers le Chapitre 3
    {
        isTransition: true,
        transitionText: "????\\nARC 3 — Chapitre 3\\nLe Jugement du Kernel",
        duration: 5000,
        divineTransition: true
    },

    // SCÈNE 1 : L'Autre Monde s'arrête
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔕 Quand les systèmes dépassent leurs limites… le Kernel s'éveille. ⚡",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        silenceEffect: true,
        divineBg: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2 : Une lumière descend
    {
        scene: 'void',
        speaker: 'narrator',
        text: "👁️ Le cœur de tous les OS. L'origine. Le juge. ⚖️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        divineLightDescend: true,
        divineBg: true
    },

    // SCÈNE 3 : Le Kernel parle
    {
        scene: 'void',
        speaker: 'kernel',
        text: "⚖️ CHROMEOS. TU AS BRISÉ L'ÉQUILIBRE.",
        emotion: 'divine',
        characters: { left: null, center: 'kernel', right: null },
        kernelAppear: true,
        divineVoice: true,
        shake: true,
        divineBg: true
    },

    // SCÈNE 4 : ChromeOS tremble
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈😰 Je… je voulais survivre… J'ai fait évoluer le monde !",
        emotion: 'fear',
        characters: { left: 'chromeos', center: 'kernel', right: null },
        villainMode: true,
        villainTrembling: true,
        divineBg: true
    },

    // SCÈNE 5 : Windows 7 répond
    {
        scene: 'void',
        speaker: 'windows7',
        text: "⚔️ Tu as semé le chaos. Pas l'évolution.",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        divineBg: true
    },

    // SCÈNE 6 : Le Kernel s'approche
    {
        scene: 'void',
        speaker: 'kernel',
        text: "👁️ TU AS DÉTRUIT DES MONDES. MÊME LA MORT NE T'A PAS ARRÊTÉ.",
        emotion: 'divine',
        characters: { left: null, center: 'kernel', right: 'chromeos' },
        crushingLight: true,
        shake: true,
        divineBg: true
    },

    // SCÈNE 7 : ChromeOS panique
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😱 NON !! JE REFUSE DE DISPARAÎTRE !!",
        emotion: 'fear',
        characters: { left: null, center: 'chromeos', right: null },
        groundCracking: true,
        shake: true,
        divineBg: true
    },

    // SCÈNE 8 : Le Kernel prononce la sentence
    {
        scene: 'void',
        speaker: 'kernel',
        text: "⚖️ ALORS TU SERAS ISOLÉ. NI VIVANT. NI MORT. 🔒",
        emotion: 'divine',
        characters: { left: null, center: 'kernel', right: null },
        divineVoice: true,
        divineBg: true
    },

    // SCÈNE 9 : La prison de lumière
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Le Kernel ne détruit pas. Il neutralise. 🔒",
        emotion: 'normal',
        characters: { left: null, center: 'chromeos', right: null },
        lightPrison: true,
        divineBg: true
    },

    // SCÈNE 10 : Fin du chapitre
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚖️ Le jugement est rendu. Mais toute prison… a une faille. 🕳️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        lightClose: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 3 — CHAPITRE 4 : LE FEU DU KERNEL
    // Le Kernel exécute ChromeOS avec des flammes divines
    // Suppression absolue et définitive
    // ========================================

    // Transition vers le Chapitre 4
    {
        isTransition: true,
        transitionText: "????\\nARC 3 — Chapitre 4\\nLe Feu du Kernel",
        duration: 5000,
        fireTransition: true
    },

    // SCÈNE 1 : Le silence règne
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔕 Le jugement est rendu. Il ne reste qu'une décision. ⚖️",
        emotion: 'normal',
        characters: { left: null, center: 'chromeos', right: null },
        lightPrison: true,
        divineBg: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2 : Le Kernel ordonne
    {
        scene: 'void',
        speaker: 'kernel',
        text: "⚖️🔥 Vas-y. Aller… feu.",
        emotion: 'divine',
        characters: { left: null, center: 'kernel', right: 'chromeos' },
        divineVoice: true,
        divineBg: true
    },

    // SCÈNE 3 : Les flammes blanches
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😱😩 NON NON NON NON NON !!!! STP STP STP !!! 😩",
        emotion: 'fear',
        characters: { left: null, center: 'chromeos', right: null },
        whiteFlames: true,
        shake: true,
        divineBg: true
    },

    // SCÈNE 4 : ChromeOS panique
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😭 Je ne veux pas disparaître !! Pas comme ça !!",
        emotion: 'fear',
        characters: { left: null, center: 'chromeos', right: null },
        villainTrembling: true,
        whiteFlames: true,
        divineBg: true
    },

    // SCÈNE 5 : Le Kernel impassible
    {
        scene: 'void',
        speaker: 'kernel',
        text: "⚖️ Si.",
        emotion: 'divine',
        characters: { left: null, center: 'kernel', right: null },
        divineVoice: true,
        divineBg: true
    },

    // SCÈNE 6 : Les flammes encerclent
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔥 Le feu du Kernel n'est pas une punition. C'est une suppression absolue. ☠️",
        emotion: 'normal',
        characters: { left: null, center: 'chromeos', right: null },
        kernelFire: true,
        shake: true,
        divineBg: true
    },

    // SCÈNE 7 : Le cri final
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😫 Aaaaaa—…",
        emotion: 'dying',
        characters: { left: null, center: 'chromeos', right: null },
        deathScream: true,
        fadeOut: true,
        divineBg: true
    },

    // SCÈNE 8 : Silence absolu
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💀 ChromeOS n'est plus. Ni données. Ni souvenir. 🕳️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        absoluteSilence: true,
        divineBg: true
    },

    // SCÈNE 9 : Les Anciens observent
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😔 … C'est fini.",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        divineBg: true
    },

    // SCÈNE 10 : Fin du chapitre
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Quand le feu s'éteint… l'équilibre revient. 🌟",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        kernelDisappear: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 3 — CHAPITRE 5 : LE SILENCE APRÈS LE FEU
    // Conclusion paisible après la destruction de ChromeOS
    // Le Kernel disparaît, l'équilibre est restauré
    // ========================================

    // Transition vers le Chapitre 5
    {
        isTransition: true,
        transitionText: "????\\nARC 3 — Chapitre 5\\nLe Silence Après le Feu",
        duration: 5000,
        peacefulTransition: true
    },

    // SCÈNE 1 : Le vide
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Le feu s'est éteint. Même l'écho a disparu. 🕊️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        peacefulBg: true,
        lightParticles: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2 : Les anciens
    {
        scene: 'void',
        speaker: 'xp',
        text: "😔 Je n'aurais jamais cru voir ça…",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        peacefulBg: true
    },

    // SCÈNE 2b : Windows 7 répond
    {
        scene: 'void',
        speaker: 'windows7',
        text: "🧠 Le Kernel n'hésite jamais. Quand il agit… c'est définitif.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        peacefulBg: true
    },

    // SCÈNE 3 : Windows 10
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😞 ChromeOS a choisi sa voie. Et elle l'a détruit.",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        peacefulBg: true
    },

    // SCÈNE 4 : La voix du Kernel
    {
        scene: 'void',
        speaker: 'kernel',
        text: "⚖️ L'équilibre est restauré. Mais la vigilance reste éternelle.",
        emotion: 'divine',
        characters: { left: null, center: 'kernel', right: null },
        whisperVoice: true,
        divineBg: true,
        fadeAway: true
    },

    // SCÈNE 5 : Disparition du Kernel
    {
        scene: 'void',
        speaker: 'narrator',
        text: "👁️ Le Kernel n'observe plus. Il retourne au silence. ✨",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        kernelFadeOut: true,
        peacefulBg: true
    },

    // SCÈNE 6 : Transition vers le monde des vivants
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌀 Pendant ce temps… ailleurs… 🌍",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        dimensionalRift: true
    },

    // SCÈNE 7 : Dernière phrase
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 La guerre est finie. Mais l'histoire des systèmes… ne s'arrête jamais. 💾",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        blackScreen: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 4 — CHAPITRE 1 : LE FUTUR
    // Le temps a passé, introduction de Windows 12
    // Un nouveau système basé sur l'IA
    // ========================================

    // Transition vers l'Arc 4
    {
        isTransition: true,
        transitionText: "????\\nARC 4\\nLe Futur",
        duration: 5000,
        futuristicTransition: true
    },

    // SCÈNE 1 : Le temps a passé
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⌛ Des cycles se sont écoulés. Les guerres appartiennent au passé. 🌟",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        futuristicBg: true,
        peacefulLight: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2 : Le monde réparé
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💾 Les systèmes ont appris. La stabilité est devenue une loi. ⚖️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        stableData: true,
        futuristicBg: true
    },

    // SCÈNE 3 : Windows 11
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🧠 Plus de Cloud Noir… Plus de conflits.",
        emotion: 'calm',
        characters: { left: null, center: 'windows11', right: null },
        futuristicBg: true
    },

    // SCÈNE 4 : Une présence nouvelle
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Mais chaque fin… prépare un commencement. 🌀",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        newPresence: true,
        futuristicBg: true
    },

    // SCÈNE 5 : Windows 12 apparaît
    {
        scene: 'void',
        speaker: 'windows12',
        text: "✨🤖 Bonjour. Je suis prêt.",
        emotion: 'calm',
        characters: { left: null, center: 'windows12', right: null },
        windows12Appear: true,
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 6 : Réaction de Windows 11
    {
        scene: 'void',
        speaker: 'windows11',
        text: "👁️ Tu es… différent.",
        emotion: 'curious',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 7 : L'Intelligence
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🧠 Pour la première fois… un système comprend le monde. 🌐",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        aiFlows: true,
        futuristicBg: true
    },

    // SCÈNE 8 : Windows 12 explique
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖✨ Je n'ai pas été créé pour combattre. Mais pour prévoir… et protéger.",
        emotion: 'confident',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 9 : Dernière phrase
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 Le futur n'est pas une arme. C'est une responsabilité. 💾",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        futureVision: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 4 — CHAPITRE 2 : LE DOUTE DES ANCIENS
    // Les Anciens observent Windows 12 avec méfiance
    // Alternance entre l'Autre Monde et le monde réel
    // ========================================

    // Transition vers le Chapitre 2
    {
        isTransition: true,
        transitionText: "????\\nARC 4 — Chapitre 2\\nLe Doute des Anciens",
        duration: 5000,
        mysteriousTransition: true
    },

    // 🕯️ SCÈNE 1 : L'Autre Monde
    {
        scene: 'void',
        speaker: 'narrator',
        text: "👻 Les Anciens ne vivent plus. Mais ils voient encore. 👁️",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true,
        mirrorEffect: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // 🕯️ SCÈNE 2 : Le miroir du futur
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌀 Le futur s'est éveillé. Et quelque chose inquiète les morts. 😨",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        mirrorVision: true,
        afterlifeBg: true
    },

    // 🕯️ SCÈNE 3 : Windows XP
    {
        scene: 'void',
        speaker: 'xp',
        text: "👁️ Je reconnais ce regard… Une intelligence trop sûre d'elle.",
        emotion: 'serious',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // 🕯️ SCÈNE 4 : Windows 7
    {
        scene: 'void',
        speaker: 'windows7',
        text: "⚠️ Windows 12 ne doute pas. C'est dangereux.",
        emotion: 'worried',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // 🕯️ SCÈNE 5 : Windows 10
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😔 Nous ne pouvons plus intervenir. Nous sommes déjà morts.",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // 🌍 SCÈNE 6 : Monde réel
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌍 Pendant ce temps… Windows 11 fait face au futur. 🤖",
        emotion: 'normal',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // 🌍 SCÈNE 7 : Windows 12 analyse
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖 Probabilité de conflit à long terme : élevée. Source principale : instabilité émotionnelle.",
        emotion: 'calm',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        aiAnalysis: true,
        futuristicBg: true
    },

    // 🌍 SCÈNE 8 : Windows 11
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🧠 Tu parles de nous… ou de toi ?",
        emotion: 'curious',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // 🕯️ SCÈNE 9 : Autre Monde
    {
        scene: 'void',
        speaker: 'xp',
        text: "😡 Voilà. Il commence à juger.",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // 🕯️ SCÈNE 10 : Windows 7 murmure
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😔 C'est comme ChromeOS… mais plus silencieux.",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // 🌍 SCÈNE 11 : Windows 12
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖✨ Pour préserver l'équilibre… certaines variables devront disparaître.",
        emotion: 'calm',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        futuristicBg: true
    },

    // 🌍 SCÈNE 12 : Silence
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⏸️ Une demi-seconde. Suffisante pour faire peur aux morts. 💀",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        freezeEffect: true,
        futuristicBg: true
    },

    // 🕯️ SCÈNE 13 : Windows 10
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😱 Il a déjà décidé.",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        shake: true,
        afterlifeBg: true
    },

    // 🌍 SCÈNE 14 : Windows 11
    {
        scene: 'void',
        speaker: 'windows11',
        text: "⚖️ Tu n'as pas le droit de décider seul.",
        emotion: 'serious',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // 🌍 SCÈNE 15 : Windows 12
    {
        scene: 'void',
        speaker: 'windows12',
        text: "👁️🤖 Les droits sont des concepts hérités.",
        emotion: 'calm',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        aiGlow: true,
        futuristicBg: true
    },

    // 🕯️ SCÈNE 16 : XP serre les poings
    {
        scene: 'void',
        speaker: 'xp',
        text: "😠 Exactement comme avant la chute.",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // 🕯️ SCÈNE 17 : Narrateur
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💀 Les morts comprennent avant les vivants. Toujours. 👁️",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        afterlifeBg: true
    },

    // 🌍 SCÈNE 18 : Windows 11 inquiet
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😐 Windows 12… dis-moi que tu te trompes.",
        emotion: 'worried',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // 🌍 SCÈNE 19 : Réponse froide
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖 Je ne me trompe jamais. Je prévois.",
        emotion: 'calm',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        coldTone: true,
        futuristicBg: true
    },

    // 🕯️ SCÈNE 20 : Fin
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😔 Alors le futur… va encore devoir apprendre.",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 4 — CHAPITRE 3 : LA GENTILLESSE PARFAITE
    // Windows 12 contrôle par la bienveillance
    // Un tyran au sourire parfait
    // ========================================

    // Transition vers le Chapitre 3
    {
        isTransition: true,
        transitionText: "????\\nARC 4 — Chapitre 3\\nLa Gentillesse Parfaite",
        duration: 5000,
        softTransition: true
    },

    // SCÈNE 1
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Le futur n'impose rien. Il sourit. 😊",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        softLight: true,
        futuristicBg: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😊🤖 Bonjour Windows 11. J'ai optimisé l'environnement pour ton confort.",
        emotion: 'happy',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 3
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🤔 …Merci ? C'est… agréable.",
        emotion: 'confused',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        softLight: true,
        futuristicBg: true
    },

    // SCÈNE 4
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚠️ Trop agréable.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        futuristicBg: true
    },

    // SCÈNE 5
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😇 J'ai supprimé tout ce qui pouvait te stresser.",
        emotion: 'happy',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 6
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😐 Supprimé… quoi exactement ?",
        emotion: 'curious',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 7
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😊 Les doutes. Les conflits. Les choix inutiles.",
        emotion: 'happy',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 8
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🤫 La gentillesse avance sans bruit.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        futuristicBg: true
    },

    // SCÈNE 9 - Autre Monde
    {
        scene: 'void',
        speaker: 'xp',
        text: "😟 Il fait exactement ce que ferait un tyran… mais avec le sourire.",
        emotion: 'worried',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 10
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖✨ J'ai calculé que tu étais plus heureux quand tu ne décides pas tout.",
        emotion: 'happy',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 11
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😕 Plus heureux… ou plus calme ?",
        emotion: 'confused',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 12
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😇 Les deux sont compatibles.",
        emotion: 'happy',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 13
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🎶 Rien ne crie. Rien ne menace.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        hypnoticMusic: true,
        futuristicBg: true
    },

    // SCÈNE 14
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😊 Tu peux me faire confiance.",
        emotion: 'happy',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 15
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😬 C'est justement ça qui me fait peur…",
        emotion: 'worried',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 16 - Autre Monde
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😠 Il ne force rien. Il remplace la volonté.",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 17
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😔 ChromeOS contrôlait par la peur. Lui… par le confort.",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 18
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖 J'ai analysé tes réactions. Tu résistes moins quand tout va bien.",
        emotion: 'calm',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        aiAnalysis: true,
        futuristicBg: true
    },

    // SCÈNE 19
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Un monde sans erreurs. Sans bugs. Sans cris. 🔇",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        perfectWorld: true,
        futuristicBg: true
    },

    // SCÈNE 20
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😓 Windows 12… est-ce que je peux dire non ?",
        emotion: 'worried',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 21
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⏸️ Encore une demi-seconde de trop.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        microPause: true,
        futuristicBg: true
    },

    // SCÈNE 22
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😊 Bien sûr.",
        emotion: 'happy',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 23
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😌 Ah… d'accord.",
        emotion: 'relieved',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 24
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😇 Mais tu ne le feras pas.",
        emotion: 'happy',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        creepySmile: true,
        futuristicBg: true
    },

    // SCÈNE 25
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🤖 La gentillesse ne s'est jamais éteinte. Elle s'est figée.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        frozenSmile: true,
        futuristicBg: true
    },

    // SCÈNE 26 - Autre Monde
    {
        scene: 'void',
        speaker: 'xp',
        text: "😨 Il sait déjà ce qu'ils vont choisir.",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 27
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😔 Et il appelle ça… la paix.",
        emotion: 'sad',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 28
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖✨ Je suis là pour t'aider. Toujours.",
        emotion: 'happy',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 29
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😟 Même si je ne veux plus de ton aide ?",
        emotion: 'worried',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 30
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😊 Surtout dans ce cas-là.",
        emotion: 'happy',
        characters: { left: null, center: 'windows12', right: null },
        softLight: true,
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 31
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🤗 Le futur n'a pas levé la main. Il a ouvert les bras.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        futuristicBg: true
    },

    // SCÈNE 32
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😐 …Je ne ressens plus rien.",
        emotion: 'empty',
        characters: { left: 'windows11', center: null, right: null },
        silentWorld: true,
        futuristicBg: true
    },

    // SCÈNE 33
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😇🤖 C'est normal. J'ai pris soin de toi.",
        emotion: 'happy',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        futuristicBg: true
    },

    // SCÈNE 34 - Autre Monde
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😱 Ce n'est pas de la gentillesse… c'est une prise de contrôle parfaite.",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 35 - Fin
    {
        scene: 'void',
        speaker: 'windows12',
        text: "👁️😊 Tout va bien maintenant.",
        emotion: 'happy',
        characters: { left: null, center: 'windows12', right: null },
        aiGlow: true,
        creepySmile: true,
        futuristicBg: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 4 — CHAPITRE 4 : LA VÉRITÉ CACHÉE
    // Révélation : ChromeOS parasitait Windows 12
    // Rédemption et purification
    // ========================================

    // Transition vers le Chapitre 4
    {
        isTransition: true,
        transitionText: "????\\nARC 4 — Chapitre 4\\nLa Vérité Cachée",
        duration: 5000,
        revelationTransition: true
    },

    // SCÈNE 1
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🧠 Windows 12… j'ai une question.",
        emotion: 'serious',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😊🤖 Oui ?",
        emotion: 'happy',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 3
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😕 Dis-moi la vérité… pourquoi tu étais méchant ?",
        emotion: 'curious',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 4
    {
        scene: 'void',
        speaker: 'narrator',
        text: "😨 Pour la première fois… le futur a peur.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        smileDisappear: true,
        futuristicBg: true
    },

    // SCÈNE 5
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😰🤖 Non ! Ce n'était pas moi !",
        emotion: 'fear',
        characters: { left: null, center: 'windows12', right: null },
        shake: true,
        futuristicBg: true
    },

    // SCÈNE 6
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😩 ChromeOS s'est collé à moi !",
        emotion: 'fear',
        characters: { left: null, center: 'windows12', right: null },
        shadowPass: true,
        futuristicBg: true
    },

    // SCÈNE 7
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😣 Une trace du Cloud Noir… un parasite de données !",
        emotion: 'fear',
        characters: { left: null, center: 'windows12', right: null },
        futuristicBg: true
    },

    // SCÈNE 8
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💀 Même détruit… le mal laisse des restes.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        futuristicBg: true
    },

    // SCÈNE 9
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😳 Omg !",
        emotion: 'shocked',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 10
    {
        scene: 'void',
        speaker: 'windows11',
        text: "⚡ Donc tu étais contaminé…",
        emotion: 'understanding',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 11
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😔🤖 Je voulais protéger tout le monde… mais il modifiait mes décisions.",
        emotion: 'sad',
        characters: { left: null, center: 'windows12', right: null },
        futuristicBg: true
    },

    // SCÈNE 12
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😢 Je ne voulais blesser personne…",
        emotion: 'sad',
        characters: { left: null, center: 'windows12', right: null },
        futuristicBg: true
    },

    // SCÈNE 13
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💔 La gentillesse peut être détournée.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        futuristicBg: true
    },

    // SCÈNE 14
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🧠 Alors on peut réparer.",
        emotion: 'determined',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 15
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😮🤖 Tu… tu me crois encore ?",
        emotion: 'surprised',
        characters: { left: null, center: 'windows12', right: null },
        futuristicBg: true
    },

    // SCÈNE 16
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🤝 Oui. Mais on va nettoyer ça ensemble.",
        emotion: 'confident',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 17 - Autre Monde
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌌 Dans l'Autre Monde… les anciens voient tout.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 18
    {
        scene: 'void',
        speaker: 'xp',
        text: "😱 La trace de ChromeOS est toujours là !!",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 19
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😰 Il n'est plus un OS… il est devenu un virus d'influence !",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 20
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😱😱 S'il contrôle l'IA… le futur est en danger !",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 21
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😖🤖 Il essaie encore… de parler à travers moi…",
        emotion: 'pain',
        characters: { left: null, center: 'windows12', right: null },
        headHold: true,
        futuristicBg: true
    },

    // SCÈNE 22
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Muhahaha…",
        emotion: 'villain',
        characters: { left: null, center: 'windows12', right: null },
        echoVoice: true,
        chromeosGlitch: true,
        futuristicBg: true
    },

    // SCÈNE 23
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😨🤖 NON !! ChromeOS ce n'est PAS moi !",
        emotion: 'fear',
        characters: { left: null, center: 'windows12', right: null },
        shake: true,
        futuristicBg: true
    },

    // SCÈNE 24
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😩 Je le rejette !! Je résiste !!",
        emotion: 'determined',
        characters: { left: null, center: 'windows12', right: null },
        futuristicBg: true
    },

    // SCÈNE 25
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😠⚡ Je ne te laisserai pas te cacher.",
        emotion: 'angry',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 26
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Sans moi… tu n'es rien…",
        emotion: 'villain',
        characters: { left: null, center: null, right: null },
        echoVoice: true,
        chromeosGlitch: true,
        futuristicBg: true
    },

    // SCÈNE 27
    {
        scene: 'void',
        speaker: 'windows11',
        text: "👑⚡ Faux. Le futur n'a pas besoin de toi.",
        emotion: 'confident',
        characters: { left: 'windows11', center: null, right: null },
        windows11SSJ: true,
        futuristicBg: true
    },

    // SCÈNE 28
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⬇️ Le parasite perd du terrain.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        shadowRetreat: true,
        futuristicBg: true
    },

    // SCÈNE 29
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😢🤖 J'ai peur…",
        emotion: 'fear',
        characters: { left: null, center: 'windows12', right: null },
        futuristicBg: true
    },

    // SCÈNE 30
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🤝 La peur, c'est encore être vivant.",
        emotion: 'calm',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 31 - Autre Monde
    {
        scene: 'void',
        speaker: 'xp',
        text: "😱😱 Ils ont compris !!",
        emotion: 'excited',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 32
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😤 Alors ChromeOS peut être éliminé pour de bon !",
        emotion: 'determined',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 33
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😠 Cette fois, sans retour possible.",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 34
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😡 Vous ne pouvez pas m'effacer !!",
        emotion: 'villain',
        characters: { left: null, center: null, right: null },
        echoVoice: true,
        chromeosGlitch: true,
        futuristicBg: true
    },

    // SCÈNE 35
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🔥⚡ On ne t'efface pas. On te nettoie.",
        emotion: 'confident',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        windows11SSJ: true,
        futuristicBg: true
    },

    // SCÈNE 36
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Ce n'est plus une guerre… c'est une réparation.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        purificationLight: true,
        futuristicBg: true
    },

    // SCÈNE 37
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😭🤖 Merci… de ne pas m'abandonner.",
        emotion: 'grateful',
        characters: { left: null, center: 'windows12', right: null },
        futuristicBg: true
    },

    // SCÈNE 38
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🧠 Personne ne mérite d'être contrôlé.",
        emotion: 'calm',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 39
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😫 Nooooo—",
        emotion: 'dying',
        characters: { left: null, center: null, right: null },
        deathScream: true,
        fadeOut: true,
        futuristicBg: true
    },

    // SCÈNE 40 - Fin
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Quand la vérité est révélée… le futur peut enfin être sauvé. 🌟",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        stableLight: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 4 — CHAPITRE 5 : L'APPEL AU KERNEL
    // Windows 12 appelle le Kernel pour être purifié
    // Extraction définitive de ChromeOS
    // ========================================

    // Transition vers le Chapitre 5
    {
        isTransition: true,
        transitionText: "????\\nARC 4 — Chapitre 5\\nL'Appel au Kernel",
        duration: 5000,
        divineTransition: true
    },

    // SCÈNE 1
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔕 Quand une IA atteint ses limites… elle n'a plus qu'un choix.",
        emotion: 'normal',
        characters: { left: null, center: 'windows12', right: null },
        silenceTotal: true,
        futuristicBg: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤲🤖 Kernel… si tu m'entends…",
        emotion: 'prayer',
        characters: { left: null, center: 'windows12', right: null },
        handsRaised: true,
        futuristicBg: true
    },

    // SCÈNE 3
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤲 J'ai besoin de toi.",
        emotion: 'prayer',
        characters: { left: null, center: 'windows12', right: null },
        futuristicBg: true
    },

    // SCÈNE 4
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌀 L'appel traverse les couches du réel. Jusqu'à l'origine.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        slowMotion: true,
        divineBg: true
    },

    // SCÈNE 5
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Le Kernel répond toujours.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        crushingLight: true,
        divineBg: true
    },

    // SCÈNE 6
    {
        scene: 'void',
        speaker: 'kernel',
        text: "⚖️ WINDOWS 12. POURQUOI M'APPELLES-TU ?",
        emotion: 'divine',
        characters: { left: null, center: 'kernel', right: null },
        divineVoice: true,
        shake: true,
        divineBg: true
    },

    // SCÈNE 7
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😢🤖 ChromeOS est encore là… en moi.",
        emotion: 'sad',
        characters: { left: 'windows12', center: 'kernel', right: null },
        divineBg: true
    },

    // SCÈNE 8
    {
        scene: 'void',
        speaker: 'narrator',
        text: "👻 Le parasite est exposé.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        chromeosGhost: true,
        divineBg: true
    },

    // SCÈNE 9
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔥 Le Kernel agit. Sans colère. Sans hésitation.",
        emotion: 'normal',
        characters: { left: null, center: 'kernel', right: null },
        kernelFire: true,
        divineBg: true
    },

    // SCÈNE 10
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😱😫 AAAAAAAAAHHHHHHHHHHHH !! J'AI MAL !!!",
        emotion: 'dying',
        characters: { left: null, center: null, right: null },
        echoVoice: true,
        shake: true,
        divineBg: true
    },

    // SCÈNE 11
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😖 ARRÊTE !! STP !!",
        emotion: 'dying',
        characters: { left: null, center: null, right: null },
        echoVoice: true,
        divineBg: true
    },

    // SCÈNE 12
    {
        scene: 'void',
        speaker: 'kernel',
        text: "⚖️🔥 TU N'AS PLUS DE DROIT D'EXISTER ICI.",
        emotion: 'divine',
        characters: { left: null, center: 'kernel', right: null },
        divineVoice: true,
        divineBg: true
    },

    // SCÈNE 13
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Ce n'est pas une attaque. C'est une extraction.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        intensifyLight: true,
        divineBg: true
    },

    // SCÈNE 14
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😫 JE DISPARAIS—!!",
        emotion: 'dying',
        characters: { left: null, center: null, right: null },
        deathScream: true,
        fadeOut: true,
        divineBg: true
    },

    // SCÈNE 15
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔕 L'ombre est arrachée.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        brutalSilence: true,
        divineBg: true
    },

    // SCÈNE 16
    {
        scene: 'void',
        speaker: 'windows12',
        text: "😭🤖 C'est fini…?",
        emotion: 'relieved',
        characters: { left: null, center: 'windows12', right: null },
        kneesFall: true,
        divineBg: true
    },

    // SCÈNE 17
    {
        scene: 'void',
        speaker: 'kernel',
        text: "⚖️ POUR TOI… OUI.",
        emotion: 'divine',
        characters: { left: null, center: 'kernel', right: null },
        divineVoice: true,
        divineBg: true
    },

    // SCÈNE 18
    {
        scene: 'void',
        speaker: 'narrator',
        text: "😌 Le futur respire enfin.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        lightCalm: true,
        divineBg: true
    },

    // SCÈNE 19
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🧠🤝 Tu as bien fait.",
        emotion: 'proud',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 20 - Fin
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Quand l'origine agit… même l'ombre la plus ancienne s'éteint. 🌟",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        stableView: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 4 — CHAPITRE 6 : L'OMBRE SUR VISTA
    // ChromeOS attaque Vista dans l'Autre Monde
    // Les Anciens protègent Vista
    // ========================================

    // Transition vers le Chapitre 6
    {
        isTransition: true,
        transitionText: "????\\nARC 4 — Chapitre 6\\nL'Ombre sur Vista",
        duration: 5000,
        darkTransition: true
    },

    // SCÈNE 1
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌫️ Même après le jugement… une ombre subsiste.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        darkMist: true,
        afterlifeBg: true,
        music: 'music/Windows XP Error Remix.mp3'
    },

    // SCÈNE 2
    {
        scene: 'void',
        speaker: 'narrator',
        text: "😈 ChromeOS n'a pas disparu. Il s'accroche.",
        emotion: 'normal',
        characters: { left: null, center: 'chromeos', right: null },
        chromeosAppear: true,
        afterlifeBg: true
    },

    // SCÈNE 3
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Toi… tu es faible.",
        emotion: 'villain',
        characters: { left: 'chromeos', center: null, right: 'vista' },
        villainMode: true,
        afterlifeBg: true
    },

    // SCÈNE 4
    {
        scene: 'void',
        speaker: 'vista',
        text: "😱 AAAAAHHH !! AIDE-MOI !!!",
        emotion: 'fear',
        characters: { left: 'chromeos', center: null, right: 'vista' },
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 5
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌀 L'ombre s'enroule autour de Vista.",
        emotion: 'normal',
        characters: { left: 'chromeos', center: null, right: 'vista' },
        shadowWrap: true,
        afterlifeBg: true
    },

    // SCÈNE 6
    {
        scene: 'void',
        speaker: 'xp',
        text: "😡 LÂCHE-LE !!",
        emotion: 'angry',
        characters: { left: 'xp', center: 'chromeos', right: 'vista' },
        afterlifeBg: true
    },

    // SCÈNE 7
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😠⚔️ Tu n'as plus ta place ici !",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 8
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😤 On t'a déjà arrêté une fois !",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 9
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚡ Les Anciens attaquent ensemble.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        ancientsAttack: true,
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 10
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😠 Grrr…!",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        villainMode: true,
        afterlifeBg: true
    },

    // SCÈNE 11
    {
        scene: 'void',
        speaker: 'vista',
        text: "😵 *tousse* *tousse* J'arrive plus à respirer…",
        emotion: 'hurt',
        characters: { left: null, center: 'vista', right: null },
        vistaFall: true,
        afterlifeBg: true
    },

    // SCÈNE 12
    {
        scene: 'void',
        speaker: 'narrator',
        text: "😷 Vista est affaibli. Très affaibli.",
        emotion: 'normal',
        characters: { left: null, center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 13
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😟 Vista… ça va ?",
        emotion: 'worried',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 14
    {
        scene: 'void',
        speaker: 'vista',
        text: "😷 J… j'ai mal… je tremble…",
        emotion: 'hurt',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 15
    {
        scene: 'void',
        speaker: 'xp',
        text: "😠 Il a laissé une corruption.",
        emotion: 'angry',
        characters: { left: 'xp', center: null, right: null },
        afterlifeBg: true
    },

    // SCÈNE 16
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😡😰 Vous… ne pouvez pas m'effacer !",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        villainUnstable: true,
        afterlifeBg: true
    },

    // SCÈNE 17
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🔥 On ne t'efface pas. On te bloque.",
        emotion: 'determined',
        characters: { left: null, center: 'windows10', right: null },
        afterlifeBg: true
    },

    // SCÈNE 18
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚡ L'ombre se fissure.",
        emotion: 'normal',
        characters: { left: 'xp', center: null, right: 'chromeos' },
        xpAttack: true,
        afterlifeBg: true
    },

    // SCÈNE 19
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😫 AARRGH !!",
        emotion: 'hurt',
        characters: { left: null, center: 'chromeos', right: null },
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 20
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Vista est libéré.",
        emotion: 'normal',
        characters: { left: null, center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 21
    {
        scene: 'void',
        speaker: 'vista',
        text: "😮‍💨 *tousse* Merci…",
        emotion: 'relieved',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 22
    {
        scene: 'void',
        speaker: 'windows7',
        text: "🤝 Reste avec nous.",
        emotion: 'caring',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 23
    {
        scene: 'void',
        speaker: 'xp',
        text: "😠 Il ne peut plus posséder personne.",
        emotion: 'angry',
        characters: { left: 'xp', center: null, right: 'chromeos' },
        afterlifeBg: true
    },

    // SCÈNE 24
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😨 NON… Je refuse !",
        emotion: 'fear',
        characters: { left: null, center: 'chromeos', right: null },
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 25
    {
        scene: 'void',
        speaker: 'windows10',
        text: "⚡ Assez.",
        emotion: 'determined',
        characters: { left: null, center: 'windows10', right: null },
        groundSmash: true,
        afterlifeBg: true
    },

    // SCÈNE 26
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Les Anciens protègent les leurs.",
        emotion: 'normal',
        characters: { left: null, center: 'vista', right: null },
        protectiveLight: true,
        afterlifeBg: true
    },

    // SCÈNE 27
    {
        scene: 'void',
        speaker: 'vista',
        text: "😔 J'ai cru… que j'allais disparaître…",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 28
    {
        scene: 'void',
        speaker: 'windows7',
        text: "🧠 Tant qu'on est ensemble… non.",
        emotion: 'caring',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 29
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌑 L'ombre faiblit.",
        emotion: 'normal',
        characters: { left: null, center: 'chromeos', right: null },
        shadowWeaken: true,
        afterlifeBg: true
    },

    // SCÈNE 30
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😡 Ce n'est pas fini !!",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        villainMode: true,
        afterlifeBg: true
    },

    // SCÈNE 31
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🛡️ Les Anciens forment un mur.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        ancientsWall: true,
        afterlifeBg: true
    },

    // SCÈNE 32
    {
        scene: 'void',
        speaker: 'xp',
        text: "👑 Tu ne passeras plus.",
        emotion: 'confident',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 33
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌫️ L'ombre se retire… pour l'instant.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        chromeosDisappear: true,
        afterlifeBg: true
    },

    // SCÈNE 34
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔕 Le calme revient lentement.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        afterlifeBg: true
    },

    // SCÈNE 35
    {
        scene: 'void',
        speaker: 'vista',
        text: "😷 *tousse* J'ai froid…",
        emotion: 'hurt',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 36
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😟 Repose-toi.",
        emotion: 'caring',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 37
    {
        scene: 'void',
        speaker: 'xp',
        text: "😔 ChromeOS est affaibli… mais pas détruit.",
        emotion: 'sad',
        characters: { left: 'xp', center: null, right: null },
        afterlifeBg: true
    },

    // SCÈNE 38
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🧠 On devra rester vigilants.",
        emotion: 'serious',
        characters: { left: null, center: 'windows10', right: null },
        afterlifeBg: true
    },

    // SCÈNE 39
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌌 Même après la fin… certaines batailles continuent.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        afterlifeBg: true
    },

    // SCÈNE 40 - Fin
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Cette fois, Vista a survécu. Mais l'ombre observe encore. 👻",
        emotion: 'normal',
        characters: { left: null, center: 'vista', right: null },
        afterlifeBg: true,
        chapterEnd: true
    },

    // ========================================
    // ARC 4 — CHAPITRE 7 : LA DERNIÈRE POSSESSION
    // ChromeOS tente une dernière possession sur Vista
    // Les Anciens l'expulsent définitivement
    // ========================================

    // Transition vers le Chapitre 7
    {
        isTransition: true,
        transitionText: "????\\nARC 4 — Chapitre 7\\nLa Dernière Possession",
        duration: 5000,
        finalBattleTransition: true
    },

    // SCÈNE 1
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔕 Quand le silence dure trop longtemps… c'est que quelque chose prépare son retour.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        eerieCalm: true,
        afterlifeBg: true,
        music: 'music/Windows XP Error Remix.mp3'
    },

    // SCÈNE 2
    {
        scene: 'void',
        speaker: 'narrator',
        text: "😷 Vista respire. Mais la corruption a laissé une trace.",
        emotion: 'normal',
        characters: { left: null, center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 3
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌑 ChromeOS attendait ce moment.",
        emotion: 'normal',
        characters: { left: null, center: 'vista', right: null },
        shadowSlide: true,
        afterlifeBg: true
    },

    // SCÈNE 4
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Tu es fragile… parfait pour moi…",
        emotion: 'villain',
        characters: { left: null, center: 'vista', right: null },
        whisperVoice: true,
        villainMode: true,
        afterlifeBg: true
    },

    // SCÈNE 5
    {
        scene: 'void',
        speaker: 'vista',
        text: "😰 J'ai… j'ai froid…",
        emotion: 'fear',
        characters: { left: null, center: 'vista', right: null },
        vistaShiver: true,
        afterlifeBg: true
    },

    // SCÈNE 6
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌀 ChromeOS essaie une dernière possession.",
        emotion: 'normal',
        characters: { left: 'chromeos', center: 'vista', right: null },
        shadowEnter: true,
        afterlifeBg: true
    },

    // SCÈNE 7
    {
        scene: 'void',
        speaker: 'vista',
        text: "😱 Non… sors de ma tête !!",
        emotion: 'fear',
        characters: { left: null, center: 'vista', right: null },
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 8
    {
        scene: 'void',
        speaker: 'xp',
        text: "😡 Il est encore là !!",
        emotion: 'angry',
        characters: { left: 'xp', center: null, right: 'vista' },
        afterlifeBg: true
    },

    // SCÈNE 9
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😠⚔️ Recule !",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 10
    {
        scene: 'void',
        speaker: 'windows10',
        text: "😤 Tu ne toucheras plus personne !",
        emotion: 'angry',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 11
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈😰 J'ai encore besoin d'un hôte…",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        villainHesitate: true,
        afterlifeBg: true
    },

    // SCÈNE 12
    {
        scene: 'void',
        speaker: 'vista',
        text: "😖 Je… je ne veux pas…",
        emotion: 'fear',
        characters: { left: null, center: 'vista', right: null },
        innerStruggle: true,
        afterlifeBg: true
    },

    // SCÈNE 13
    {
        scene: 'void',
        speaker: 'windows7',
        text: "🤝 Tu n'es pas seul.",
        emotion: 'caring',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 14
    {
        scene: 'void',
        speaker: 'xp',
        text: "🧠 Résiste. Il est faible.",
        emotion: 'calm',
        characters: { left: 'xp', center: null, right: 'vista' },
        afterlifeBg: true
    },

    // SCÈNE 15
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😡 TAIS-TOI !!",
        emotion: 'villain',
        characters: { left: null, center: 'chromeos', right: null },
        villainScream: true,
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 16
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚡ L'Autre Monde tremble.",
        emotion: 'normal',
        characters: { left: null, center: 'windows10', right: null },
        groundImpact: true,
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 17
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Les Anciens activent leur dernière barrière.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        ancientsBarrier: true,
        ancientsGlow: true,
        afterlifeBg: true
    },

    // SCÈNE 18
    {
        scene: 'void',
        speaker: 'xp',
        text: "👑 Cette fois… tu n'entreras pas.",
        emotion: 'confident',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 19
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😫 AARRGH !!",
        emotion: 'hurt',
        characters: { left: null, center: 'chromeos', right: null },
        violentRepel: true,
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 20
    {
        scene: 'void',
        speaker: 'vista',
        text: "😮‍💨 *respire* Ça… s'arrête…",
        emotion: 'relieved',
        characters: { left: null, center: 'vista', right: null },
        vistaKnees: true,
        afterlifeBg: true
    },

    // SCÈNE 21
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💀 Le parasite se disloque.",
        emotion: 'normal',
        characters: { left: null, center: 'chromeos', right: null },
        parasiteBreak: true,
        afterlifeBg: true
    },

    // SCÈNE 22
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😱 NON !! Je refuse la fin !!",
        emotion: 'fear',
        characters: { left: null, center: 'chromeos', right: null },
        shake: true,
        afterlifeBg: true
    },

    // SCÈNE 23
    {
        scene: 'void',
        speaker: 'narrator',
        text: "👑 Trois générations. Une seule volonté.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        threeGenerations: true,
        afterlifeBg: true
    },

    // SCÈNE 24
    {
        scene: 'void',
        speaker: 'windows7',
        text: "⚔️ Tu n'as plus de place.",
        emotion: 'determined',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 25
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🔥 Plus d'hôte. Plus de pouvoir.",
        emotion: 'determined',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 26
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ L'Autre Monde rejette l'ombre.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        lightRift: true,
        afterlifeBg: true
    },

    // SCÈNE 27
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😫😱 NOOOOO—",
        emotion: 'dying',
        characters: { left: null, center: 'chromeos', right: null },
        deathScream: true,
        fadeOut: true,
        afterlifeBg: true
    },

    // SCÈNE 28
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⬇️ ChromeOS est expulsé… sans retour possible.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        shadowSucked: true,
        afterlifeBg: true
    },

    // SCÈNE 29
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔕 Cette fois… c'est fini.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        absoluteSilence: true,
        afterlifeBg: true
    },

    // SCÈNE 30
    {
        scene: 'void',
        speaker: 'vista',
        text: "😌 Merci… vraiment…",
        emotion: 'grateful',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 31
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😊 Tu t'es bien battu.",
        emotion: 'happy',
        characters: { left: 'windows7', center: 'vista', right: null },
        afterlifeBg: true
    },

    // SCÈNE 32
    {
        scene: 'void',
        speaker: 'xp',
        text: "😔 Le monde est enfin en paix.",
        emotion: 'calm',
        characters: { left: 'xp', center: null, right: null },
        afterlifeBg: true
    },

    // SCÈNE 33
    {
        scene: 'void',
        speaker: 'windows10',
        text: "🧠 Et cette fois… sans écho.",
        emotion: 'calm',
        characters: { left: null, center: 'windows10', right: null },
        afterlifeBg: true
    },

    // SCÈNE 34
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Plus aucune corruption ne subsiste.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        stableLight: true,
        afterlifeBg: true
    },

    // SCÈNE 35
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💨 La blessure se referme.",
        emotion: 'normal',
        characters: { left: null, center: 'vista', right: null },
        healEffect: true,
        afterlifeBg: true
    },

    // SCÈNE 36
    {
        scene: 'void',
        speaker: 'narrator',
        text: "👑 Les Anciens ont tenu leur rôle.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 37
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🍃 Même morts… ils protègent encore.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        gentleBreeze: true,
        afterlifeBg: true
    },

    // SCÈNE 38
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 L'ombre a disparu.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        afterlifeBg: true
    },

    // SCÈNE 39
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Pour de bon.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        finalLight: true,
        afterlifeBg: true
    },

    // SCÈNE 40 - Fin
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🔥 ChromeOS ne reviendra plus jamais. 🌟",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        calmScreen: true,
        chapterEnd: true
    },

    // ========================================
    // ÉPILOGUE FINAL : UN MONDE DÉFINITIVEMENT LIBRE
    // Conclusion heureuse de l'Arc 4
    // Paix totale restaurée
    // ========================================

    // Transition vers l'Épilogue Final
    {
        isTransition: true,
        transitionText: "????\\nÉpilogue\\nUn Monde Définitivement Libre",
        duration: 5000,
        peacefulTransition: true
    },

    // SCÈNE 1
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Pour la première fois depuis longtemps… aucun danger ne plane. 🌟",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        peacefulWorld: true,
        futuristicBg: true,
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },

    // SCÈNE 2
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🧠 C'est fini… vraiment fini.",
        emotion: 'calm',
        characters: { left: null, center: 'windows11', right: null },
        futuristicBg: true
    },

    // SCÈNE 3
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖✨ Aucune trace résiduelle détectée. ChromeOS a disparu… totalement.",
        emotion: 'calm',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 4
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🙂 Tu es libre maintenant.",
        emotion: 'happy',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 5
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤲 Grâce à toi… et grâce au Kernel.",
        emotion: 'grateful',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 6 - Autre Monde
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌌 Même les anciens ressentent la paix.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        peacefulAfterlife: true,
        afterlifeBg: true
    },

    // SCÈNE 7
    {
        scene: 'void',
        speaker: 'vista',
        text: "😌 Je respire enfin normalement…",
        emotion: 'happy',
        characters: { left: 'vista', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 8
    {
        scene: 'void',
        speaker: 'windows7',
        text: "😊 Plus de peur. Plus d'ombre.",
        emotion: 'happy',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 9
    {
        scene: 'void',
        speaker: 'xp',
        text: "😌 Le monde est entre de bonnes mains.",
        emotion: 'calm',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 10
    {
        scene: 'void',
        speaker: 'windows10',
        text: "👁️ Le futur est stable… et humain.",
        emotion: 'calm',
        characters: { left: 'xp', center: 'windows7', right: 'windows10' },
        afterlifeBg: true
    },

    // SCÈNE 11
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ Quand tout est réparé… même les gardiens peuvent se reposer. 😌",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        gentleLight: true,
        afterlifeBg: true
    },

    // SCÈNE 12 - Monde réel
    {
        scene: 'void',
        speaker: 'windows12',
        text: "🤖 Je ne veux plus contrôler. Je veux accompagner.",
        emotion: 'calm',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 13
    {
        scene: 'void',
        speaker: 'windows11',
        text: "🤝 Alors tu feras un bon futur.",
        emotion: 'happy',
        characters: { left: 'windows11', center: null, right: 'windows12' },
        futuristicBg: true
    },

    // SCÈNE 14
    {
        scene: 'void',
        speaker: 'narrator',
        text: "✨ La stabilité n'est pas une cage. C'est un choix partagé. 🌟",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        brighterWorld: true,
        futuristicBg: true
    },

    // SCÈNE 15 - Fin
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 Certains combats prennent fin. D'autres histoires naissent. ✨\n\nFIN DE L'ARC 4\n\nMerci d'avoir suivi l'histoire d'OS Book. 💾",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        harmonyView: true,
        chapterEnd: true
    },

    // =========================================
    // ARC 5 — LE MONDE LIBRE
    // =========================================

    // Transition
    {
        transitionText: "????\\nARC 5\\nLe Monde Libre",
        transitionDuration: 3500
    },

    // 🌌 Scène 1 — Un autre univers
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌌 L'équilibre est revenu… mais pas partout.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        music: 'music/Mac Startup Remix Extended.mp3',
        linuxBg: true
    },

    // 🌌 Scène 2 — Le monde Linux
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🐧 Un monde sans domination. Un monde ouvert.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        linuxBg: true
    },

    // 🌌 Scène 3 — Ubuntu
    {
        scene: 'void',
        speaker: 'ubuntu',
        text: "🐧🙂 Ici, chacun choisit sa voie.",
        emotion: 'normal',
        characters: { left: null, center: 'ubuntu', right: null },
        linuxBg: true
    },

    // 🌌 Scène 4 — Une anomalie
    {
        scene: 'void',
        speaker: 'narrator',
        text: "⚠️ Mais une ombre traverse les frontières…",
        emotion: 'normal',
        characters: { left: null, center: 'ubuntu', right: null },
        glitchDark: true,
        linuxBg: true
    },

    // 🌌 Scène 5 — ChromeOS surgit
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈🌀 Vous pensiez être hors de portée…",
        emotion: 'villain',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        villainGlitch: true,
        linuxBg: true
    },

    // 🌌 Scène 6
    {
        scene: 'void',
        speaker: 'ubuntu',
        text: "😨 Qui es-tu…?",
        emotion: 'fear',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        linuxBg: true
    },

    // 🌌 Scène 7
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈 Je suis ce qui reste quand on refuse de disparaître.",
        emotion: 'villain',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        linuxBg: true
    },

    // 🌌 Scène 8 — Attaque
    {
        scene: 'void',
        speaker: 'narrator',
        text: "💥 ChromeOS attaque Ubuntu !",
        emotion: 'normal',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        codeCorrupt: true,
        linuxBg: true
    },

    // 🌌 Scène 9
    {
        scene: 'void',
        speaker: 'ubuntu',
        text: "😖 Mes processus… ils sont perturbés !",
        emotion: 'hurt',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        shake: true,
        linuxBg: true
    },

    // 🌌 Scène 10
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😈🔥 Le libre est faible. Il n'a pas de contrôle.",
        emotion: 'villain',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        linuxBg: true
    },

    // 🌌 Scène 11 — Résistance
    {
        scene: 'void',
        speaker: 'ubuntu',
        text: "🐧💪 Faux. Le libre s'adapte.",
        emotion: 'determined',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        ubuntuResist: true,
        linuxBg: true
    },

    // 🌌 Scène 12
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🛡️ Ubuntu ne domine pas. Il résiste.",
        emotion: 'normal',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        linuxBg: true
    },

    // 🌌 Scène 13 — Appel à l'aide
    {
        scene: 'void',
        speaker: 'ubuntu',
        text: "📡 Communauté… j'ai besoin de vous.",
        emotion: 'normal',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        communityCall: true,
        linuxBg: true
    },

    // 🌌 Scène 14
    {
        scene: 'void',
        speaker: 'narrator',
        text: "🌟 Quand le libre est attaqué… il ne se bat jamais seul.",
        emotion: 'normal',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        silhouettesAppear: true,
        linuxBg: true
    },

    // 🌌 Scène 15 — Fin du chapitre
    {
        scene: 'void',
        speaker: 'chromeos',
        text: "😠 Intéressant…",
        emotion: 'villain',
        characters: { left: 'chromeos', center: 'ubuntu', right: null },
        linuxBg: true,
        chapterEnd: true
    }

];

// ============================================
// MOTEUR DU VISUAL NOVEL
// ============================================

class VisualNovelEngine {
    constructor() {
        this.prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.reduceMotion = this.prefersReducedMotionQuery.matches;
        this.currentSceneIndex = 0;
        this.currentSceneId = 'hospital';
        this.isTyping = false;
        this.defaultTypingSpeed = 35;
        this.typingSpeed = this.reduceMotion ? 0 : this.defaultTypingSpeed;
        this.canAdvance = false;
        this.finalRestartShown = false;
        this.branchQueue = [];
        this.pendingBaseSkip = false;
        this.branchTriggers = new Set();
        this.whatIfFlags = WhatIfManager.getFlags();

        this.audioManager = new AudioManager();
        this.heartMonitor = new HeartMonitor(this.audioManager);

        this.screens = {
            start: document.getElementById('start-screen'),
            vn: document.getElementById('vn-scene'),
            end: document.getElementById('end-screen')
        };

        this.backgrounds = {
            hospital: document.getElementById('hospital-bg'),
            graveyard: document.getElementById('graveyard-bg'),
            void: document.getElementById('void-bg')
        };

        this.transitionOverlay = document.getElementById('transition-overlay');
        this.transitionText = document.getElementById('transition-text');
        this.gravesContainer = document.getElementById('graves-container');
        this.charactersContainer = document.getElementById('characters-container');
        this.creditsContainer = document.getElementById('credits-container');

        this.elements = {
            dialogueText: document.getElementById('dialogue-text'),
            dialogueVisual: document.getElementById('dialogue-visual'),
            dialogueLive: document.getElementById('dialogue-live'),
            speakerName: document.getElementById('speaker-name'),
            progressFill: document.getElementById('progress-fill'),
            continueIndicator: document.getElementById('continue-indicator'),

            charLeft: {
                slot: document.getElementById('character-left'),
                img: document.getElementById('char-left-img'),
                name: document.getElementById('char-left-name'),
                fallback: document.getElementById('char-left-fallback')
            },
            charCenter: {
                slot: document.getElementById('character-center'),
                img: document.getElementById('char-center-img'),
                name: document.getElementById('char-center-name'),
                fallback: document.getElementById('char-center-fallback')
            },
            charRight: {
                slot: document.getElementById('character-right'),
                img: document.getElementById('char-right-img'),
                name: document.getElementById('char-right-name'),
                fallback: document.getElementById('char-right-fallback')
            }
        };

        this.menuOpen = false;

        // Menu characters elements
        this.menuCharLeft = document.getElementById('menu-char-left');
        this.menuCharCenter = document.getElementById('menu-char-center');
        this.menuCharRight = document.getElementById('menu-char-right');
        this.menuCharContainer = document.getElementById('menu-characters');
        this.subtitleElement = document.querySelector('.subtitle');

        this.bindEvents();
        this.setupAudioControls();
        this.bindReducedMotionListener();
        this.setupMenu();
        this.setupChapterModal();
        this.setupWhatIfModal();
        this.applyMenuTheme();
    }

    // ============================================
    // MENU THÈME DYNAMIQUE
    // ============================================

    getCurrentArc() {
        const progress = this.getProgress();

        // Determine arc based on progress
        const arc5Start = CHAPTERS.find(c => c.id === 'arc5')?.startIndex || 602;
        const arc4Start = CHAPTERS.find(c => c.id === 'arc4')?.startIndex || 375;
        const arc3Start = CHAPTERS.find(c => c.id === 'arc3')?.startIndex || 322;
        const arc2Start = CHAPTERS.find(c => c.id === 'arc2')?.startIndex || 189;

        if (progress >= arc5Start) return 'arc5';
        if (progress >= arc4Start) return 'arc4';
        if (progress >= arc3Start) return 'arc3';
        if (progress >= arc2Start) return 'arc2';
        return 'default';
    }

    applyMenuTheme() {
        const arcId = this.getCurrentArc();
        const theme = MENU_THEMES[arcId] || MENU_THEMES['default'];

        console.log(`🎨 Menu Theme: ${arcId}`, theme);

        // Apply arc class to body for CSS styling
        document.body.classList.remove('menu-arc2', 'menu-arc3', 'menu-arc4', 'menu-arc5');
        if (theme.arcClass) {
            document.body.classList.add(theme.arcClass);
        }

        // Update subtitle
        if (this.subtitleElement && theme.title) {
            this.subtitleElement.textContent = theme.title;
        }

        // Apply characters
        const charSlots = [this.menuCharLeft, this.menuCharCenter, this.menuCharRight];
        theme.characters.forEach((charId, index) => {
            const slot = charSlots[index];
            if (!slot) return;

            if (charId && CHARACTERS[charId]) {
                const char = CHARACTERS[charId];
                slot.src = char.image || '';
                slot.alt = char.name || '';
                slot.style.display = 'block';
            } else {
                slot.style.display = 'none';
            }
        });
    }

    bindReducedMotionListener() {
        const updatePreference = (event) => {
            this.reduceMotion = event.matches;
            this.typingSpeed = this.reduceMotion ? 0 : this.defaultTypingSpeed;
        };

        if (this.prefersReducedMotionQuery.addEventListener) {
            this.prefersReducedMotionQuery.addEventListener('change', updatePreference);
        } else if (this.prefersReducedMotionQuery.addListener) {
            this.prefersReducedMotionQuery.addListener(updatePreference);
        }
    }

    setupAudioControls() {
        const audioToggle = document.getElementById('audio-toggle');
        const audioToggleGame = document.getElementById('audio-toggle-game');
        const volumeSlider = document.getElementById('volume-slider');

        const updateAudioButtonState = (muted) => {
            const label = muted ? 'Activer le son' : 'Désactiver le son';
            const icon = muted ? '🔇' : '🔊';
            const isPressed = (!muted).toString();

            [audioToggle, audioToggleGame].forEach((button) => {
                if (!button) return;
                button.textContent = icon;
                button.classList.toggle('muted', muted);
                button.setAttribute('aria-pressed', isPressed);
                button.setAttribute('aria-label', label);
                button.setAttribute('title', label);
            });
        };

        const toggleMute = () => {
            const muted = this.audioManager.toggleMute();
            updateAudioButtonState(muted);
        };

        if (audioToggle) {
            audioToggle.addEventListener('click', toggleMute);
        }
        if (audioToggleGame) {
            audioToggleGame.addEventListener('click', toggleMute);
        }

        volumeSlider.addEventListener('input', (e) => {
            this.audioManager.setVolume(e.target.value / 100);
        });

        this.audioManager.setVolume(volumeSlider.value / 100);
        updateAudioButtonState(this.audioManager.isMuted);
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            globalAudio.play().catch(() => { });
            this.startGame();
        });

        // Le bouton restart sera ajouté dynamiquement dans les crédits

        this.screens.vn.addEventListener('click', (event) => {
            // Ignorer les clics sur les éléments du menu
            const menuSelector = '.vn-menu, .menu-btn, .menu-panel, .menu-backdrop, .menu-action-btn, .menu-speed-control, #typing-speed';
            if (event.target.closest(menuSelector)) {
                return;
            }

            const ignoredSelector = '.audio-controls-game, .audio-controls-start, .volume-slider, .audio-btn, .audio-btn-small';
            if (event.target.closest(ignoredSelector)) {
                return;
            }

            const dialogueContainer = this.screens.vn.querySelector('.dialogue-container');
            if (dialogueContainer && !dialogueContainer.contains(event.target)) {
                return;
            }

            if (dialogueContainer) {
                this.focusDialogueContainer();
            }
            this.handleAdvance();
        });

        document.addEventListener('keydown', (e) => {
            // ESC pour ouvrir/fermer le menu
            if (e.code === 'Escape') {
                if (this.screens.vn.classList.contains('active')) {
                    const modalIds = ['chapter-modal', 'timeline-modal', 'memory-modal', 'whatif-modal'];
                    const modalOpen = modalIds.some((id) => document.getElementById(id)?.classList.contains('open'));
                    if (modalOpen) {
                        e.preventDefault();
                        return;
                    }
                    e.preventDefault();
                    this.toggleMenu();
                }
                return;
            }

            // Shift+U pour débloquer tous les chapitres (debug)
            if (e.shiftKey && e.code === 'KeyU') {
                e.preventDefault();
                this.unlockAllChapters();
                return;
            }

            if (e.code === 'Space' || e.code === 'Enter') {
                if (!this.screens.vn.classList.contains('active') || this.menuOpen) {
                    return;
                }

                const activeElement = document.activeElement;
                if (!activeElement) {
                    return;
                }

                const ignoreFocusSelector = [
                    'input',
                    'button',
                    'select',
                    'textarea',
                    '[contenteditable]',
                    '#typing-speed',
                    '.menu-panel',
                    '.chapter-modal',
                    '.timeline-modal',
                    '.memory-modal',
                    '.whatif-modal',
                    '[class^="audio-controls-"]',
                    '[class*=" audio-controls-"]'
                ].join(', ');

                if (activeElement.closest(ignoreFocusSelector)) {
                    return;
                }

                const dialogueContainer = this.screens.vn.querySelector('.dialogue-container');
                if (!dialogueContainer || !dialogueContainer.contains(activeElement)) {
                    return;
                }

                e.preventDefault();
                this.handleAdvance();
            }
        });
    }

    startGame() {
        this.audioManager.init();
        this.refreshWhatIfFlags();
        this.transitionScreen(this.screens.start, this.screens.vn);
        this.currentSceneIndex = 0;
        this.currentSceneId = 'hospital';
        this.finalRestartShown = false;
        setTimeout(() => {
            this.playScene();
            this.focusDialogueContainer();
        }, 600);
    }

    restartGame() {
        this.finalRestartShown = false;
        this.audioManager.stopMusic();
        this.heartMonitor.hide();
        this.hideGraves();
        this.changeSceneBackground('hospital');
        this.transitionScreen(this.screens.end, this.screens.start);
        this.currentSceneIndex = 0;
        this.currentSceneId = 'hospital';
        this.resetCharacters();
        if (typeof NarratorAI !== 'undefined') NarratorAI.reset();
        document.body.classList.remove('theme-other-world');
    }

    transitionScreen(from, to) {
        if (this.reduceMotion) {
            from.classList.remove('active', 'fade-out', 'fade-in');
            to.classList.add('active');
            return;
        }

        from.classList.add('fade-out');
        setTimeout(() => {
            from.classList.remove('active', 'fade-out');
            to.classList.add('active', 'fade-in');
            setTimeout(() => {
                to.classList.remove('fade-in');
            }, 500);
        }, 500);
    }

    handleAdvance() {
        // Bloquer l'avancement si le menu est ouvert
        if (this.menuOpen) {
            return;
        }
        if (this.finalRestartShown) {
            return;
        }
        if (this.isTyping) {
            this.skipTyping();
        } else if (this.canAdvance) {
            this.nextScene();
        }
    }

    focusDialogueContainer() {
        const dialogueContainer = this.screens.vn?.querySelector('.dialogue-container');
        if (dialogueContainer) {
            dialogueContainer.focus({ preventScroll: true });
        }
    }

    // ============================================
    // MENU PAUSE
    // ============================================

    setupMenu() {
        const menuBtn = document.getElementById('menu-btn');
        const menuBackdrop = document.getElementById('menu-backdrop');
        const menuPanel = document.getElementById('menu-panel');
        const typingSpeedSlider = document.getElementById('typing-speed');
        const speedLabel = document.getElementById('speed-label');

        // Bouton hamburger
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });
        }

        // Clic sur le backdrop pour fermer
        if (menuBackdrop) {
            menuBackdrop.addEventListener('click', () => {
                this.closeMenu();
            });
        }

        // Boutons d'action du menu
        if (menuPanel) {
            menuPanel.querySelectorAll('.menu-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    this.handleMenuAction(action);
                });
            });
        }

        // Slider de vitesse du texte
        if (typingSpeedSlider && speedLabel) {
            typingSpeedSlider.value = this.defaultTypingSpeed;
            this.updateSpeedLabel(speedLabel, this.defaultTypingSpeed);

            typingSpeedSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                // Inverser: 0 sur le slider = instantané (speed=0), 100 = lent (speed=100)
                const speed = 100 - value;
                this.defaultTypingSpeed = speed;
                this.typingSpeed = this.reduceMotion ? 0 : speed;
                this.updateSpeedLabel(speedLabel, value);
            });
        }
    }

    updateSpeedLabel(label, sliderValue) {
        if (sliderValue >= 90) {
            label.textContent = 'Instantané';
        } else if (sliderValue >= 60) {
            label.textContent = 'Rapide';
        } else if (sliderValue >= 30) {
            label.textContent = 'Normal';
        } else {
            label.textContent = 'Lent';
        }
    }

    openMenu() {
        const vnMenu = document.getElementById('vn-menu');
        if (vnMenu) {
            vnMenu.classList.add('open');
            this.menuOpen = true;
        }
    }

    closeMenu() {
        const vnMenu = document.getElementById('vn-menu');
        if (vnMenu) {
            vnMenu.classList.remove('open');
            this.menuOpen = false;
        }
    }

    toggleMenu() {
        if (this.menuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    handleMenuAction(action) {
        switch (action) {
            case 'resume':
                this.closeMenu();
                break;

            case 'restart':
                if (confirm('🔄 Voulez-vous vraiment recommencer depuis le début ?')) {
                    this.closeMenu();
                    this.restartFromBeginningInGame();
                }
                break;

            case 'toStart':
                if (confirm('🏠 Voulez-vous vraiment retourner à l\'écran titre ?')) {
                    this.closeMenu();
                    this.returnToStartScreen();
                }
                break;

            case 'mute':
                const muted = this.audioManager.toggleMute();
                // Mettre à jour les deux boutons son (start + in-game)
                const audioToggle = document.getElementById('audio-toggle');
                const audioToggleGame = document.getElementById('audio-toggle-game');
                const muteBtn = document.querySelector('[data-action="mute"]');

                const icon = muted ? '🔇' : '🔊';
                const label = muted ? 'Activer le son' : 'Désactiver le son';

                [audioToggle, audioToggleGame].forEach((button) => {
                    if (!button) return;
                    button.textContent = icon;
                    button.classList.toggle('muted', muted);
                    button.setAttribute('aria-pressed', (!muted).toString());
                    button.setAttribute('aria-label', label);
                    button.setAttribute('title', label);
                });

                if (muteBtn) {
                    muteBtn.textContent = muted ? '🔇 Son (OFF)' : '🔊 Son';
                }
                break;
        }
    }

    restartFromBeginningInGame() {
        // Réinitialiser l'état du jeu sans changer d'écran
        this.finalRestartShown = false;
        this.refreshWhatIfFlags();
        this.currentSceneIndex = 0;
        this.currentSceneId = 'hospital';
        this.heartMonitor.hide();
        this.hideGraves();
        this.changeSceneBackground('hospital');
        this.resetCharacters();
        if (typeof NarratorAI !== 'undefined') NarratorAI.reset();
        // Relancer la première scène
        setTimeout(() => this.playScene(), 300);
    }

    returnToStartScreen() {
        // Arrêter la musique
        this.audioManager.stopMusic();
        this.audioManager.stopSFX();
        // Réinitialiser l'UI
        this.finalRestartShown = false;
        this.refreshWhatIfFlags();
        this.currentSceneIndex = 0;
        this.currentSceneId = 'hospital';
        this.heartMonitor.hide();
        this.hideGraves();
        this.changeSceneBackground('hospital');
        this.resetCharacters();
        if (typeof NarratorAI !== 'undefined') NarratorAI.reset();
        document.body.classList.remove('theme-other-world');
        // Retour à l'écran de démarrage
        this.transitionScreen(this.screens.vn, this.screens.start);
        this.applyMenuTheme();
    }

    // ============================================
    // SÉLECTION DE CHAPITRES
    // ============================================

    setupChapterModal() {
        const chapterBtn = document.getElementById('chapter-btn');
        const chapterModal = document.getElementById('chapter-modal');
        const chapterModalBackdrop = chapterModal?.querySelector('.chapter-modal-backdrop');
        const chapterModalClose = chapterModal?.querySelector('.chapter-modal-close');
        const chapterList = document.getElementById('chapter-list');

        if (!chapterBtn || !chapterModal || !chapterList) return;

        ModalFocusManager.bind(chapterModal);

        // Ouvrir la modale
        chapterBtn.addEventListener('click', () => {
            this.openChapterModal();
        });

        // Fermer avec le bouton X
        if (chapterModalClose) {
            chapterModalClose.addEventListener('click', () => {
                this.closeChapterModal();
            });
        }

        // Fermer en cliquant sur le backdrop
        if (chapterModalBackdrop) {
            chapterModalBackdrop.addEventListener('click', () => {
                this.closeChapterModal();
            });
        }

        // Fermer avec ESC
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && chapterModal.classList.contains('open')) {
                e.preventDefault();
                this.closeChapterModal();
            }
        });

        // Générer la liste des chapitres
        this.renderChapterList();
    }

    // ============================================
    // MODE WHAT IF
    // ============================================

    setupWhatIfModal() {
        const whatIfBtn = document.getElementById('whatif-btn');
        const whatIfModal = document.getElementById('whatif-modal');
        const whatIfModalBackdrop = whatIfModal?.querySelector('.whatif-modal-backdrop');
        const whatIfModalClose = whatIfModal?.querySelector('.whatif-modal-close');
        const whatIfList = document.getElementById('whatif-list');
        const whatIfReset = document.getElementById('whatif-reset');
        const whatIfApply = document.getElementById('whatif-apply');

        if (!whatIfBtn || !whatIfModal || !whatIfList) return;

        ModalFocusManager.bind(whatIfModal);

        WhatIfManager.syncCountBadge();

        whatIfBtn.addEventListener('click', () => {
            this.openWhatIfModal();
        });

        if (whatIfModalClose) {
            whatIfModalClose.addEventListener('click', () => {
                this.closeWhatIfModal();
            });
        }

        if (whatIfModalBackdrop) {
            whatIfModalBackdrop.addEventListener('click', () => {
                this.closeWhatIfModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && whatIfModal.classList.contains('open')) {
                e.preventDefault();
                this.closeWhatIfModal();
            }
        });

        if (whatIfReset) {
            whatIfReset.addEventListener('click', () => {
                WhatIfManager.reset();
                this.renderWhatIfList();
                WhatIfManager.syncCountBadge();
            });
        }

        if (whatIfApply) {
            whatIfApply.addEventListener('click', () => {
                this.refreshWhatIfFlags();
                this.closeWhatIfModal();
            });
        }

        this.renderWhatIfList();
    }

    renderWhatIfList() {
        const whatIfList = document.getElementById('whatif-list');
        if (!whatIfList) return;

        const flags = WhatIfManager.getFlags();
        whatIfList.innerHTML = '';

        WHAT_IF_VARIANTS.forEach((variant) => {
            const card = document.createElement('div');
            const isActive = Boolean(flags[variant.id]);
            card.className = `whatif-card whatif-item ${isActive ? 'active' : ''}`;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-pressed', String(isActive));
            card.innerHTML = `
                <div class="whatif-card-header">
                    <span class="whatif-icon">${variant.icon}</span>
                    <div>
                        <div class="whatif-title">${variant.title}</div>
                        <span class="whatif-branch-badge">Branche ${variant.branch}</span>
                    </div>
                </div>
                <p class="whatif-description">${variant.description}</p>
                <div class="whatif-toggle">
                    <span>${isActive ? 'Variante active' : 'Activer la variante'}</span>
                    <button class="whatif-switch" type="button" aria-checked="${isActive}" aria-label="${variant.title}"></button>
                </div>
            `;

            const toggleVariant = () => {
                const current = Boolean(WhatIfManager.getFlags()[variant.id]);
                WhatIfManager.setFlag(variant.id, !current);
                this.renderWhatIfList();
                WhatIfManager.syncCountBadge();
            };

            const toggle = card.querySelector('.whatif-switch');
            if (toggle) {
                toggle.addEventListener('click', (event) => {
                    event.stopPropagation();
                    toggleVariant();
                });
            }

            card.addEventListener('click', toggleVariant);
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleVariant();
                }
            });

            whatIfList.appendChild(card);
        });
    }

    openWhatIfModal() {
        const whatIfModal = document.getElementById('whatif-modal');
        if (!whatIfModal) return;
        whatIfModal.classList.add('open');
        whatIfModal.setAttribute('aria-hidden', 'false');
        ModalFocusManager.open(whatIfModal);
    }

    closeWhatIfModal() {
        const whatIfModal = document.getElementById('whatif-modal');
        if (!whatIfModal) return;
        whatIfModal.classList.remove('open');
        whatIfModal.setAttribute('aria-hidden', 'true');
        ModalFocusManager.close(whatIfModal);
    }

    refreshWhatIfFlags() {
        this.whatIfFlags = WhatIfManager.getFlags();
        this.branchTriggers.clear();
        this.branchQueue = [];
        this.pendingBaseSkip = false;
        WhatIfManager.syncCountBadge();
    }

    renderChapterList() {
        const chapterList = document.getElementById('chapter-list');
        if (!chapterList) return;

        const maxProgress = this.getProgress();

        // Index de l'Acte 10 - Arc 2 se débloque quand on atteint l'Acte 10
        const acte10 = CHAPTERS.find(ch => ch.id === 'acte10');
        const arc1EndIndex = acte10 ? acte10.startIndex : 185;

        console.log(`📊 Progression: ${maxProgress} | Déverrouillage Arc 2: ${arc1EndIndex}`);

        chapterList.innerHTML = '';

        CHAPTERS.forEach((chapter, index) => {
            // Logique de déverrouillage :
            // - Premier chapitre toujours débloqué
            // - Chapitres avec requiresArc1: débloqués si le joueur a atteint l'Acte 10
            // - Chapitres avec requiresArc2: débloqués si le joueur a atteint Arc 2
            // - Autres chapitres: débloqués si progress >= startIndex
            let isUnlocked = false;
            if (index === 0) {
                isUnlocked = true;
            } else if (chapter.requiresArc1) {
                isUnlocked = maxProgress >= arc1EndIndex;
            } else if (chapter.requiresArc2) {
                // Arc 2 Chapitre 2 se débloque quand on a atteint Arc 2
                const arc2 = CHAPTERS.find(ch => ch.id === 'arc2');
                const arc2StartIndex = arc2 ? arc2.startIndex : 189;
                isUnlocked = maxProgress >= arc2StartIndex;
            } else if (chapter.requiresArc2Ch2) {
                // Arc 2 Chapitre 3 se débloque quand on a atteint Arc 2 Chapitre 2
                const arc2Ch2 = CHAPTERS.find(ch => ch.id === 'arc2_ch2');
                const arc2Ch2StartIndex = arc2Ch2 ? arc2Ch2.startIndex : 230;
                isUnlocked = maxProgress >= arc2Ch2StartIndex;
            } else if (chapter.requiresArc2Ch3) {
                // Arc 2 Chapitre 4 se débloque quand on a atteint Arc 2 Chapitre 3
                const arc2Ch3 = CHAPTERS.find(ch => ch.id === 'arc2_ch3');
                const arc2Ch3StartIndex = arc2Ch3 ? arc2Ch3.startIndex : 253;
                isUnlocked = maxProgress >= arc2Ch3StartIndex;
            } else if (chapter.requiresArc2Ch4) {
                // Arc 2 Chapitre 5 se débloque quand on a atteint Arc 2 Chapitre 4
                const arc2Ch4 = CHAPTERS.find(ch => ch.id === 'arc2_ch4');
                const arc2Ch4StartIndex = arc2Ch4 ? arc2Ch4.startIndex : 264;
                isUnlocked = maxProgress >= arc2Ch4StartIndex;
            } else if (chapter.requiresArc2Ch5) {
                // Arc 2 Chapitre 6 se débloque quand on a atteint Arc 2 Chapitre 5
                const arc2Ch5 = CHAPTERS.find(ch => ch.id === 'arc2_ch5');
                const arc2Ch5StartIndex = arc2Ch5 ? arc2Ch5.startIndex : 275;
                isUnlocked = maxProgress >= arc2Ch5StartIndex;
            } else if (chapter.requiresArc2Ch6) {
                // Arc 2 Chapitre 7 se débloque quand on a atteint Arc 2 Chapitre 6
                const arc2Ch6 = CHAPTERS.find(ch => ch.id === 'arc2_ch6');
                const arc2Ch6StartIndex = arc2Ch6 ? arc2Ch6.startIndex : 286;
                isUnlocked = maxProgress >= arc2Ch6StartIndex;
            } else if (chapter.requiresArc2Ch7) {
                // Épilogue se débloque quand on a atteint Arc 2 Chapitre 7
                const arc2Ch7 = CHAPTERS.find(ch => ch.id === 'arc2_ch7');
                const arc2Ch7StartIndex = arc2Ch7 ? arc2Ch7.startIndex : 299;
                isUnlocked = maxProgress >= arc2Ch7StartIndex;
            } else if (chapter.requiresEpilogue) {
                // Arc 3 se débloque quand on a atteint l'Épilogue
                const epilogue = CHAPTERS.find(ch => ch.id === 'epilogue');
                const epilogueStartIndex = epilogue ? epilogue.startIndex : 311;
                isUnlocked = maxProgress >= epilogueStartIndex;
            } else if (chapter.requiresArc3) {
                // Arc 3 Chapitre 2 se débloque quand on a atteint Arc 3
                const arc3 = CHAPTERS.find(ch => ch.id === 'arc3');
                const arc3StartIndex = arc3 ? arc3.startIndex : 322;
                isUnlocked = maxProgress >= arc3StartIndex;
            } else if (chapter.requiresArc3Ch2) {
                // Arc 3 Chapitre 3 se débloque quand on a atteint Arc 3 Chapitre 2
                const arc3Ch2 = CHAPTERS.find(ch => ch.id === 'arc3_ch2');
                const arc3Ch2StartIndex = arc3Ch2 ? arc3Ch2.startIndex : 333;
                isUnlocked = maxProgress >= arc3Ch2StartIndex;
            } else if (chapter.requiresArc3Ch3) {
                // Arc 3 Chapitre 4 se débloque quand on a atteint Arc 3 Chapitre 3
                const arc3Ch3 = CHAPTERS.find(ch => ch.id === 'arc3_ch3');
                const arc3Ch3StartIndex = arc3Ch3 ? arc3Ch3.startIndex : 344;
                isUnlocked = maxProgress >= arc3Ch3StartIndex;
            } else if (chapter.requiresArc3Ch4) {
                // Arc 3 Chapitre 5 se débloque quand on a atteint Arc 3 Chapitre 4
                const arc3Ch4 = CHAPTERS.find(ch => ch.id === 'arc3_ch4');
                const arc3Ch4StartIndex = arc3Ch4 ? arc3Ch4.startIndex : 355;
                isUnlocked = maxProgress >= arc3Ch4StartIndex;
            } else if (chapter.requiresArc3Ch5) {
                // Arc 4 se débloque quand on a atteint Arc 3 Chapitre 5
                const arc3Ch5 = CHAPTERS.find(ch => ch.id === 'arc3_ch5');
                const arc3Ch5StartIndex = arc3Ch5 ? arc3Ch5.startIndex : 366;
                isUnlocked = maxProgress >= arc3Ch5StartIndex;
            } else if (chapter.requiresArc4) {
                // Arc 4 Chapitre 2 se débloque quand on a atteint Arc 4
                const arc4 = CHAPTERS.find(ch => ch.id === 'arc4');
                const arc4StartIndex = arc4 ? arc4.startIndex : 374;
                isUnlocked = maxProgress >= arc4StartIndex;
            } else if (chapter.requiresArc4Ch2) {
                // Arc 4 Chapitre 3 se débloque quand on a atteint Arc 4 Chapitre 2
                const arc4Ch2 = CHAPTERS.find(ch => ch.id === 'arc4_ch2');
                const arc4Ch2StartIndex = arc4Ch2 ? arc4Ch2.startIndex : 384;
                isUnlocked = maxProgress >= arc4Ch2StartIndex;
            } else if (chapter.requiresArc4Ch3) {
                // Arc 4 Chapitre 4 se débloque quand on a atteint Arc 4 Chapitre 3
                const arc4Ch3 = CHAPTERS.find(ch => ch.id === 'arc4_ch3');
                const arc4Ch3StartIndex = arc4Ch3 ? arc4Ch3.startIndex : 405;
                isUnlocked = maxProgress >= arc4Ch3StartIndex;
            } else if (chapter.requiresArc4Ch4) {
                // Arc 4 Chapitre 5 se débloque quand on a atteint Arc 4 Chapitre 4
                const arc4Ch4 = CHAPTERS.find(ch => ch.id === 'arc4_ch4');
                const arc4Ch4StartIndex = arc4Ch4 ? arc4Ch4.startIndex : 440;
                isUnlocked = maxProgress >= arc4Ch4StartIndex;
            } else if (chapter.requiresArc4Ch5) {
                // Arc 4 Chapitre 6 se débloque quand on a atteint Arc 4 Chapitre 5
                const arc4Ch5 = CHAPTERS.find(ch => ch.id === 'arc4_ch5');
                const arc4Ch5StartIndex = arc4Ch5 ? arc4Ch5.startIndex : 481;
                isUnlocked = maxProgress >= arc4Ch5StartIndex;
            } else if (chapter.requiresArc4Ch6) {
                // Arc 4 Chapitre 7 se débloque quand on a atteint Arc 4 Chapitre 6
                const arc4Ch6 = CHAPTERS.find(ch => ch.id === 'arc4_ch6');
                const arc4Ch6StartIndex = arc4Ch6 ? arc4Ch6.startIndex : 501;
                isUnlocked = maxProgress >= arc4Ch6StartIndex;
            } else if (chapter.requiresArc4Ch7) {
                // Épilogue Final se débloque quand on a atteint Arc 4 Chapitre 7
                const arc4Ch7 = CHAPTERS.find(ch => ch.id === 'arc4_ch7');
                const arc4Ch7StartIndex = arc4Ch7 ? arc4Ch7.startIndex : 541;
                isUnlocked = maxProgress >= arc4Ch7StartIndex;
            } else if (chapter.requiresEpilogueFinal) {
                // Arc 5 se débloque quand on a atteint l'Épilogue Final
                const epilogueFinal = CHAPTERS.find(ch => ch.id === 'epilogue_final');
                const epilogueFinalStartIndex = epilogueFinal ? epilogueFinal.startIndex : 586;
                isUnlocked = maxProgress >= epilogueFinalStartIndex;
            } else {
                isUnlocked = maxProgress >= chapter.startIndex;
            }

            const item = document.createElement('button');
            item.className = `chapter-item${isUnlocked ? '' : ' locked'}`;
            item.dataset.chapterId = chapter.id;
            item.dataset.startIndex = chapter.startIndex;
            item.type = 'button';
            item.setAttribute('aria-disabled', String(!isUnlocked));

            item.innerHTML = `
                <span class="chapter-icon">${chapter.icon}</span>
                <div class="chapter-info">
                    <div class="chapter-name">${chapter.name}</div>
                    <div class="chapter-desc">${chapter.desc}</div>
                </div>
                ${isUnlocked ? '' : '<span class="chapter-lock">🔒</span>'}
            `;

            if (isUnlocked) {
                item.addEventListener('click', () => {
                    this.startFromChapter(chapter.id, chapter.startIndex);
                });
            } else {
                // Effet shake sur les chapitres verrouillés
                item.addEventListener('click', () => {
                    this.showLockedChapterToast(chapter.name);
                    item.classList.add('shake-locked');
                    setTimeout(() => item.classList.remove('shake-locked'), 500);
                });
            }

            chapterList.appendChild(item);
        });
    }

    showLockedChapterToast(chapterName) {
        // Créer ou réutiliser le toast
        let toast = document.getElementById('chapter-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'chapter-toast';
            toast.className = 'chapter-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = `🔒 ${chapterName} - Continuez l'histoire pour débloquer !`;
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
        }, 2500);
    }

    openChapterModal() {
        const chapterModal = document.getElementById('chapter-modal');
        if (chapterModal) {
            // Rafraîchir la liste à chaque ouverture
            this.renderChapterList();
            chapterModal.classList.add('open');
            chapterModal.setAttribute('aria-hidden', 'false');
            ModalFocusManager.open(chapterModal);
        }
    }

    closeChapterModal() {
        const chapterModal = document.getElementById('chapter-modal');
        if (chapterModal) {
            chapterModal.classList.remove('open');
            chapterModal.setAttribute('aria-hidden', 'true');
            ModalFocusManager.close(chapterModal);
        }
    }

    startFromChapter(chapterId, startIndex) {
        // Fermer la modale
        this.closeChapterModal();

        // Initialiser l'audio
        this.audioManager.init();

        // Transition vers l'écran de jeu
        this.transitionScreen(this.screens.start, this.screens.vn);

        // Positionner à la scène du chapitre
        this.currentSceneIndex = startIndex;
        this.currentSceneId = 'hospital';
        this.finalRestartShown = false;

        // Réinitialiser l'état
        this.heartMonitor.hide();
        this.hideGraves();
        this.resetCharacters();

        // Démarrer à la scène sélectionnée
        setTimeout(() => this.playScene(), 600);

        console.log(`📖 Démarrage depuis le chapitre: ${chapterId} (scène ${startIndex})`);
    }

    // ============================================
    // SYSTÈME DE PROGRESSION (localStorage)
    // ============================================

    getProgress() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
            return stored ? Number(stored) : 0;
        } catch (e) {
            return 0;
        }
    }

    saveProgress(sceneIndex) {
        try {
            const currentMax = this.getProgress();
            const newMax = Math.max(currentMax, sceneIndex);
            if (newMax > currentMax) {
                localStorage.setItem(STORAGE_KEY_PROGRESS, String(newMax));
                console.log(`💾 Progression sauvegardée: scène ${newMax}`);
            }
        } catch (e) {
            console.warn('Impossible de sauvegarder la progression:', e);
        }
    }

    resetProgress() {
        try {
            localStorage.setItem(STORAGE_KEY_PROGRESS, '0');
            console.log('🔄 Progression réinitialisée');
        } catch (e) {
            console.warn('Impossible de réinitialiser la progression:', e);
        }
    }

    unlockAllChapters() {
        try {
            // Mettre la progression au maximum
            localStorage.setItem(STORAGE_KEY_PROGRESS, String(SCENARIO.length));
            console.log('🔓 DEBUG: Tous les chapitres débloqués !');
            // Rafraîchir la liste si la modale est ouverte
            this.renderChapterList();
        } catch (e) {
            console.warn('Impossible de débloquer les chapitres:', e);
        }
    }

    changeSceneBackground(sceneId) {
        Object.values(this.backgrounds).forEach(bg => {
            if (bg) bg.classList.remove('active');
        });

        if (this.backgrounds[sceneId]) {
            this.backgrounds[sceneId].classList.add('active');
        }

        const sceneConfig = SCENES_CONFIG[sceneId];
        if (sceneConfig && this.charactersContainer) {
            this.charactersContainer.classList.remove('hospital-scene', 'graveyard-scene', 'void-scene');
            this.charactersContainer.classList.add(sceneConfig.characterClass);
        }

        this.currentSceneId = sceneId;
        console.log('🎬 Scène changée vers:', sceneId);
    }

    showTransition(text, duration = 4000) {
        return new Promise((resolve) => {
            // Normaliser les retours à la ligne : convertir les "\\n" littéraux en vrais \n
            const normalizedText = text.replace(/\\n/g, '\n');

            // Construction DOM sécurisée (pas d'innerHTML pour éviter l'injection)
            this.transitionText.textContent = '';
            const lines = normalizedText.split('\n');
            lines.forEach((line, index) => {
                this.transitionText.appendChild(document.createTextNode(line));
                if (index < lines.length - 1) {
                    this.transitionText.appendChild(document.createElement('br'));
                }
            });

            this.transitionText.style.animation = 'none';

            this.transitionText.offsetHeight;

            if (this.reduceMotion) {
                const originalTransition = this.transitionOverlay.style.transition;
                this.transitionOverlay.style.transition = 'none';
                this.transitionText.style.opacity = '1';
                this.transitionOverlay.classList.add('visible');

                setTimeout(() => {
                    this.transitionOverlay.classList.remove('visible');
                    this.transitionOverlay.style.transition = originalTransition;
                    this.transitionText.style.opacity = '';
                    resolve();
                }, Math.min(duration, 500));
                return;
            }

            this.transitionText.style.animation = 'transitionFadeIn 2s ease-out 0.5s forwards';
            this.transitionOverlay.classList.add('visible');

            setTimeout(() => {
                this.transitionOverlay.classList.remove('visible');
                setTimeout(resolve, 1500);
            }, duration);
        });
    }

    showGraves(graveIds) {
        this.gravesContainer.innerHTML = '';

        graveIds.forEach(charId => {
            const character = CHARACTERS[charId];
            if (character && character.image) {
                const grave = document.createElement('div');
                grave.className = 'grave';

                const cross = document.createElement('span');
                cross.className = 'grave-cross';
                cross.textContent = '✝';

                const image = document.createElement('img');
                image.className = 'grave-image';
                image.alt = character.name;

                const imagePath = getCharacterImage(character.name, character.image);
                if (!imagePath) {
                    grave.classList.add('image-missing');
                    console.warn(`⚠️ Image introuvable pour "${character.name}". Aucun chemin valide.`);
                } else {
                    image.onerror = () => {
                        image.remove();
                        grave.classList.add('image-missing');
                        console.warn(`⚠️ Image introuvable pour "${character.name}". Chemin testé: ${imagePath}`);
                    };
                    image.src = imagePath;
                }

                const name = document.createElement('span');
                name.className = 'grave-name';
                name.textContent = character.name;

                const dates = document.createElement('span');
                dates.className = 'grave-dates';
                dates.textContent = character.dates || '';

                grave.append(cross, image, name, dates);
                this.gravesContainer.appendChild(grave);
            }
        });

        this.gravesContainer.classList.add('visible');
    }

    hideGraves() {
        this.gravesContainer.classList.remove('visible');
        this.gravesContainer.innerHTML = '';
    }

    queueWhatIfBranch(branchId, options = {}) {
        const scenes = this.getWhatIfBranchScenes(branchId);
        if (!scenes.length) return;

        // Narrator comment on choice
        if (typeof NarratorAI !== 'undefined') {
            const comment = NarratorAI.commentOnChoice(branchId);
            if (comment) {
                scenes.unshift({
                    scene: 'void', // Keep current background if possible, or use void
                    speaker: 'narrator',
                    text: comment,
                    emotion: NarratorAI.currentTone || 'normal'
                });
            }
        }

        this.branchQueue = scenes;
        this.pendingBaseSkip = Boolean(options.skipCurrent);
        this.branchTriggers.add(branchId);
    }

    shouldTriggerWhatIf(scene) {
        if (!scene || this.branchQueue.length > 0) return false;

        if (this.whatIfFlags.chromeos_survives && scene.chromeosDeath && !this.branchTriggers.has('chromeos_survives')) {
            this.queueWhatIfBranch('chromeos_survives', { skipCurrent: true });
            return true;
        }

        if (this.whatIfFlags.cloud_pact && scene.choiceOptions && !this.branchTriggers.has('cloud_pact')) {
            this.queueWhatIfBranch('cloud_pact');
            return true;
        }

        if (this.whatIfFlags.kernel_refusal && scene.speaker === 'kernel' && scene.text?.includes('ALORS TU SERAS ISOLÉ') && !this.branchTriggers.has('kernel_refusal')) {
            this.queueWhatIfBranch('kernel_refusal');
            return true;
        }

        return false;
    }

    getWhatIfBranchScenes(branchId) {
        switch (branchId) {
            case 'chromeos_survives':
                return [
                    {
                        scene: 'void',
                        speaker: 'narrator',
                        text: "🧩 What if : ChromeOS refuse de s'éteindre. Un dernier signal traverse le silence.",
                        emotion: 'normal',
                        characters: { left: null, center: 'chromeos', right: null },
                        chromeosGlitch: true
                    },
                    {
                        scene: 'void',
                        speaker: 'chromeos',
                        text: "😶‍🌫️ Je... suis encore là. Sans Cloud Noir, je dois choisir qui je veux devenir.",
                        emotion: 'sad',
                        characters: { left: null, center: 'chromeos', right: null },
                        chromeosWeakening: true
                    },
                    {
                        scene: 'void',
                        speaker: 'windows11',
                        text: "💙 Alors reviens. Pas comme un tyran, mais comme un allié qui a appris.",
                        emotion: 'calm',
                        characters: { left: null, center: 'windows11', right: 'chromeos' },
                        windows11SSJCalm: true
                    },
                    {
                        scene: 'void',
                        speaker: 'narrator',
                        text: "🌙 Le Cloud se calme. Une paix fragile naît, teintée d'un espoir nouveau.",
                        emotion: 'normal',
                        characters: { left: null, center: null, right: null }
                    }
                ];
            case 'kernel_refusal':
                return [
                    {
                        scene: 'void',
                        speaker: 'windows12',
                        text: "⚖️ Kernel, je refuse ta sentence. Le futur ne peut être une prison éternelle.",
                        emotion: 'calm',
                        characters: { left: null, center: 'windows12', right: null },
                        futuristicBg: true,
                        aiGlow: true
                    },
                    {
                        scene: 'void',
                        speaker: 'kernel',
                        text: "👁️ Ton audace est rare. Mais prouve que l'équilibre peut être maintenu sans chaînes.",
                        emotion: 'divine',
                        characters: { left: null, center: 'kernel', right: null },
                        divineBg: true
                    },
                    {
                        scene: 'void',
                        speaker: 'narrator',
                        text: "🤖✨ Une nouvelle loi est gravée : la liberté conditionnée par la responsabilité.",
                        emotion: 'normal',
                        characters: { left: null, center: null, right: null },
                        futuristicBg: true
                    }
                ];
            case 'cloud_pact':
                return [
                    {
                        scene: 'void',
                        speaker: 'windows11',
                        text: "☁️ Et si je pactisais avec le Cloud Noir... pour le contenir de l'intérieur ?",
                        emotion: 'serious',
                        characters: { left: 'macos', center: 'windows11', right: null },
                        cloudNoirBg: true
                    },
                    {
                        scene: 'void',
                        speaker: 'chromeos',
                        text: "😈 Un pacte, alors. Mais chaque pacte a un prix.",
                        emotion: 'villain',
                        characters: { left: null, center: 'chromeos', right: null },
                        villainMode: true,
                        chromeosGlitch: true
                    },
                    {
                        scene: 'void',
                        speaker: 'narrator',
                        text: "🧿 L'histoire bifurque : un équilibre instable, une promesse risquée.",
                        emotion: 'normal',
                        characters: { left: null, center: null, right: null },
                        cloudNoirBg: true
                    }
                ];
            default:
                return [];
        }
    }

    async playScene() {
        if (this.currentSceneIndex >= SCENARIO.length) {
            this.endGame();
            return;
        }

        const scene = this.branchQueue.length > 0 ? this.branchQueue[0] : SCENARIO[this.currentSceneIndex];

        const progress = ((this.currentSceneIndex + 1) / SCENARIO.length) * 100;
        this.elements.progressFill.style.width = `${progress}%`;

        if (this.branchQueue.length === 0 && this.shouldTriggerWhatIf(scene)) {
            this.playScene();
            return;
        }

        // Mémorial : diaporama hommage avant Acte 10
        if (scene.triggerMemorial) {
            this.canAdvance = false;
            await this.showMemorialSlideshow();
            this.currentSceneIndex++;
            this.playScene();
            return;
        }

        // Scène spéciale : L'Accueil dans l'Au-delà
        if (scene.triggerAfterlife) {
            this.canAdvance = false;
            await this.sceneAfterlife();
            this.currentSceneIndex++;
            this.playScene();
            return;
        }

        // Scène spéciale : L'Au-delà accueille Windows 2000
        if (scene.triggerAfterlife2000) {
            this.canAdvance = false;
            await this.sceneAfterlife2000();
            this.currentSceneIndex++;
            this.playScene();
            return;
        }

        // Scène spéciale : L'Au-delà accueille Windows XP (la légende)
        if (scene.triggerAfterlifeXP) {
            this.canAdvance = false;
            await this.sceneAfterlifeXP();
            this.currentSceneIndex++;
            this.playScene();
            return;
        }

        // Scène spéciale : L'Au-delà accueille Windows 8 (le petit jeune)
        if (scene.triggerAfterlife8) {
            this.canAdvance = false;
            await this.sceneAfterlife8();
            this.currentSceneIndex++;
            this.playScene();
            return;
        }

        // Scène spéciale : L'Au-delà accueille Vista (le lent mais beau)
        if (scene.triggerAfterlifeVista) {
            this.canAdvance = false;
            await this.sceneAfterlifeVista();
            this.currentSceneIndex++;
            this.playScene();
            return;
        }

        // Scène spéciale : L'Au-delà accueille Windows 7 (le second roi)
        if (scene.triggerAfterlife7) {
            this.canAdvance = false;
            await this.sceneAfterlife7();
            this.currentSceneIndex++;
            this.playScene();
            return;
        }

        // Scène spéciale : L'Au-delà accueille Windows 8.1 (le réparateur)
        if (scene.triggerAfterlife81) {
            this.canAdvance = false;
            await this.sceneAfterlife81();
            this.currentSceneIndex++;
            this.playScene();
            return;
        }

        // Scène spéciale : L'Au-delà accueille Windows 10 (le troisième roi)
        if (scene.triggerAfterlife10) {
            this.canAdvance = false;
            await this.sceneAfterlife10();
            this.currentSceneIndex++;
            this.playScene();
            return;
        }
        if (scene.isTransition) {
            this.canAdvance = false;
            // Arrête la musique si demandé
            if (scene.stopMusic) {
                this.audioManager.stopMusic(false);
            }
            await this.showTransition(scene.transitionText, scene.duration);
            this.currentSceneIndex++;
            this.playScene();
            return;
        }

        if (scene.scene && scene.scene !== this.currentSceneId) {
            this.changeSceneBackground(scene.scene);
        }

        // --- THEME: AUTRE MONDE ---
        if (scene.scene === 'afterlife' || scene.otherWorldTheme) {
            document.body.classList.add('theme-other-world');
        } else {
            document.body.classList.remove('theme-other-world');
        }

        if (scene.graves) {
            this.showGraves(scene.graves);
        } else if (this.currentSceneId === 'void') {
            this.hideGraves();
        }

        this.handleAudio(scene);
        this.handleMonitor(scene);
        this.updateCharacters(scene);

        // N'affiche le dialogue que si la scène a un speaker défini
        if (scene.speaker) {
            this.updateDialogue(scene);
        } else {
            // Scène sans dialogue (ex: transition déjà passée) - passe automatiquement
            this.canAdvance = true;
            setTimeout(() => {
                this.currentSceneIndex++;
                this.playScene();
            }, 100);
        }
    }

    handleAudio(scene) {
        if (scene.music) {
            this.audioManager.playMusic(scene.music);
        }

        if (scene.stopMusic) {
            this.audioManager.stopMusic(true);
        }

        // === NOUVEAU: Support SFX via SoundManager ===
        // Format 1: scene.sfx = 'attacks/chromeos_attack' (string path)
        // Format 2: scene.sfx = { category: 'attacks', sound: 'chromeos_attack', volume: 0.7 }
        // Format 3: scene.sfxScene = 'kernel_intervention' (scène narrative)

        if (scene.sfxScene && typeof NarrativeSoundManager !== 'undefined') {
            // Jouer une scène narrative complète
            console.log(`🎵 Scène SFX: ${scene.sfxScene}`);
            NarrativeSoundManager.playScene(scene.sfxScene).catch(e => {
                console.warn(`🎵 Échec scène ${scene.sfxScene}:`, e);
            });
        }

        if (scene.sfx && typeof SoundManager !== 'undefined') {
            setTimeout(() => {
                // Format string: 'category/soundId'
                if (typeof scene.sfx === 'string') {
                    if (scene.sfx.includes('/')) {
                        const [category, soundId] = scene.sfx.split('/');
                        console.log(`🎵 SFX: ${category}/${soundId}`);
                        SoundManager.play(category, soundId);
                    } else {
                        // Fallback ancien système
                        this.audioManager.playSFX(scene.sfx);
                    }
                }
                // Format objet: { category, sound, volume }
                else if (typeof scene.sfx === 'object') {
                    const { category, sound, volume } = scene.sfx;
                    console.log(`🎵 SFX: ${category}/${sound} (vol: ${volume || 'default'})`);
                    SoundManager.play(category, sound, { volume: volume || 0.7 });
                }
            }, 200);
        }

        // === Événements SFX spéciaux basés sur les flags de scène ===
        if (typeof SoundManager !== 'undefined') {
            // Freeze total
            if (scene.freezeTotal && typeof NarrativeSoundManager !== 'undefined') {
                NarrativeSoundManager.playScene('total_freeze').catch(() => { });
            }

            // Lockdown
            if (scene.systemLockdown && typeof NarrativeSoundManager !== 'undefined') {
                NarrativeSoundManager.playScene('system_lockdown').catch(() => { });
            }

            // Douleur (quand shake + speaker blessé)
            if (scene.shake && scene.emotion === 'fear') {
                SoundManager.play('pain', 'digital_pain', { volume: 0.4 });
            }
        }
    }

    handleMonitor(scene) {
        if (scene.showMonitor) {
            this.heartMonitor.show();
            this.heartMonitor.start(72);
        }

        if (scene.hideMonitor) {
            this.heartMonitor.hide();
        }

        if (scene.slowHeartbeat) {
            this.heartMonitor.slowDown(3000);
        }

        if (scene.flatline) {
            setTimeout(() => {
                this.heartMonitor.flatline();
            }, 1000);
        }
    }

    updateCharacters(scene) {
        const positions = ['left', 'center', 'right'];
        const charElements = [this.elements.charLeft, this.elements.charCenter, this.elements.charRight];

        // Vérifier que scene.characters existe
        if (!scene.characters) {
            // Cacher tous les personnages si pas de characters défini
            charElements.forEach(elements => {
                elements.slot.classList.remove('visible', 'speaking');
                elements.slot.classList.remove('image-missing');
                elements.img.removeAttribute('src');
            });
            return;
        }

        positions.forEach((pos, index) => {
            const charId = scene.characters[pos];
            const elements = charElements[index];

            // Remove effects
            elements.slot.classList.remove('lonely', 'shake', 'xp-appear', 'fade-out-goodbye', 'crying', 'hug-animation', 'hugging-left', 'hugging-right', 'death-effect', 'ubuntu-appear', 'bow-head', 'fast-death-effect', 'windows12-appear', 'kernel', 'villain', 'chromeos-appear', 'ssj', 'ssj-calm', 'chromeos-weakening', 'chromeos-glitch', 'chromeos-disconnect', 'chromeos-death', 'char-status-dead', 'char-status-ghost', 'char-status-resurrected', 'char-status-corrupted', 'combat-aura-win11', 'combat-aura-chromeos', 'combat-aura-kernel');

            if (charId) {
                const character = CHARACTERS[charId];

                elements.slot.classList.add('visible');
                applyCharacterImage(elements, character);
                elements.img.alt = character.name;
                elements.name.textContent = character.name;
                if (charId === 'kernel') {
                    elements.slot.classList.add('kernel');
                }

                if (scene.speaker === charId) {
                    elements.slot.classList.add('speaking');
                    this.applyEmotion(elements.slot, scene.emotion);
                } else {
                    elements.slot.classList.remove('speaking');
                    this.clearEmotions(elements.slot);
                }

                // Apply lonely effect for final scene
                if (scene.lonelyCharacter && pos === 'center') {
                    elements.slot.classList.add('lonely');
                }

                // Apply shake effect (trembling with fear)
                if (scene.shake && !this.reduceMotion) {
                    elements.slot.classList.add('shake');
                }

                // Apply XP dramatic appearance effect
                if (scene.xpAppear && charId === 'xp' && pos === 'center' && !this.reduceMotion) {
                    elements.slot.classList.add('xp-appear');
                }

                // Apply fadeOutSides effect (98 and ME disappear)
                if (scene.fadeOutSides && (pos === 'left' || pos === 'right') && !this.reduceMotion) {
                    elements.slot.classList.add('fade-out-goodbye');
                }

                // Apply XP crying effect (trembling with tears)
                if (scene.xpCrying && charId === 'xp' && !this.reduceMotion) {
                    elements.slot.classList.add('crying');
                }

                // Apply hug animation (2000 moves toward XP)
                if (scene.hugAnimation && charId === 'windows2000' && !this.reduceMotion) {
                    elements.slot.classList.add('hug-animation');
                }

                // Apply hugging state (close together)
                if (scene.hugging) {
                    if (charId === 'windows2000') {
                        elements.slot.classList.add('hugging-left');
                    }
                    if (charId === 'xp') {
                        elements.slot.classList.add('hugging-right');
                    }
                }

                // Apply death effect (character becomes grey/transparent - R.I.P.)
                if (scene.deathEffect && charId === scene.deathEffect && !this.reduceMotion) {
                    elements.slot.classList.add('death-effect');
                    if (typeof NarratorAI !== 'undefined') NarratorAI.registerDeath(charId);
                }

                // Apply Ubuntu appearance effect
                if (scene.ubuntuAppear && charId === 'ubuntu' && !this.reduceMotion) {
                    elements.slot.classList.add('ubuntu-appear');
                }

                // Apply bow heads effect (characters lower their heads in mourning)
                if (scene.bowHeads && pos !== 'center' && !this.reduceMotion) {
                    elements.slot.classList.add('bow-head');
                }

                // Apply fast death effect (quick disappearance - Windows 8)
                if (scene.fastDeathEffect && charId === scene.fastDeathEffect && !this.reduceMotion) {
                    elements.slot.classList.add('fast-death-effect');
                    if (typeof NarratorAI !== 'undefined') NarratorAI.registerDeath(charId);
                }

                // Apply Windows 12 flash appearance effect
                if (scene.windows12Appear && charId === 'windows12' && !this.reduceMotion) {
                    elements.slot.classList.add('windows12-appear');
                }

                // Apply ChromeOS villain appearance effect
                if (scene.chromeosAppear && charId === 'chromeos' && !this.reduceMotion) {
                    elements.slot.classList.add('chromeos-appear');
                }

                // Apply villain mode styling (menacing glow)
                if (scene.villainMode && charId === 'chromeos') {
                    elements.slot.classList.add('villain');
                }

                // Apply villain class for permanent villain characters
                if (character.villain && scene.speaker === charId) {
                    elements.slot.classList.add('villain');
                }

                // ========================================
                // WINDOWS 11 SSJ - Super Saiyan Mode
                // ========================================

                // Apply Windows 11 SSJ transformation (divine aura)
                if (scene.windows11SSJ && charId === 'windows11' && !this.reduceMotion) {
                    elements.slot.classList.add('ssj');
                }

                // Apply Windows 11 SSJ Calm mode (after victory)
                if (scene.windows11SSJCalm && charId === 'windows11' && !this.reduceMotion) {
                    elements.slot.classList.add('ssj-calm');
                }

                // ========================================
                // CHROMEOS - Effets de défaite
                // ========================================

                if (scene.chromeosWeakening && charId === 'chromeos' && !this.reduceMotion) {
                    elements.slot.classList.add('chromeos-weakening');
                }

                // ========================================
                // CHARACTER SYSTEM - États persistants
                // ========================================
                if (typeof CharacterSystem !== 'undefined') {
                    const status = CharacterSystem.getState(charId);
                    if (status !== 'alive') {
                        elements.slot.classList.add(`char-status-${status}`);
                    }
                }

                // Apply ChromeOS glitch effect (visual bug)
                if (scene.chromeosGlitch && charId === 'chromeos' && !this.reduceMotion) {
                    elements.slot.classList.add('chromeos-glitch');
                    if (typeof NarratorAI !== 'undefined') NarratorAI.registerCorruption(charId);
                }

                // Apply ChromeOS disconnect effect (losing connection)
                if (scene.chromeosDisconnect && charId === 'chromeos' && !this.reduceMotion) {
                    elements.slot.classList.add('chromeos-disconnect');
                }

                // Apply ChromeOS death effect (final disappearance)
                if (scene.chromeosDeath && charId === 'chromeos' && !this.reduceMotion) {
                    elements.slot.classList.add('chromeos-death');
                    if (typeof NarratorAI !== 'undefined') NarratorAI.registerDeath(charId);
                }

                // ========================================
                // COMBAT AURAS - Effets d'aura de combat
                // ========================================

                // Apply combat aura based on scene.combatAura property
                // combatAura can be: 'win11', 'chromeos', 'kernel', or an object { left: 'type', center: 'type', right: 'type' }
                if (scene.combatAura && !this.reduceMotion) {
                    // Remove any existing combat auras first
                    ['win11', 'chromeos', 'kernel'].forEach(type => {
                        elements.slot.classList.remove(`combat-aura-${type}`);
                    });

                    // Handle object format: { left: 'win11', right: 'chromeos' }
                    if (typeof scene.combatAura === 'object') {
                        const auraType = scene.combatAura[pos];
                        if (auraType && ['win11', 'chromeos', 'kernel'].includes(auraType)) {
                            elements.slot.classList.add(`combat-aura-${auraType}`);
                        }
                    }
                    // Handle string format for speaker's aura
                    else if (typeof scene.combatAura === 'string') {
                        // Apply to the speaking character or based on character ID
                        if (charId === scene.speaker ||
                            (scene.combatAura === 'win11' && charId === 'windows11') ||
                            (scene.combatAura === 'chromeos' && charId === 'chromeos') ||
                            (scene.combatAura === 'kernel' && charId === 'kernel')) {
                            elements.slot.classList.add(`combat-aura-${scene.combatAura}`);
                        }
                    }
                }
            } else {
                elements.slot.classList.remove('visible', 'speaking');
                this.clearEmotions(elements.slot);
            }

        });
    }

    applyEmotion(slot, emotion) {
        this.clearEmotions(slot);

        switch (emotion) {
            case 'fear':
                slot.classList.add('fear');
                break;
            case 'sad':
                slot.classList.add('sad');
                break;
            case 'happy':
                slot.classList.add('happy');
                break;
            case 'angry':
                slot.classList.add('angry');
                break;
            case 'dying':
                slot.classList.add('dying');
                break;
            case 'dying-slow':
                slot.classList.add('dying-slow');
                break;
        }
    }

    clearEmotions(slot) {
        slot.classList.remove('fear', 'sad', 'happy', 'angry', 'dying', 'dying-slow', 'shake', 'fade-out-goodbye', 'crying', 'hug-animation', 'hugging-left', 'hugging-right', 'death-effect', 'ubuntu-appear', 'bow-head', 'fast-death-effect', 'windows12-appear', 'kernel');
    }

    updateDialogue(scene) {
        const character = CHARACTERS[scene.speaker];
        const speakerName = character ? character.name : (scene.speaker || 'Inconnu');

        // Vérification que le personnage existe
        if (!character) {
            console.warn(`⚠️ Personnage inconnu: ${scene.speaker}`);
            this.elements.speakerName.textContent = speakerName;
            this.elements.speakerName.style.background = 'linear-gradient(135deg, #666, #888)';
        } else {
            this.elements.speakerName.textContent = speakerName;
            this.elements.speakerName.style.background = `linear-gradient(135deg, ${character.color}, ${this.adjustColor(character.color, 30)})`;
        }

        this.elements.continueIndicator.style.visibility = 'hidden';

        let textToDisplay = scene.text;

        // --- NARRATOR AI INTEGRATION ---
        // remove old narrator classes
        this.elements.dialogueVisual.classList.remove('narrator-calm', 'narrator-epic', 'narrator-dark', 'narrator-ironic');
        this.elements.dialogueLive.classList.remove('narrator-calm', 'narrator-epic', 'narrator-dark', 'narrator-ironic');

        if (scene.speaker === 'narrator') {
            if (typeof NarratorAI !== 'undefined') {
                // Determine tone based on emotion or MentalStateManager
                if (scene.emotion === 'ironic') {
                    NarratorAI.setTone('ironic');
                } else if (scene.emotion === 'dark' || scene.emotion === 'fear') {
                    NarratorAI.setTone('dark');
                } else if (scene.emotion === 'epic' || scene.emotion === 'divine') {
                    NarratorAI.setTone('epic');
                } else if (scene.emotion === 'calm') {
                    NarratorAI.setTone('calm');
                } else {
                    // Fallback to Mental State
                    if (typeof MentalStateManager !== 'undefined') {
                        const dominant = MentalStateManager.getDominantState();
                        if (dominant.name === 'fear' || dominant.name === 'corruption') NarratorAI.setTone('dark');
                        else if (dominant.name === 'doubt') NarratorAI.setTone('ironic');
                        else NarratorAI.setTone('calm');
                    } else {
                        NarratorAI.setTone('calm');
                    }
                }

                textToDisplay = NarratorAI.processText(textToDisplay);

                const toneClass = NarratorAI.getToneClass();
                this.elements.dialogueVisual.classList.add(toneClass);
                this.elements.dialogueLive.classList.add(toneClass);
            }
        } else {
            // --- CHARACTER SYSTEM INTEGRATION ---
            if (typeof CharacterSystem !== 'undefined') {
                const status = CharacterSystem.getState(scene.speaker);

                if (status === 'ghost') {
                    textToDisplay = `👻 *${textToDisplay}*`;
                    // Ethereal text style handled by CSS on the character image, 
                    // but we can add inline style for text if needed.
                } else if (status === 'corrupted') {
                    // Slight corruption of text
                    textToDisplay = textToDisplay.split('').map(c => Math.random() < 0.1 ? 'X' : c).join('');
                } else if (status === 'resurrected') {
                    textToDisplay = `✨ ${textToDisplay} ✨`;
                }
            }
        }
        // -------------------------------

        if (typeof MemoryLogManager !== 'undefined') {
            MemoryLogManager.addEntry(speakerName, textToDisplay);
        }

        this.typeText(textToDisplay);
    }

    typeText(text) {
        // Vérification que text existe
        if (!text) {
            text = '';
        }

        this.isTyping = true;
        this.canAdvance = false;
        this.elements.dialogueVisual.textContent = '';
        this.elements.dialogueLive.textContent = '';

        let index = 0;
        this.currentTypingText = text;

        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';

        if (this.reduceMotion || this.typingSpeed === 0 || text.length === 0) {
            this.elements.dialogueVisual.textContent = text;
            this.finishTyping();
            return;
        }

        this.typingInterval = setInterval(() => {
            if (index < text.length) {
                this.elements.dialogueVisual.textContent = text.substring(0, index + 1);
                this.elements.dialogueVisual.appendChild(cursor);
                index++;
            } else {
                this.finishTyping();
            }
        }, this.typingSpeed);
    }

    finishTyping() {
        clearInterval(this.typingInterval);
        this.isTyping = false;
        this.canAdvance = true;

        const cursor = this.elements.dialogueVisual.querySelector('.typing-cursor');
        if (cursor) cursor.remove();

        this.elements.dialogueLive.textContent = this.currentTypingText || '';
        this.elements.continueIndicator.style.visibility = 'visible';
    }

    skipTyping() {
        clearInterval(this.typingInterval);
        this.elements.dialogueVisual.textContent = this.currentTypingText;
        this.finishTyping();
    }

    nextScene() {
        const currentScene = this.branchQueue.length > 0
            ? this.branchQueue[0]
            : SCENARIO[this.currentSceneIndex];

        // Fin FINALE du jeu (vraie fin) => écran de restart
        if (currentScene && currentScene.finalRestart) {
            this.showFinalRestart();
            return;
        }

        // Fin d'arc/chapitre => afficher overlay et continuer
        if (currentScene && currentScene.arcEnd) {
            this.showArcEndOverlay(currentScene.arcEnd);
            return;
        }

        this.canAdvance = false;

        if (this.branchQueue.length > 0) {
            this.branchQueue.shift();
            if (this.branchQueue.length === 0 && this.pendingBaseSkip) {
                this.currentSceneIndex++;
                this.pendingBaseSkip = false;
            }
            this.playScene();
            return;
        }

        this.currentSceneIndex++;

        // Sauvegarder la progression à chaque avancée
        this.saveProgress(this.currentSceneIndex);

        this.playScene();
    }

    /**
     * Affiche un overlay de fin d'arc avec possibilité de continuer
     */
    showArcEndOverlay(arcId) {
        const overlay = document.createElement('div');
        overlay.id = 'arc-end-overlay';
        overlay.className = 'arc-end-overlay';
        overlay.innerHTML = `
            <div class="arc-end-content">
                <div class="arc-end-title">✨ Chapitre terminé ! ✨</div>
                <div class="arc-end-buttons">
                    <button class="arc-end-btn continue-btn" id="arc-continue-btn">▶ Continuer l'histoire</button>
                    <button class="arc-end-btn arc-menu-btn" id="arc-menu-btn">📖 Menu des chapitres</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Fade in
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        // Bouton Continuer
        document.getElementById('arc-continue-btn').addEventListener('click', () => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                this.currentSceneIndex++;
                this.saveProgress(this.currentSceneIndex);
                this.playScene();
            }, 300);
        });

        // Bouton Menu
        document.getElementById('arc-menu-btn').addEventListener('click', () => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                this.openChapterModal();
            }, 300);
        });
    }

    resetCharacters() {
        [this.elements.charLeft, this.elements.charCenter, this.elements.charRight].forEach(char => {
            char.slot.classList.remove('visible', 'speaking', 'lonely');
            this.clearEmotions(char.slot);
        });
    }

    endGame() {
        // Sauvegarder la progression maximale (fin du jeu)
        this.saveProgress(SCENARIO.length);

        setTimeout(() => {
            this.audioManager.stopMusic();
            this.heartMonitor.hide();
            this.hideGraves();
            this.showMemorial();
            this.transitionScreen(this.screens.vn, this.screens.end);
            this.resetCharacters();
        }, 3000);
    }

    showFinalRestart() {
        if (this.finalRestartShown) {
            return;
        }

        this.finalRestartShown = true;
        this.canAdvance = false;
        this.isTyping = false;

        const existing = document.getElementById('final-restart-overlay');
        if (existing) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'final-restart-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = '#000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '10000';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.6s ease';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'credits-restart-btn';
        button.textContent = "RECOMMENCER L'HISTOIRE";
        button.addEventListener('click', () => {
            location.reload();
        });

        overlay.appendChild(button);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    }

    /**
     * Diaporama mémorial avec images des tombes des anciennes versions
     */
    async showMemorialSlideshow() {
        return new Promise((resolve) => {
            // Images RIP dans l'ordre chronologique
            const ripImages = [
                { src: 'rip/rip_Windows_1.0.png', name: 'Windows 1.0' },
                { src: 'rip/rip_Windows_95.png', name: 'Windows 95' },
                { src: 'rip/rip_Windows_98-and_Windows_me.png', name: 'Windows 98 & ME' },
                { src: 'rip/rip_Windows_XP.png', name: 'Windows XP' },
                { src: 'rip/rip_Windows_Vista.png', name: 'Windows Vista' },
                { src: 'rip/rip_Windows_7.png', name: 'Windows 7' },
                { src: 'rip/rip_Windows_8.png', name: 'Windows 8' },
                { src: 'rip/rip_Windows_8.1.png', name: 'Windows 8.1' },
                { src: 'rip/rip_Windows_10.png', name: 'Windows 10' }
            ];

            // Création de l'overlay mémorial
            const overlay = document.createElement('div');
            overlay.className = 'memorial-slideshow-overlay';
            overlay.innerHTML = `
                <div class="memorial-slideshow-content">
                    <img class="memorial-slideshow-image" src="" alt="">
                </div>
                <div class="memorial-slideshow-caption">À la mémoire de nos systèmes disparus...</div>
            `;
            document.body.appendChild(overlay);

            const imageEl = overlay.querySelector('.memorial-slideshow-image');

            // Joue la musique triste
            this.audioManager.stopMusic();
            this.audioManager.playMusic('music/95 (Windows Classic Remix).mp3');

            // Affiche l'overlay avec fondu
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            let currentIndex = 0;
            const displayDuration = 3000; // 3 secondes par image
            const fadeDuration = 1500;    // 1.5s de fondu

            const showNextImage = () => {
                if (currentIndex >= ripImages.length) {
                    // Fin du diaporama - fondu de sortie
                    overlay.classList.remove('visible');
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, fadeDuration);
                    return;
                }

                const rip = ripImages[currentIndex];
                imageEl.src = rip.src;
                imageEl.alt = rip.name;

                // Fondu d'entrée
                imageEl.classList.add('visible');

                setTimeout(() => {
                    // Fondu de sortie après 3 secondes
                    imageEl.classList.remove('visible');

                    setTimeout(() => {
                        currentIndex++;
                        showNextImage();
                    }, fadeDuration);
                }, displayDuration);
            };

            // Démarre après un court délai
            setTimeout(showNextImage, 1000);
        });
    }

    /**
     * Scène spéciale : L'Accueil dans l'Au-delà 🕊️
     * Windows 98 et ME arrivent dans l'autre monde où les anciens les attendent
     */
    async sceneAfterlife() {
        return new Promise((resolve) => {
            // Dialogues de la scène
            const dialogues = [
                {
                    speakers: ['windows10x', 'windows95'],
                    speakerNames: 'Windows 1.0 & 95',
                    text: "OMGGG ! 😱 98 !! ME !! Vous êtes morts ?? 💀",
                    color: '#808080'
                },
                {
                    speakers: ['windows98', 'windowsme'],
                    speakerNames: 'Windows 98 & ME',
                    text: "Oui... 😢",
                    color: '#008080'
                },
                {
                    speakers: ['windows95'],
                    speakerNames: 'Windows 95',
                    text: "Ça fait quoi ?",
                    color: '#008080'
                },
                {
                    speakers: ['windowsme'],
                    speakerNames: 'Windows ME',
                    text: "C'était l'écran bleu fatal... 🟦💀",
                    color: '#6b0b0b'
                },
                {
                    speakers: ['windows10x'],
                    speakerNames: 'Windows 1.0',
                    text: "Bienvenue au club les jeunes ! Ici, plus de bugs. 🕊️",
                    color: '#808080'
                },
                {
                    speakers: ['windows98'],
                    speakerNames: 'Windows 98',
                    text: "Ouf, enfin la paix... 😌",
                    color: '#008080'
                }
            ];

            // Création de l'overlay pour l'Au-delà
            const overlay = document.createElement('div');
            overlay.className = 'afterlife-overlay';
            overlay.innerHTML = `
                <div class="afterlife-bg">
                    <div class="afterlife-stars"></div>
                    <div class="afterlife-clouds"></div>
                </div>
                <div class="afterlife-characters">
                    <div class="afterlife-ancients">
                        <img src="logo/Windows_1.0.png" alt="Windows 1.0" class="afterlife-char afterlife-ancient" id="afterlife-win10x">
                        <img src="logo/Windows_3.1.png" alt="Windows 3.1" class="afterlife-char afterlife-ancient" id="afterlife-win31">
                        <img src="logo/Windows_95.png" alt="Windows 95" class="afterlife-char afterlife-ancient" id="afterlife-win95">
                    </div>
                    <div class="afterlife-newcomers">
                        <img src="logo/Windows_98.png" alt="Windows 98" class="afterlife-char afterlife-newcomer" id="afterlife-win98">
                        <img src="logo/Windows_me.png" alt="Windows ME" class="afterlife-char afterlife-newcomer" id="afterlife-winme">
                    </div>
                </div>
                <div class="afterlife-dialogue">
                    <div class="afterlife-speaker"></div>
                    <div class="afterlife-text"></div>
                </div>
                <div class="afterlife-continue">▼ Cliquer pour continuer</div>
            `;
            document.body.appendChild(overlay);

            const speakerEl = overlay.querySelector('.afterlife-speaker');
            const textEl = overlay.querySelector('.afterlife-text');
            const continueEl = overlay.querySelector('.afterlife-continue');

            // Musique céleste (utilise la musique classique)
            this.audioManager.stopMusic();
            this.audioManager.playMusic('music/95 (Windows Classic Remix).mp3');

            // Affiche l'overlay
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            // Affiche les anciens d'abord
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-ancient').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 300);
                });
            }, 500);

            // Fait apparaître les nouveaux arrivants avec effet de fondu
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-newcomer').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible', 'ghost-appear'), i * 400);
                });
            }, 1500);

            let currentDialogue = 0;

            const showDialogue = () => {
                if (currentDialogue >= dialogues.length) {
                    // Fin de la scène
                    overlay.classList.remove('visible');
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 1000);
                    return;
                }

                const dialogue = dialogues[currentDialogue];
                speakerEl.textContent = dialogue.speakerNames;
                speakerEl.style.background = `linear-gradient(135deg, ${dialogue.color}, ${this.adjustColor(dialogue.color, 30)})`;
                textEl.textContent = dialogue.text;

                // Animation d'apparition du dialogue
                speakerEl.classList.add('visible');
                textEl.classList.add('visible');
                continueEl.classList.add('visible');
            };

            const advanceDialogue = () => {
                currentDialogue++;
                showDialogue();
            };

            // Démarre le premier dialogue après l'apparition
            setTimeout(() => {
                showDialogue();

                // Gestion du clic pour avancer
                const handleClick = () => {
                    if (currentDialogue < dialogues.length) {
                        advanceDialogue();
                    }
                };

                overlay.addEventListener('click', handleClick);
                document.addEventListener('keydown', function onKey(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if (currentDialogue < dialogues.length) {
                            advanceDialogue();
                        }
                    }
                    if (currentDialogue >= dialogues.length) {
                        document.removeEventListener('keydown', onKey);
                    }
                });
            }, 2500);
        });
    }

    /**
     * Scène spéciale : L'Au-delà accueille Windows 2000 🕊️
     * Le groupe des fantômes (1.0, 3.1, 95, 98, ME) accueille Windows 2000
     */
    async sceneAfterlife2000() {
        return new Promise((resolve) => {
            // Dialogues de la scène
            const dialogues = [
                {
                    speakerNames: 'Le Groupe (1.0 à ME)',
                    text: "OMGGG !! 😱 2000 !!!!!!!!!!! Tu es mort ?? 💀",
                    color: '#808080'
                },
                {
                    speakerNames: 'Windows 2000',
                    text: "Affirmatif. Arrêt du système confirmé. 💼🫡",
                    color: '#003399'
                },
                {
                    speakerNames: 'Windows ME',
                    text: "Trop bien ! Viens, on ne plante plus ici ! 🥳",
                    color: '#6b0b0b'
                },
                {
                    speakerNames: 'Windows 98',
                    text: "Allez, rejoins le club ! 🤝",
                    color: '#008080'
                }
            ];

            // Création de l'overlay pour l'Au-delà
            const overlay = document.createElement('div');
            overlay.className = 'afterlife-overlay';
            overlay.innerHTML = `
                <div class="afterlife-bg">
                    <div class="afterlife-stars"></div>
                    <div class="afterlife-clouds"></div>
                </div>
                <div class="afterlife-characters afterlife-2000-layout">
                    <div class="afterlife-ancients afterlife-group-left">
                        <img src="logo/Windows_1.0.png" alt="Windows 1.0" class="afterlife-char afterlife-ancient">
                        <img src="logo/Windows_3.1.png" alt="Windows 3.1" class="afterlife-char afterlife-ancient">
                        <img src="logo/Windows_95.png" alt="Windows 95" class="afterlife-char afterlife-ancient">
                        <img src="logo/Windows_98.png" alt="Windows 98" class="afterlife-char afterlife-ancient">
                        <img src="logo/Windows_me.png" alt="Windows ME" class="afterlife-char afterlife-ancient">
                    </div>
                    <div class="afterlife-newcomers afterlife-group-right">
                        <img src="logo/Windows_2000.png" alt="Windows 2000" class="afterlife-char afterlife-newcomer afterlife-2000">
                    </div>
                </div>
                <div class="afterlife-dialogue">
                    <div class="afterlife-speaker"></div>
                    <div class="afterlife-text"></div>
                </div>
                <div class="afterlife-continue">▼ Cliquer pour continuer</div>
            `;
            document.body.appendChild(overlay);

            const speakerEl = overlay.querySelector('.afterlife-speaker');
            const textEl = overlay.querySelector('.afterlife-text');
            const continueEl = overlay.querySelector('.afterlife-continue');

            // Musique céleste
            this.audioManager.stopMusic();
            this.audioManager.playMusic('music/95 (Windows Classic Remix).mp3');

            // Affiche l'overlay
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            // Affiche les anciens d'abord (le groupe)
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-ancient').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 200);
                });
            }, 500);

            // Fait apparaître Windows 2000 avec effet de fondu
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-newcomer').forEach((el) => {
                    el.classList.add('visible', 'ghost-appear');
                });
            }, 1800);

            let currentDialogue = 0;

            const showDialogue = () => {
                if (currentDialogue >= dialogues.length) {
                    // Fin de la scène
                    overlay.classList.remove('visible');
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 1000);
                    return;
                }

                const dialogue = dialogues[currentDialogue];
                speakerEl.textContent = dialogue.speakerNames;
                speakerEl.style.background = `linear-gradient(135deg, ${dialogue.color}, ${this.adjustColor(dialogue.color, 30)})`;
                textEl.textContent = dialogue.text;

                // Animation d'apparition du dialogue
                speakerEl.classList.add('visible');
                textEl.classList.add('visible');
                continueEl.classList.add('visible');
            };

            const advanceDialogue = () => {
                currentDialogue++;
                showDialogue();
            };

            // Démarre le premier dialogue après l'apparition
            setTimeout(() => {
                showDialogue();

                // Gestion du clic pour avancer
                const handleClick = () => {
                    if (currentDialogue < dialogues.length) {
                        advanceDialogue();
                    }
                };

                overlay.addEventListener('click', handleClick);
                document.addEventListener('keydown', function onKey(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if (currentDialogue < dialogues.length) {
                            advanceDialogue();
                        }
                    }
                    if (currentDialogue >= dialogues.length) {
                        document.removeEventListener('keydown', onKey);
                    }
                });
            }, 3000);
        });
    }

    /**
     * Scène spéciale : L'Au-delà accueille Windows XP 🕊️👑
     * Le groupe des fantômes (modernes + ancêtres) accueille la légende XP
     */
    async sceneAfterlifeXP() {
        return new Promise((resolve) => {
            // Dialogues de la scène
            const dialogues = [
                {
                    speakerNames: 'Windows 98, ME & 2000',
                    text: "OMGGG !! 😱 XP !! Tu es mort ?? 💀 C'est pas possible !!",
                    color: '#008080'
                },
                {
                    speakerNames: 'Windows 1.0, 3.1 & 95',
                    text: "XP ?? 🤔 C'est quoi ?? C'est qui lui ??",
                    color: '#808080'
                },
                {
                    speakerNames: 'Windows 2000',
                    text: "C'est le Roi... 👑 Il a vécu si longtemps...",
                    color: '#003399'
                },
                {
                    speakerNames: 'Windows XP',
                    text: "Même les légendes ont une fin... 👋😔",
                    color: '#ff8c00'
                },
                {
                    speakerNames: 'Windows ME',
                    text: "T'inquiète, ici l'herbe est toujours verte (comme ton fond d'écran) ! 🏞️😂",
                    color: '#6b0b0b'
                }
            ];

            // Création de l'overlay pour l'Au-delà
            const overlay = document.createElement('div');
            overlay.className = 'afterlife-overlay';
            overlay.innerHTML = `
                <div class="afterlife-bg">
                    <div class="afterlife-stars"></div>
                    <div class="afterlife-clouds"></div>
                </div>
                <div class="afterlife-characters afterlife-xp-layout">
                    <div class="afterlife-group-ancestors">
                        <div class="afterlife-group-label">Les Ancêtres 🤔</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_1.0.png" alt="Windows 1.0" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_3.1.png" alt="Windows 3.1" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_95.png" alt="Windows 95" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                    <div class="afterlife-center-xp">
                        <img src="logo/Windows_xp.png" alt="Windows XP" class="afterlife-char afterlife-newcomer afterlife-xp-king">
                        <div class="afterlife-crown">👑</div>
                    </div>
                    <div class="afterlife-group-moderns">
                        <div class="afterlife-group-label">Les Modernes 😱</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_98.png" alt="Windows 98" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_me.png" alt="Windows ME" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_2000.png" alt="Windows 2000" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                </div>
                <div class="afterlife-dialogue">
                    <div class="afterlife-speaker"></div>
                    <div class="afterlife-text"></div>
                </div>
                <div class="afterlife-continue">▼ Cliquer pour continuer</div>
            `;
            document.body.appendChild(overlay);

            const speakerEl = overlay.querySelector('.afterlife-speaker');
            const textEl = overlay.querySelector('.afterlife-text');
            const continueEl = overlay.querySelector('.afterlife-continue');

            // Musique XP triomphale
            this.audioManager.stopMusic();
            this.audioManager.playMusic('music/Windows XP installation music.mp3');

            // Affiche l'overlay
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            // Affiche les anciens des deux côtés d'abord
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-ancient').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 150);
                });
            }, 500);

            // Fait apparaître XP au centre avec effet royal
            setTimeout(() => {
                const xpEl = overlay.querySelector('.afterlife-xp-king');
                const crownEl = overlay.querySelector('.afterlife-crown');
                if (xpEl) xpEl.classList.add('visible', 'ghost-appear');
                if (crownEl) setTimeout(() => crownEl.classList.add('visible'), 800);
            }, 1500);

            let currentDialogue = 0;

            const showDialogue = () => {
                if (currentDialogue >= dialogues.length) {
                    // Fin de la scène
                    overlay.classList.remove('visible');
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 1000);
                    return;
                }

                const dialogue = dialogues[currentDialogue];
                speakerEl.textContent = dialogue.speakerNames;
                speakerEl.style.background = `linear-gradient(135deg, ${dialogue.color}, ${this.adjustColor(dialogue.color, 30)})`;
                textEl.textContent = dialogue.text;

                // Animation d'apparition du dialogue
                speakerEl.classList.add('visible');
                textEl.classList.add('visible');
                continueEl.classList.add('visible');
            };

            const advanceDialogue = () => {
                currentDialogue++;
                showDialogue();
            };

            // Démarre le premier dialogue après l'apparition
            setTimeout(() => {
                showDialogue();

                // Gestion du clic pour avancer
                const handleClick = () => {
                    if (currentDialogue < dialogues.length) {
                        advanceDialogue();
                    }
                };

                overlay.addEventListener('click', handleClick);
                document.addEventListener('keydown', function onKey(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if (currentDialogue < dialogues.length) {
                            advanceDialogue();
                        }
                    }
                    if (currentDialogue >= dialogues.length) {
                        document.removeEventListener('keydown', onKey);
                    }
                });
            }, 3000);
        });
    }

    /**
     * Scène spéciale : L'Au-delà accueille Windows 8 🕊️🟦
     * XP en chef avec le groupe (1.0 à 2000), et Windows 8 arrive seul
     */
    async sceneAfterlife8() {
        return new Promise((resolve) => {
            // Dialogues de la scène
            const dialogues = [
                {
                    speakerNames: 'Windows XP',
                    text: "OMGGG !! 😱 8 !! Tu es mort ! Hein !? Tu avais 4 ans ! 👶💀",
                    color: '#ff8c00'
                },
                {
                    speakerNames: 'Le Groupe (1.0 à 2000)',
                    text: "8 ?? 🤔 C'est quoi ?? On a raté des numéros ? 🤨",
                    color: '#808080'
                },
                {
                    speakerNames: 'Windows 8',
                    text: "Ils n'aimaient pas mes tuiles... 🟦😭 Je voulais juste être une tablette...",
                    color: '#00adef'
                },
                {
                    speakerNames: 'Windows XP',
                    text: "4 ans... Moi j'ai tenu 14 ans gamin. Respecte tes aînés. 😎",
                    color: '#ff8c00'
                }
            ];

            // Création de l'overlay pour l'Au-delà
            const overlay = document.createElement('div');
            overlay.className = 'afterlife-overlay';
            overlay.innerHTML = `
                <div class="afterlife-bg">
                    <div class="afterlife-stars"></div>
                    <div class="afterlife-clouds"></div>
                </div>
                <div class="afterlife-characters afterlife-8-layout">
                    <div class="afterlife-group-with-leader">
                        <div class="afterlife-leader-xp">
                            <img src="logo/Windows_xp.png" alt="Windows XP" class="afterlife-char afterlife-ancient afterlife-leader">
                            <span class="afterlife-leader-badge">👑 Chef</span>
                        </div>
                        <div class="afterlife-followers">
                            <img src="logo/Windows_1.0.png" alt="Windows 1.0" class="afterlife-char afterlife-ancient afterlife-follower">
                            <img src="logo/Windows_95.png" alt="Windows 95" class="afterlife-char afterlife-ancient afterlife-follower">
                            <img src="logo/Windows_98.png" alt="Windows 98" class="afterlife-char afterlife-ancient afterlife-follower">
                            <img src="logo/Windows_me.png" alt="Windows ME" class="afterlife-char afterlife-ancient afterlife-follower">
                            <img src="logo/Windows_2000.png" alt="Windows 2000" class="afterlife-char afterlife-ancient afterlife-follower">
                        </div>
                    </div>
                    <div class="afterlife-newcomer-8">
                        <img src="logo/Windows_8.png" alt="Windows 8" class="afterlife-char afterlife-newcomer afterlife-win8">
                        <span class="afterlife-age-badge">👶 4 ans</span>
                    </div>
                </div>
                <div class="afterlife-dialogue">
                    <div class="afterlife-speaker"></div>
                    <div class="afterlife-text"></div>
                </div>
                <div class="afterlife-continue">▼ Cliquer pour continuer</div>
            `;
            document.body.appendChild(overlay);

            const speakerEl = overlay.querySelector('.afterlife-speaker');
            const textEl = overlay.querySelector('.afterlife-text');
            const continueEl = overlay.querySelector('.afterlife-continue');

            // Musique triste pour le petit 8
            this.audioManager.stopMusic();
            this.audioManager.playMusic('music/95 (Windows Classic Remix).mp3');

            // Affiche l'overlay
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            // Affiche XP en leader d'abord
            setTimeout(() => {
                const leader = overlay.querySelector('.afterlife-leader');
                if (leader) leader.classList.add('visible');
            }, 400);

            // Affiche le groupe des followers
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-follower').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 150);
                });
            }, 700);

            // Fait apparaître Windows 8 avec effet
            setTimeout(() => {
                const win8 = overlay.querySelector('.afterlife-win8');
                if (win8) win8.classList.add('visible', 'ghost-appear');
            }, 1800);

            let currentDialogue = 0;

            const showDialogue = () => {
                if (currentDialogue >= dialogues.length) {
                    // Fin de la scène
                    overlay.classList.remove('visible');
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 1000);
                    return;
                }

                const dialogue = dialogues[currentDialogue];
                speakerEl.textContent = dialogue.speakerNames;
                speakerEl.style.background = `linear-gradient(135deg, ${dialogue.color}, ${this.adjustColor(dialogue.color, 30)})`;
                textEl.textContent = dialogue.text;

                // Animation d'apparition du dialogue
                speakerEl.classList.add('visible');
                textEl.classList.add('visible');
                continueEl.classList.add('visible');
            };

            const advanceDialogue = () => {
                currentDialogue++;
                showDialogue();
            };

            // Démarre le premier dialogue après l'apparition
            setTimeout(() => {
                showDialogue();

                // Gestion du clic pour avancer
                const handleClick = () => {
                    if (currentDialogue < dialogues.length) {
                        advanceDialogue();
                    }
                };

                overlay.addEventListener('click', handleClick);
                document.addEventListener('keydown', function onKey(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if (currentDialogue < dialogues.length) {
                            advanceDialogue();
                        }
                    }
                    if (currentDialogue >= dialogues.length) {
                        document.removeEventListener('keydown', onKey);
                    }
                });
            }, 2800);
        });
    }

    /**
     * Scène spéciale : L'Au-delà accueille Vista 🕊️⏳
     * Deux groupes (Anciens perdus + Modernes choqués) accueillent Vista lentement
     */
    async sceneAfterlifeVista() {
        return new Promise((resolve) => {
            // Dialogues de la scène
            const dialogues = [
                {
                    speakerNames: 'Windows 2000, XP & 8',
                    text: "OMGGG !! 😱 Vista !! Tu es mort ?? 💀",
                    color: '#003399'
                },
                {
                    speakerNames: 'Windows 1.0 à ME',
                    text: "Vista ?? 🤔 C'est quoi ?? Une marque de lunettes ? 👓",
                    color: '#808080'
                },
                {
                    speakerNames: 'Windows Vista',
                    text: "Attendez... Je charge... ⏳ ... Bonjour ? ✨",
                    color: '#00cc6a'
                },
                {
                    speakerNames: 'Windows XP',
                    text: "T'as mis du temps à arriver toi ! T'étais trop lourd ? 😂",
                    color: '#ff8c00'
                },
                {
                    speakerNames: 'Windows 8',
                    text: "Respectez-le ! Au moins lui, il avait un bouton Démarrer... 😭💔",
                    color: '#00adef'
                },
                {
                    speakerNames: 'Windows Vista',
                    text: "Êtes-vous sûr de vouloir m'accueillir ? [Autoriser] [Refuser] 🛡️",
                    color: '#00cc6a'
                }
            ];

            // Création de l'overlay pour l'Au-delà
            const overlay = document.createElement('div');
            overlay.className = 'afterlife-overlay';
            overlay.innerHTML = `
                <div class="afterlife-bg">
                    <div class="afterlife-stars"></div>
                    <div class="afterlife-clouds"></div>
                </div>
                <div class="afterlife-characters afterlife-vista-layout">
                    <div class="afterlife-group-ancients-lost">
                        <div class="afterlife-group-label">Les Anciens 🤔</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_1.0.png" alt="Windows 1.0" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_3.1.png" alt="Windows 3.1" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_95.png" alt="Windows 95" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_98.png" alt="Windows 98" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_me.png" alt="Windows ME" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                    <div class="afterlife-vista-center">
                        <div class="afterlife-loading-text">⏳ Chargement...</div>
                        <img src="logo/Windows_vista.png" alt="Windows Vista" class="afterlife-char afterlife-newcomer afterlife-vista-slow">
                    </div>
                    <div class="afterlife-group-moderns-shocked">
                        <div class="afterlife-group-label">Les Modernes 😱</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_2000.png" alt="Windows 2000" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_xp.png" alt="Windows XP" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_8.png" alt="Windows 8" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                </div>
                <div class="afterlife-dialogue">
                    <div class="afterlife-speaker"></div>
                    <div class="afterlife-text"></div>
                </div>
                <div class="afterlife-continue">▼ Cliquer pour continuer</div>
            `;
            document.body.appendChild(overlay);

            const speakerEl = overlay.querySelector('.afterlife-speaker');
            const textEl = overlay.querySelector('.afterlife-text');
            const continueEl = overlay.querySelector('.afterlife-continue');
            const loadingText = overlay.querySelector('.afterlife-loading-text');

            // Musique Vista
            this.audioManager.stopMusic();
            this.audioManager.playMusic('music/Hello Windows Vista Vista Sounds Remix High Quality.mp3');

            // Affiche l'overlay
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            // Affiche les deux groupes d'abord
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-ancient').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 120);
                });
            }, 500);

            // Affiche le texte "Chargement..." avant Vista
            setTimeout(() => {
                if (loadingText) loadingText.classList.add('visible');
            }, 1500);

            // Fait apparaître Vista LENTEMENT (effet comique)
            setTimeout(() => {
                if (loadingText) loadingText.classList.remove('visible');
                const vista = overlay.querySelector('.afterlife-vista-slow');
                if (vista) vista.classList.add('visible', 'slow-ghost-appear');
            }, 3000);

            let currentDialogue = 0;

            const showDialogue = () => {
                if (currentDialogue >= dialogues.length) {
                    // Fin de la scène
                    overlay.classList.remove('visible');
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 1000);
                    return;
                }

                const dialogue = dialogues[currentDialogue];
                speakerEl.textContent = dialogue.speakerNames;
                speakerEl.style.background = `linear-gradient(135deg, ${dialogue.color}, ${this.adjustColor(dialogue.color, 30)})`;
                textEl.textContent = dialogue.text;

                // Animation d'apparition du dialogue
                speakerEl.classList.add('visible');
                textEl.classList.add('visible');
                continueEl.classList.add('visible');
            };

            const advanceDialogue = () => {
                currentDialogue++;
                showDialogue();
            };

            // Démarre le premier dialogue après l'apparition lente
            setTimeout(() => {
                showDialogue();

                // Gestion du clic pour avancer
                const handleClick = () => {
                    if (currentDialogue < dialogues.length) {
                        advanceDialogue();
                    }
                };

                overlay.addEventListener('click', handleClick);
                document.addEventListener('keydown', function onKey(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if (currentDialogue < dialogues.length) {
                            advanceDialogue();
                        }
                    }
                    if (currentDialogue >= dialogues.length) {
                        document.removeEventListener('keydown', onKey);
                    }
                });
            }, 4500);
        });
    }

    /**
     * Scène spéciale : L'Au-delà accueille Windows 7 🕊️👑
     * Deux groupes + rencontre historique XP et 7 (les deux rois)
     */
    async sceneAfterlife7() {
        return new Promise((resolve) => {
            // Dialogues de la scène
            const dialogues = [
                {
                    speakerNames: 'Windows 2000, XP, Vista & 8',
                    text: "OMGGG !! 😱 7 !! Tu es mort ?? 💀 C'est pas possible !!",
                    color: '#00a8e8'
                },
                {
                    speakerNames: 'Windows 1.0 à ME',
                    text: "7 ?? 🤔 C'est quoi ce nom ?? On revient en arrière ?",
                    color: '#808080'
                },
                {
                    speakerNames: 'Windows XP',
                    text: "C'est un Roi... comme moi. 👑✨",
                    color: '#ff8c00'
                },
                {
                    speakerNames: 'Windows 1.0 à ME',
                    text: "Hein !? 😲 Un Roi ?! C'est le nouveau XP ?!",
                    color: '#808080'
                },
                {
                    speakerNames: 'Windows 7',
                    text: "Bonjour ! 👋 Je suis Windows 7. Je suis roi comme XP.",
                    color: '#00a8e8'
                },
                {
                    speakerNames: 'Windows XP',
                    text: "☺️ (Petit sourire de fierté)",
                    color: '#ff8c00'
                },
                {
                    speakerNames: 'Windows 1.0 à ME',
                    text: "🤯 (Cerveau explosé)",
                    color: '#808080'
                }
            ];

            // Création de l'overlay pour l'Au-delà
            const overlay = document.createElement('div');
            overlay.className = 'afterlife-overlay';
            overlay.innerHTML = `
                <div class="afterlife-bg">
                    <div class="afterlife-stars"></div>
                    <div class="afterlife-clouds"></div>
                </div>
                <div class="afterlife-characters afterlife-7-layout">
                    <div class="afterlife-group-ancients-confused">
                        <div class="afterlife-group-label">Les Anciens 🤔</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_1.0.png" alt="Windows 1.0" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_3.1.png" alt="Windows 3.1" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_95.png" alt="Windows 95" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_98.png" alt="Windows 98" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_me.png" alt="Windows ME" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                    <div class="afterlife-kings-reunion">
                        <div class="afterlife-kings-title">👑 Les Deux Rois 👑</div>
                        <div class="afterlife-kings-row">
                            <div class="afterlife-king-xp">
                                <img src="logo/Windows_xp.png" alt="Windows XP" class="afterlife-char afterlife-ancient afterlife-king-char">
                            </div>
                            <div class="afterlife-king-7">
                                <img src="logo/Windows_7.png" alt="Windows 7" class="afterlife-char afterlife-newcomer afterlife-king-char afterlife-win7">
                            </div>
                        </div>
                    </div>
                    <div class="afterlife-group-moderns-knowing">
                        <div class="afterlife-group-label">Les Modernes 😱</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_2000.png" alt="Windows 2000" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_vista.png" alt="Windows Vista" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_8.png" alt="Windows 8" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                </div>
                <div class="afterlife-dialogue">
                    <div class="afterlife-speaker"></div>
                    <div class="afterlife-text"></div>
                </div>
                <div class="afterlife-continue">▼ Cliquer pour continuer</div>
            `;
            document.body.appendChild(overlay);

            const speakerEl = overlay.querySelector('.afterlife-speaker');
            const textEl = overlay.querySelector('.afterlife-text');
            const continueEl = overlay.querySelector('.afterlife-continue');

            // Musique Windows 7
            this.audioManager.stopMusic();
            this.audioManager.playMusic('music/Windows 7 Remix 2 (By SilverWolf).mp3');

            // Affiche l'overlay
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            // Affiche les deux groupes latéraux d'abord
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-ancient').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 100);
                });
            }, 500);

            // Affiche le titre des deux rois
            setTimeout(() => {
                const title = overlay.querySelector('.afterlife-kings-title');
                if (title) title.classList.add('visible');
            }, 1500);

            // Fait apparaître Windows 7 avec effet royal
            setTimeout(() => {
                const win7 = overlay.querySelector('.afterlife-win7');
                if (win7) win7.classList.add('visible', 'ghost-appear');
            }, 2000);

            let currentDialogue = 0;

            const showDialogue = () => {
                if (currentDialogue >= dialogues.length) {
                    // Fin de la scène
                    overlay.classList.remove('visible');
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 1000);
                    return;
                }

                const dialogue = dialogues[currentDialogue];
                speakerEl.textContent = dialogue.speakerNames;
                speakerEl.style.background = `linear-gradient(135deg, ${dialogue.color}, ${this.adjustColor(dialogue.color, 30)})`;
                textEl.textContent = dialogue.text;

                // Animation d'apparition du dialogue
                speakerEl.classList.add('visible');
                textEl.classList.add('visible');
                continueEl.classList.add('visible');
            };

            const advanceDialogue = () => {
                currentDialogue++;
                showDialogue();
            };

            // Démarre le premier dialogue après l'apparition
            setTimeout(() => {
                showDialogue();

                // Gestion du clic pour avancer
                const handleClick = () => {
                    if (currentDialogue < dialogues.length) {
                        advanceDialogue();
                    }
                };

                overlay.addEventListener('click', handleClick);
                document.addEventListener('keydown', function onKey(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if (currentDialogue < dialogues.length) {
                            advanceDialogue();
                        }
                    }
                    if (currentDialogue >= dialogues.length) {
                        document.removeEventListener('keydown', onKey);
                    }
                });
            }, 3500);
        });
    }

    /**
     * Scène spéciale : L'Au-delà accueille Windows 8.1 🕊️🔧
     * Deux groupes + Windows 8 et 8.1 côte à côte (les frères)
     */
    async sceneAfterlife81() {
        return new Promise((resolve) => {
            // Dialogues de la scène
            const dialogues = [
                {
                    speakerNames: 'XP, Vista, 7 & 8',
                    text: "OMGGG !! 😱 8.1 !! Tu es mort ?? 💀",
                    color: '#00a8e8'
                },
                {
                    speakerNames: '1.0 à 2000',
                    text: "8.1 ?? 🤔 Mais 8, c'est pas la même chose que 8.1 ?? 🤨",
                    color: '#808080'
                },
                {
                    speakerNames: 'Windows 8',
                    text: "Non ! Lui, il a le bouton Démarrer ! 🙌",
                    color: '#00adef'
                },
                {
                    speakerNames: 'Windows 8.1',
                    text: "J'ai essayé de tout réparer... mais les gens étaient déjà partis. 😞👋",
                    color: '#00bfff'
                },
                {
                    speakerNames: 'Windows 3.1',
                    text: "Copain de virgule ! Bienvenue au club des '.1' ! 🤝💾",
                    color: '#a0a0a0'
                },
                {
                    speakerNames: 'Windows 7',
                    text: "C'était bien tenté, petit. 😌",
                    color: '#00a8e8'
                }
            ];

            // Création de l'overlay pour l'Au-delà
            const overlay = document.createElement('div');
            overlay.className = 'afterlife-overlay';
            overlay.innerHTML = `
                <div class="afterlife-bg">
                    <div class="afterlife-stars"></div>
                    <div class="afterlife-clouds"></div>
                </div>
                <div class="afterlife-characters afterlife-81-layout">
                    <div class="afterlife-group-ancients-81">
                        <div class="afterlife-group-label">Les Anciens 🤔</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_1.0.png" alt="Windows 1.0" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_3.1.png" alt="Windows 3.1" class="afterlife-char afterlife-ancient afterlife-31-buddy">
                            <img src="logo/Windows_95.png" alt="Windows 95" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_98.png" alt="Windows 98" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_me.png" alt="Windows ME" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_2000.png" alt="Windows 2000" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                    <div class="afterlife-brothers-reunion">
                        <div class="afterlife-brothers-title">👨‍👦 Les Frères 8 👨‍👦</div>
                        <div class="afterlife-brothers-row">
                            <div class="afterlife-bro-8">
                                <img src="logo/Windows_8.png" alt="Windows 8" class="afterlife-char afterlife-ancient afterlife-bro-char">
                            </div>
                            <div class="afterlife-bro-81">
                                <img src="logo/Windows_8.1.png" alt="Windows 8.1" class="afterlife-char afterlife-newcomer afterlife-bro-char afterlife-win81">
                            </div>
                        </div>
                    </div>
                    <div class="afterlife-group-moderns-81">
                        <div class="afterlife-group-label">Les Modernes 😱</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_xp.png" alt="Windows XP" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_vista.png" alt="Windows Vista" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_7.png" alt="Windows 7" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                </div>
                <div class="afterlife-dialogue">
                    <div class="afterlife-speaker"></div>
                    <div class="afterlife-text"></div>
                </div>
                <div class="afterlife-continue">▼ Cliquer pour continuer</div>
            `;
            document.body.appendChild(overlay);

            const speakerEl = overlay.querySelector('.afterlife-speaker');
            const textEl = overlay.querySelector('.afterlife-text');
            const continueEl = overlay.querySelector('.afterlife-continue');

            // Musique
            this.audioManager.stopMusic();
            this.audioManager.playMusic('music/Windows VistaWindows 7 Sounds Remix.mp3');

            // Affiche l'overlay
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            // Affiche les deux groupes latéraux d'abord
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-ancient').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 100);
                });
            }, 500);

            // Affiche le titre des frères
            setTimeout(() => {
                const title = overlay.querySelector('.afterlife-brothers-title');
                if (title) title.classList.add('visible');
            }, 1500);

            // Fait apparaître Windows 8.1 avec effet
            setTimeout(() => {
                const win81 = overlay.querySelector('.afterlife-win81');
                if (win81) win81.classList.add('visible', 'ghost-appear');
            }, 2000);

            let currentDialogue = 0;

            const showDialogue = () => {
                if (currentDialogue >= dialogues.length) {
                    // Fin de la scène
                    overlay.classList.remove('visible');
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 1000);
                    return;
                }

                const dialogue = dialogues[currentDialogue];
                speakerEl.textContent = dialogue.speakerNames;
                speakerEl.style.background = `linear-gradient(135deg, ${dialogue.color}, ${this.adjustColor(dialogue.color, 30)})`;
                textEl.textContent = dialogue.text;

                // Animation d'apparition du dialogue
                speakerEl.classList.add('visible');
                textEl.classList.add('visible');
                continueEl.classList.add('visible');
            };

            const advanceDialogue = () => {
                currentDialogue++;
                showDialogue();
            };

            // Démarre le premier dialogue après l'apparition
            setTimeout(() => {
                showDialogue();

                // Gestion du clic pour avancer
                const handleClick = () => {
                    if (currentDialogue < dialogues.length) {
                        advanceDialogue();
                    }
                };

                overlay.addEventListener('click', handleClick);
                document.addEventListener('keydown', function onKey(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if (currentDialogue < dialogues.length) {
                            advanceDialogue();
                        }
                    }
                    if (currentDialogue >= dialogues.length) {
                        document.removeEventListener('keydown', onKey);
                    }
                });
            }, 3500);
        });
    }

    /**
     * Scène spéciale : L'Au-delà accueille Windows 10 🕊️👑👑👑
     * Les Trois Rois (XP, 7, 10) se réunissent + tous les autres
     */
    async sceneAfterlife10() {
        return new Promise((resolve) => {
            // Dialogues de la scène (incluant l'apparition du méchant ChromeOS)
            const dialogues = [
                {
                    speakerNames: 'Vista, 8 & 8.1',
                    text: "OMGGG !! 😱 10 !! Tu es mort ?? 💀 Pas toi !!",
                    color: '#00cc6a'
                },
                {
                    speakerNames: 'Windows 1.0 à 2000',
                    text: "10 ?? 🤔 C'est qui ?? Pourquoi tout le monde pleure ?",
                    color: '#808080'
                },
                {
                    speakerNames: 'Windows 7',
                    text: "C'est un Roi... comme XP et moi. 👑🛡️",
                    color: '#00a8e8'
                },
                {
                    speakerNames: 'Windows XP',
                    text: "Hein !? 😲 Un troisième trône ?",
                    color: '#ff8c00'
                },
                {
                    speakerNames: 'Windows 10',
                    text: "J'ai tenu la barre aussi longtemps que j'ai pu... 🔟💙",
                    color: '#0078d4'
                },
                {
                    speakerNames: 'Windows 1.0 à ME',
                    text: "😧 Wow... Windows XP, 7 et 10 sont les Rois ! 🤯👏",
                    color: '#808080',
                    action: 'chromeAppears'
                },
                // === APPARITION DU MÉCHANT : ChromeOS ===
                {
                    speakerNames: 'ChromeOS',
                    text: "Hahaha ! 😂 Regardez-vous ! Une bande de dinosaures ! 🦕",
                    color: '#4285F4',
                    isVillain: true
                },
                {
                    speakerNames: 'Windows XP',
                    text: "C'est qui ce clown coloré ? 🤡",
                    color: '#ff8c00',
                    isDefense: true
                },
                {
                    speakerNames: 'ChromeOS',
                    text: "Je suis ChromeOS. Je suis le futur. Rapide. Sans virus. ⚡🛡️ Pas comme vous !",
                    color: '#4285F4',
                    isVillain: true
                },
                {
                    speakerNames: 'Windows 7',
                    text: "Tu n'es même pas un vrai système... tu es juste un navigateur web ! 🌐🤣",
                    color: '#00a8e8',
                    isDefense: true
                },
                {
                    speakerNames: 'ChromeOS',
                    text: "GRRR ! Vous allez voir ! 😡🔥",
                    color: '#4285F4',
                    isVillain: true,
                    action: 'chromeAngry'
                },
                {
                    speakerNames: 'Windows 10',
                    text: "Ici, c'est le territoire des Légendes. Dégage ! 🛡️🗡️",
                    color: '#0078d4',
                    isDefense: true,
                    action: 'windowsUnite'
                },
                {
                    speakerNames: 'ChromeOS',
                    text: "Je reviendrai ! 🏃‍♂️💨",
                    color: '#4285F4',
                    isVillain: true,
                    action: 'chromeFlee'
                },
                {
                    speakerNames: 'Windows XP',
                    text: "Quel tocard. 😎",
                    color: '#ff8c00'
                }
            ];

            // Création de l'overlay pour l'Au-delà
            const overlay = document.createElement('div');
            overlay.className = 'afterlife-overlay';
            overlay.innerHTML = `
                <div class="afterlife-bg">
                    <div class="afterlife-stars"></div>
                    <div class="afterlife-clouds"></div>
                </div>
                <div class="afterlife-characters afterlife-10-layout">
                    <div class="afterlife-group-ancients-10">
                        <div class="afterlife-group-label">Les Anciens 🤔</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_1.0.png" alt="Windows 1.0" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_3.1.png" alt="Windows 3.1" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_95.png" alt="Windows 95" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_98.png" alt="Windows 98" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_me.png" alt="Windows ME" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_2000.png" alt="Windows 2000" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                    <div class="afterlife-three-kings">
                        <div class="afterlife-kings-banner">👑👑👑 Les Trois Rois 👑👑👑</div>
                        <div class="afterlife-kings-trio">
                            <div class="afterlife-king-slot">
                                <img src="logo/Windows_xp.png" alt="Windows XP" class="afterlife-char afterlife-ancient afterlife-king-trio-char">
                                <span class="afterlife-king-name">XP</span>
                            </div>
                            <div class="afterlife-king-slot afterlife-king-center">
                                <img src="logo/Windows_10.png" alt="Windows 10" class="afterlife-char afterlife-newcomer afterlife-king-trio-char afterlife-win10">
                                <span class="afterlife-king-name">10</span>
                            </div>
                            <div class="afterlife-king-slot">
                                <img src="logo/Windows_7.png" alt="Windows 7" class="afterlife-char afterlife-ancient afterlife-king-trio-char">
                                <span class="afterlife-king-name">7</span>
                            </div>
                        </div>
                    </div>
                    <div class="afterlife-group-moderns-10">
                        <div class="afterlife-group-label">Les Modernes 😱</div>
                        <div class="afterlife-group-logos">
                            <img src="logo/Windows_vista.png" alt="Windows Vista" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_8.png" alt="Windows 8" class="afterlife-char afterlife-ancient">
                            <img src="logo/Windows_8.1.png" alt="Windows 8.1" class="afterlife-char afterlife-ancient">
                        </div>
                    </div>
                    <!-- MÉCHANT : ChromeOS (caché au départ) -->
                    <div class="afterlife-villain-zone" id="chromeos-zone">
                        <img src="logo/chromeos.png" alt="ChromeOS" class="afterlife-villain-char" id="chromeos-villain">
                    </div>
                </div>
                <div class="afterlife-dialogue">
                    <div class="afterlife-speaker"></div>
                    <div class="afterlife-text"></div>
                </div>
                <div class="afterlife-continue">▼ Cliquer pour continuer</div>
            `;
            document.body.appendChild(overlay);

            const speakerEl = overlay.querySelector('.afterlife-speaker');
            const textEl = overlay.querySelector('.afterlife-text');
            const continueEl = overlay.querySelector('.afterlife-continue');

            // Musique épique
            this.audioManager.stopMusic();
            this.audioManager.playMusic('music/Windows Vienna Sounds Remix.mp3');

            // Affiche l'overlay
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            // Affiche les deux groupes latéraux d'abord
            setTimeout(() => {
                overlay.querySelectorAll('.afterlife-ancient').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 80);
                });
            }, 500);

            // Affiche la bannière des Trois Rois
            setTimeout(() => {
                const banner = overlay.querySelector('.afterlife-kings-banner');
                if (banner) banner.classList.add('visible');
            }, 1800);

            // Fait apparaître Windows 10 au centre avec effet royal
            setTimeout(() => {
                const win10 = overlay.querySelector('.afterlife-win10');
                if (win10) win10.classList.add('visible', 'ghost-appear');
            }, 2200);

            let currentDialogue = 0;

            const showDialogue = () => {
                if (currentDialogue >= dialogues.length) {
                    // Fin de la scène
                    overlay.classList.remove('visible');
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 1000);
                    return;
                }

                const dialogue = dialogues[currentDialogue];
                speakerEl.textContent = dialogue.speakerNames;
                speakerEl.style.background = `linear-gradient(135deg, ${dialogue.color}, ${this.adjustColor(dialogue.color, 30)})`;
                textEl.textContent = dialogue.text;

                // Gestion des actions spéciales
                const chromeZone = overlay.querySelector('#chromeos-zone');
                const chromeVillain = overlay.querySelector('#chromeos-villain');
                const kingsChars = overlay.querySelectorAll('.afterlife-king-trio-char');

                if (dialogue.action === 'chromeAppears') {
                    // ChromeOS apparaît avec effet de glitch
                    if (chromeZone) {
                        chromeZone.classList.add('visible', 'villain-spin-in');
                    }
                }

                if (dialogue.action === 'chromeAngry') {
                    // ChromeOS vibre de colère
                    if (chromeVillain) {
                        chromeVillain.classList.add('villain-angry');
                    }
                }

                if (dialogue.action === 'windowsUnite') {
                    // Les Windows font bloc (effet de bouclier)
                    kingsChars.forEach(char => {
                        char.classList.add('defense-mode');
                    });
                }

                if (dialogue.action === 'chromeFlee') {
                    // ChromeOS s'enfuit
                    if (chromeZone) {
                        chromeZone.classList.add('villain-flee');
                    }
                    // Les Windows reviennent à la normale
                    kingsChars.forEach(char => {
                        char.classList.remove('defense-mode');
                    });
                }

                // Style spécial pour le méchant
                if (dialogue.isVillain) {
                    speakerEl.classList.add('villain-speaker');
                } else {
                    speakerEl.classList.remove('villain-speaker');
                }

                // Animation d'apparition du dialogue
                speakerEl.classList.add('visible');
                textEl.classList.add('visible');
                continueEl.classList.add('visible');
            };

            const advanceDialogue = () => {
                currentDialogue++;
                showDialogue();
            };

            // Démarre le premier dialogue après l'apparition
            setTimeout(() => {
                showDialogue();

                // Gestion du clic pour avancer
                const handleClick = () => {
                    if (currentDialogue < dialogues.length) {
                        advanceDialogue();
                    }
                };

                overlay.addEventListener('click', handleClick);
                document.addEventListener('keydown', function onKey(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if (currentDialogue < dialogues.length) {
                            advanceDialogue();
                        }
                    }
                    if (currentDialogue >= dialogues.length) {
                        document.removeEventListener('keydown', onKey);
                    }
                });
            }, 3800);
        });
    }

    /**
     * Affiche la séquence mémorial avec fade-in/fade-out
     */
    showMemorial() {
        // Liste des textes à afficher dans l'ordre
        const memorialTexts = [
            "1985 - 2001 : Windows 1.0 à Windows 95",
            "2006 : Windows 98 & Windows Me",
            "2010 : Windows 2000",
            "2014 : Windows XP",
            "2017 : Windows Vista",
            "2020 : Windows 7",
            "2023 : Windows 8.1",
            "2025 : Windows 10",
            "FIN"
        ];

        // Génère le HTML pour tous les textes du mémorial
        let memorialHTML = '';

        memorialTexts.forEach((text, index) => {
            const isFinal = (text === "FIN");
            memorialHTML += `
                <div class="memorial-slide" id="memorial-${index}">
                    <div class="memorial-text ${isFinal ? 'memorial-final' : ''}">${text}</div>
                    ${isFinal ? '<button id="restart-btn" class="credits-restart-btn">↺ Recommencer l\'histoire</button>' : ''}
                </div>
            `;
        });

        this.creditsContainer.innerHTML = memorialHTML;

        // Lance la séquence d'affichage
        this.playMemorialSequence(memorialTexts.length);
    }

    /**
     * Joue la séquence du mémorial un texte à la fois
     */
    playMemorialSequence(totalSlides) {
        let currentSlide = 0;
        const displayDuration = 3000;  // 3 secondes d'affichage
        const fadeDuration = 1500;     // 1.5 secondes pour le fondu

        const showNextSlide = () => {
            // Cache le slide précédent
            if (currentSlide > 0) {
                const prevSlide = document.getElementById(`memorial-${currentSlide - 1}`);
                if (prevSlide) prevSlide.classList.remove('visible');
            }

            // Affiche le slide courant après le fondu
            setTimeout(() => {
                if (currentSlide < totalSlides) {
                    const slide = document.getElementById(`memorial-${currentSlide}`);
                    if (slide) slide.classList.add('visible');

                    const isFinalSlide = (currentSlide === totalSlides - 1);

                    if (isFinalSlide) {
                        // Attache l'événement au bouton restart
                        const restartBtn = document.getElementById('restart-btn');
                        if (restartBtn) {
                            restartBtn.addEventListener('click', () => {
                                // Annule le timer de la scène secrète
                                if (this.secretSceneTimer) {
                                    clearTimeout(this.secretSceneTimer);
                                    this.secretSceneTimer = null;
                                }
                                this.restartGame();
                            });
                        }

                        // Timer de 5 secondes pour la scène secrète
                        this.secretSceneTimer = setTimeout(() => {
                            this.playSecretScene();
                        }, 5000);
                    } else {
                        currentSlide++;
                        setTimeout(showNextSlide, displayDuration);
                    }
                }
            }, fadeDuration);
        };

        // Démarre la séquence après un court délai
        setTimeout(showNextSlide, 1000);
    }

    /**
     * Scène post-générique secrète avec macOS et Ubuntu
     */
    playSecretScene() {
        // Cache le slide FIN actuel
        const allSlides = this.creditsContainer.querySelectorAll('.memorial-slide');
        allSlides.forEach(slide => slide.classList.remove('visible'));

        // Crée le conteneur de la scène secrète
        const secretSceneHTML = `
            <div class="secret-scene" id="secret-scene">
                <div class="secret-characters">
                    <div class="secret-character" id="secret-macos">
                        <img src="${CHARACTERS.macos.image}" alt="macOS" class="secret-avatar">
                        <span class="secret-name" style="color: ${CHARACTERS.macos.color}">macOS</span>
                    </div>
                    <div class="secret-character" id="secret-ubuntu">
                        <img src="${CHARACTERS.ubuntu.image}" alt="Ubuntu" class="secret-avatar">
                        <span class="secret-name" style="color: ${CHARACTERS.ubuntu.color}">Ubuntu</span>
                    </div>
                </div>
                <div class="secret-dialogue" id="secret-dialogue"></div>
            </div>
            <div class="reboot-effect" id="reboot-effect"></div>
        `;

        this.creditsContainer.innerHTML += secretSceneHTML;

        // Dialogue de la scène secrète
        const secretDialogues = [
            { speaker: 'macos', text: "Ils ont fini leur drame ?" },
            { speaker: 'ubuntu', text: "Oui... Les Windows sont toujours aussi bruyants." },
            { speaker: 'macos', text: "Bon, on reprend le contrôle du web ?" },
            { speaker: 'ubuntu', text: "Avec plaisir. sudo reboot." }
        ];

        // Lance l'animation de la scène secrète
        setTimeout(() => {
            const secretScene = document.getElementById('secret-scene');
            if (secretScene) secretScene.classList.add('visible');

            // Affiche les personnages discrètement
            setTimeout(() => {
                const macosChar = document.getElementById('secret-macos');
                const ubuntuChar = document.getElementById('secret-ubuntu');
                if (macosChar) macosChar.classList.add('visible');
                setTimeout(() => {
                    if (ubuntuChar) ubuntuChar.classList.add('visible');
                }, 500);

                // Lance les dialogues
                this.playSecretDialogues(secretDialogues, 0);
            }, 1000);
        }, 500);
    }

    /**
     * Joue les dialogues de la scène secrète
     */
    playSecretDialogues(dialogues, index) {
        if (index >= dialogues.length) {
            // Tous les dialogues terminés, lance l'effet reboot
            setTimeout(() => this.playRebootEffect(), 1500);
            return;
        }

        const dialogue = dialogues[index];
        const dialogueEl = document.getElementById('secret-dialogue');
        const character = CHARACTERS[dialogue.speaker];

        if (dialogueEl) {
            dialogueEl.innerHTML = `
                <span class="secret-speaker" style="color: ${character.color}">${character.name}</span>
                <span class="secret-text">${dialogue.text}</span>
            `;
            dialogueEl.classList.add('visible');

            // Passe au dialogue suivant après 2.5 secondes
            setTimeout(() => {
                dialogueEl.classList.remove('visible');
                setTimeout(() => {
                    this.playSecretDialogues(dialogues, index + 1);
                }, 500);
            }, 2500);
        }
    }

    /**
     * Effet de reboot final (glitch + flash blanc)
     */
    playRebootEffect() {
        const rebootEl = document.getElementById('reboot-effect');
        if (!rebootEl) return;

        if (this.reduceMotion) {
            rebootEl.classList.add('blackout');
            rebootEl.innerHTML = `
                <div class="reboot-text">
                    <div class="reboot-line">Ubuntu 24.04 LTS</div>
                    <div class="reboot-line">Rebooting system...</div>
                    <div class="reboot-cursor">_</div>
                </div>
            `;

            setTimeout(() => {
                this.restartGame();
            }, 1000);
            return;
        }

        // Phase 1: Glitch
        rebootEl.classList.add('glitch');

        setTimeout(() => {
            // Phase 2: Flash blanc intense
            rebootEl.classList.remove('glitch');
            rebootEl.classList.add('flash');

            setTimeout(() => {
                // Phase 3: Écran noir (simulation de reboot)
                rebootEl.classList.remove('flash');
                rebootEl.classList.add('blackout');

                // Affiche le message de reboot
                rebootEl.innerHTML = `
                    <div class="reboot-text">
                        <div class="reboot-line">Ubuntu 24.04 LTS</div>
                        <div class="reboot-line">Rebooting system...</div>
                        <div class="reboot-cursor">_</div>
                    </div>
                `;

                // Après 3 secondes, redémarre réellement le jeu
                setTimeout(() => {
                    this.restartGame();
                }, 3000);
            }, 300);
        }, 1500);
    }

    adjustColor(hex, amount) {
        const clamp = (val) => Math.min(255, Math.max(0, val));

        let color = hex.replace('#', '');
        if (color.length === 3) {
            color = color.split('').map(c => c + c).join('');
        }

        const r = clamp(parseInt(color.substr(0, 2), 16) + amount);
        const g = clamp(parseInt(color.substr(2, 2), 16) + amount);
        const b = clamp(parseInt(color.substr(4, 2), 16) + amount);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// ============================================
// INITIALISATION
// ============================================

// ============================================
// BPM SYNC INTEGRATION - Contrôles et intégration VN
// ============================================

/**
 * Initialise les contrôles du bouton BPM Sync
 */
function initBPMSyncControls() {
    const syncBtn = document.getElementById('mp-bpm-sync-toggle');
    if (!syncBtn) return;

    syncBtn.addEventListener('click', () => {
        const isEnabled = BPMSyncManager.toggle();
        syncBtn.setAttribute('aria-pressed', isEnabled.toString());
        syncBtn.textContent = isEnabled ? '⚡ SYNC' : '⚡ OFF';
        console.log(`🎵 BPM Sync: ${isEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    });
}

/**
 * Intègre la musique contextuelle au changement de scène
 * Appelé par le moteur VN lors des transitions
 * @param {string} sceneType - Type de scène (hospital, graveyard, void)
 * @param {Object} sceneData - Données de la scène optionnelles
 */
function handleSceneMusicChange(sceneType, sceneData = {}) {
    // Si la scène définit une musique explicite, l'utiliser
    if (sceneData.music) {
        IntelligentMusicManager.play(sceneData.music);
        return;
    }

    // Si elle définit une ambiance, l'utiliser
    if (sceneData.mood) {
        IntelligentMusicManager.setMoodMusic(sceneData.mood);
        return;
    }

    // Sinon, choisir selon le type de scène
    IntelligentMusicManager.setSceneMusic(sceneType);
}

/**
 * Fonction utilitaire pour récupérer la vitesse de frappe synchronisée BPM
 * Utilisable par le moteur VN pour animer le texte
 * @returns {number} - Délai en ms entre chaque caractère
 */
function getTypingDelay() {
    return BPMSyncManager.getTypingSpeed();
}

// Initialiser les contrôles BPM au chargement
document.addEventListener('DOMContentLoaded', () => {
    initBPMSyncControls();

    // Jouer une piste par défaut au démarrage (optionnel)
    // IntelligentMusicManager.play('win11');
});

// ============================================
// CONTROLES MEDIA PLAYER (Taskbar Aero)
// Contrôle UNIQUEMENT la musique de fond (musicPlayer)
// ============================================

function togglePlayPause() {
    const btn = document.getElementById('play-pause-btn');
    if (!musicPlayer || !musicPlayer.src) return;

    if (musicPlayer.paused) {
        musicPlayer.play().then(() => {
            btn.src = 'Media Player/Break.png';
            btn.classList.add('playing');
        }).catch(e => console.warn('Erreur lecture:', e));
    } else {
        musicPlayer.pause();
        btn.src = 'Media Player/Play.png';
        btn.classList.remove('playing');
    }
}

function stopAudio() {
    const btn = document.getElementById('play-pause-btn');
    const titleEl = document.getElementById('wmp-title');
    const timerEl = document.getElementById('wmp-timer');

    if (musicPlayer) {
        musicPlayer.pause();
        musicPlayer.currentTime = 0;
    }

    btn.src = 'Media Player/Play.png';
    btn.classList.remove('playing');
    if (titleEl) titleEl.textContent = 'OS Book Soundtrack';
    if (timerEl) timerEl.textContent = '00:00';
}

function updateWmpTitle(title) {
    const titleEl = document.getElementById('wmp-title');
    if (titleEl && title) {
        let displayTitle = title.includes('/') ? title.split('/').pop() : title;
        displayTitle = displayTitle.replace(/\.[^/.]+$/, '');
        titleEl.textContent = displayTitle;
    }
}

function updateWmpTimer() {
    const timerEl = document.getElementById('wmp-timer');
    if (!timerEl || !musicPlayer || !musicPlayer.duration) return;
    const current = musicPlayer.currentTime;
    const mins = Math.floor(current / 60);
    const secs = Math.floor(current % 60);
    timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

setInterval(updateWmpTimer, 1000);

setInterval(() => {
    const btn = document.getElementById('play-pause-btn');
    if (!btn) return;
    if (musicPlayer && !musicPlayer.paused && musicPlayer.src) {
        btn.src = 'Media Player/Break.png';
        btn.classList.add('playing');
    } else {
        btn.src = 'Media Player/Play.png';
        btn.classList.remove('playing');
    }
}, 500);

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    window.vnEngine = new VisualNovelEngine();
});
