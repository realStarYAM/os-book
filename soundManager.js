/**
 * ============================================
 * OS BOOK - SOUND MANAGER v2.0
 * Gestionnaire d'effets sonores (SFX)
 * ============================================
 * 
 * Fonctionnalités :
 * - Lecture de sons par catégorie
 * - Play, Stop, Loop, Pause
 * - Fade In / Fade Out
 * - Preloading intelligent
 * - Anti-overlap et gestion de volume
 * - Intégration narrative pour visual novel
 * - Déverrouillage audio automatique (Chrome/Edge autoplay policy)
 * - Bouton d'activation audio si bloqué
 * - Diagnostics détaillés
 * 
 * Structure des sons :
 * sfx/
 * ├── ambience/    (ambiances de fond)
 * ├── attacks/     (attaques ChromeOS, Windows)
 * ├── freeze/      (gel système, temps)
 * ├── kernel/      (interventions divines)
 * ├── lockdown/    (verrouillage système)
 * └── pain/        (douleur numérique)
 */

// ============================================
// AUDIO UNLOCKER - Gestion de l'autoplay policy
// ============================================

/**
 * Gestionnaire de déverrouillage audio pour Chrome/Edge
 * Résout les problèmes d'autoplay policy
 */
const AudioUnlocker = {
    // État du déverrouillage
    isUnlocked: false,
    isChecking: false,
    unlockAttempts: 0,
    maxAttempts: 3,

    // Callbacks pour notification
    onUnlockCallbacks: [],
    onBlockedCallbacks: [],

    // Audio de test (silencieux)
    testAudio: null,
    audioContext: null,

    // Bouton d'activation
    unlockButton: null,

    /**
     * Initialise le système de déverrouillage
     */
    init() {
        console.log('🔓 AudioUnlocker: Initialisation...');

        // Créer l'audio de test (fichier silencieux ou data URI)
        this.testAudio = new Audio();
        this.testAudio.volume = 0.001; // Quasi-silencieux

        // Créer un AudioContext pour vérification
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('🔓 AudioContext non disponible');
        }

        // Écouter les interactions utilisateur pour déverrouiller
        this.setupInteractionListeners();

        // Vérification initiale
        this.checkAudioState();

        console.log('🔓 AudioUnlocker: Prêt');
    },

    /**
     * Configure les écouteurs d'interaction utilisateur
     */
    setupInteractionListeners() {
        const unlockEvents = ['click', 'touchstart', 'keydown', 'mousedown'];

        const unlockHandler = (e) => {
            if (!this.isUnlocked) {
                console.log(`🔓 Interaction détectée: ${e.type}`);
                this.tryUnlock();
            }
        };

        unlockEvents.forEach(event => {
            document.addEventListener(event, unlockHandler, { once: false, passive: true });
        });

        // Stocker la référence pour cleanup
        this.unlockHandler = unlockHandler;
    },

    /**
     * Vérifie l'état actuel de l'audio
     */
    async checkAudioState() {
        if (this.isChecking) return;
        this.isChecking = true;

        console.log('🔓 Vérification de l\'état audio...');

        // Méthode 1: Vérifier l'AudioContext
        if (this.audioContext) {
            if (this.audioContext.state === 'running') {
                console.log('🔓 AudioContext: running ✅');
                this.setUnlocked(true);
                this.isChecking = false;
                return;
            } else {
                console.log(`🔓 AudioContext: ${this.audioContext.state} ⚠️`);
            }
        }

        // Méthode 2: Tester la lecture d'un son
        try {
            // Utiliser un son silencieux encodé en base64
            this.testAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

            const playPromise = this.testAudio.play();

            if (playPromise) {
                await playPromise;
                this.testAudio.pause();
                console.log('🔓 Test audio: Lecture réussie ✅');
                this.setUnlocked(true);
            }
        } catch (e) {
            console.log('🔓 Test audio: Lecture bloquée ⚠️', e.name);
            this.setUnlocked(false);
            this.showUnlockButton();
        }

        this.isChecking = false;
    },

    /**
     * Tente de déverrouiller l'audio
     */
    async tryUnlock() {
        if (this.isUnlocked) {
            console.log('🔓 Audio déjà déverrouillé');
            return true;
        }

        this.unlockAttempts++;
        console.log(`🔓 Tentative de déverrouillage #${this.unlockAttempts}...`);

        let success = false;

        // Méthode 1: Reprendre l'AudioContext
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('🔓 AudioContext repris ✅');
                success = true;
            } catch (e) {
                console.warn('🔓 Échec reprise AudioContext:', e);
            }
        }

        // Méthode 2: Jouer un son silencieux
        try {
            this.testAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            this.testAudio.volume = 0.001;
            await this.testAudio.play();
            this.testAudio.pause();
            console.log('🔓 Audio déverrouillé via lecture test ✅');
            success = true;
        } catch (e) {
            console.warn('🔓 Échec lecture test:', e.name);
        }

        if (success) {
            this.setUnlocked(true);
            this.hideUnlockButton();
        } else if (this.unlockAttempts >= this.maxAttempts) {
            console.warn('🔓 Nombre max de tentatives atteint');
            this.showUnlockButton();
        }

        return success;
    },

    /**
     * Définit l'état de déverrouillage
     * @param {boolean} unlocked - État
     */
    setUnlocked(unlocked) {
        const wasUnlocked = this.isUnlocked;
        this.isUnlocked = unlocked;

        if (unlocked && !wasUnlocked) {
            console.log('🔓 ═══════════════════════════════');
            console.log('🔓 AUDIO DÉVERROUILLÉ ! 🎉');
            console.log('🔓 Les sons peuvent maintenant être joués');
            console.log('🔓 ═══════════════════════════════');

            // Notifier les callbacks
            this.onUnlockCallbacks.forEach(cb => {
                try { cb(); } catch (e) { console.error(e); }
            });
        }
    },

    /**
     * Affiche le bouton d'activation audio
     */
    showUnlockButton() {
        if (this.unlockButton) return;

        console.log('🔓 Affichage du bouton d\'activation audio');

        // Créer le bouton
        this.unlockButton = document.createElement('button');
        this.unlockButton.id = 'audio-unlock-btn';
        this.unlockButton.innerHTML = '🔊 Activer le son';
        this.unlockButton.setAttribute('aria-label', 'Activer le son');

        // Styles du bouton
        Object.assign(this.unlockButton.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '99999',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'Inter, sans-serif',
            color: '#fff',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.5)',
            animation: 'audioUnlockPulse 2s infinite',
            transition: 'transform 0.2s, box-shadow 0.2s'
        });

        // Animation CSS
        if (!document.getElementById('audio-unlock-styles')) {
            const style = document.createElement('style');
            style.id = 'audio-unlock-styles';
            style.textContent = `
                @keyframes audioUnlockPulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5); }
                    50% { transform: scale(1.05); box-shadow: 0 6px 30px rgba(102, 126, 234, 0.7); }
                }
                #audio-unlock-btn:hover {
                    transform: scale(1.1) !important;
                    box-shadow: 0 8px 40px rgba(102, 126, 234, 0.8) !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Gestionnaire de clic
        this.unlockButton.addEventListener('click', async () => {
            console.log('🔓 Clic sur le bouton d\'activation');
            const success = await this.tryUnlock();
            if (success) {
                this.hideUnlockButton();
            }
        });

        document.body.appendChild(this.unlockButton);

        // Notifier les callbacks de blocage
        this.onBlockedCallbacks.forEach(cb => {
            try { cb(); } catch (e) { console.error(e); }
        });
    },

    /**
     * Cache le bouton d'activation
     */
    hideUnlockButton() {
        if (this.unlockButton) {
            this.unlockButton.remove();
            this.unlockButton = null;
            console.log('🔓 Bouton d\'activation masqué');
        }
    },

    /**
     * Fonction principale pour s'assurer que l'audio est déverrouillé
     * @returns {Promise<boolean>}
     */
    async ensureUnlocked() {
        if (this.isUnlocked) {
            return true;
        }

        return this.tryUnlock();
    },

    /**
     * Ajoute un callback appelé lors du déverrouillage
     * @param {Function} callback
     */
    onUnlock(callback) {
        this.onUnlockCallbacks.push(callback);

        // Si déjà déverrouillé, appeler immédiatement
        if (this.isUnlocked) {
            try { callback(); } catch (e) { console.error(e); }
        }
    },

    /**
     * Ajoute un callback appelé si l'audio est bloqué
     * @param {Function} callback
     */
    onBlocked(callback) {
        this.onBlockedCallbacks.push(callback);
    },

    /**
     * Diagnostic complet de l'état audio
     * @returns {Object}
     */
    diagnose() {
        const diagnosis = {
            isUnlocked: this.isUnlocked,
            attempts: this.unlockAttempts,
            audioContextState: this.audioContext?.state ?? 'N/A',
            buttonVisible: !!this.unlockButton,
            userAgent: navigator.userAgent,
            autoplayPolicy: 'unknown'
        };

        // Vérifier la politique d'autoplay (si disponible)
        if (navigator.getAutoplayPolicy) {
            diagnosis.autoplayPolicy = navigator.getAutoplayPolicy('mediaelement');
        }

        console.log('🔓 ══════ DIAGNOSTIC AUDIO ══════');
        console.log(`🔓 Déverrouillé: ${diagnosis.isUnlocked ? '✅ Oui' : '❌ Non'}`);
        console.log(`🔓 Tentatives: ${diagnosis.attempts}`);
        console.log(`🔓 AudioContext: ${diagnosis.audioContextState}`);
        console.log(`🔓 Bouton visible: ${diagnosis.buttonVisible ? 'Oui' : 'Non'}`);
        console.log('🔓 ═════════════════════════════');

        return diagnosis;
    }
};

// Fonction globale pour déverrouillage
function ensureAudioUnlocked() {
    return AudioUnlocker.ensureUnlocked();
}

function diagnoseAudio() {
    return AudioUnlocker.diagnose();
}

// ============================================
// CONFIGURATION DES SONS
// ============================================

/**
 * Catalogue complet des effets sonores
 * Chaque entrée contient : path, duration estimée, volume par défaut
 */
const SFX_CATALOG = {
    // === AMBIENCE (Sons d'ambiance) ===
    ambience: {
        monitor: {
            path: 'sfx/ambience/Monitor.mp3',
            volume: 0.3,
            loop: true,
            description: 'Bruit de moniteur CRT'
        },
        digital_silence: {
            path: 'sfx/ambience/absolute_digital_silence.wav',
            volume: 0.2,
            loop: true,
            description: 'Silence numérique absolu'
        },
        reality_pause: {
            path: 'sfx/ambience/os_reality_pause.wav',
            volume: 0.4,
            loop: false,
            description: 'Pause de la réalité OS'
        }
    },

    // === ATTACKS (Sons d'attaque) ===
    attacks: {
        chromeos_attack: {
            path: 'sfx/attacks/chromeos_attack.wav',
            volume: 0.7,
            loop: false,
            description: 'Attaque de ChromeOS'
        },
        chromeos_corruption: {
            path: 'sfx/attacks/chromeos_corruption.wav',
            volume: 0.6,
            loop: false,
            description: 'Corruption par ChromeOS'
        }
    },

    // === FREEZE (Sons de gel) ===
    freeze: {
        chromeos_frozen: {
            path: 'sfx/freeze/chromeos_frozen_by_kernel.wav',
            volume: 0.8,
            loop: false,
            description: 'ChromeOS gelé par Kernel'
        },
        system_freeze: {
            path: 'sfx/freeze/system_freeze_total.wav',
            volume: 0.8,
            loop: false,
            description: 'Gel total du système'
        },
        time_freeze: {
            path: 'sfx/freeze/time_freeze_glitch.wav',
            volume: 0.7,
            loop: false,
            description: 'Gel temporel avec glitch'
        },
        ui_frozen: {
            path: 'sfx/freeze/ui_frozen_state.wav',
            volume: 0.5,
            loop: true,
            description: 'État UI gelé'
        }
    },

    // === KERNEL (Sons divins) ===
    kernel: {
        divine_override: {
            path: 'sfx/kernel/divine_kernel_override.wav',
            volume: 0.9,
            loop: false,
            description: 'Override divin du Kernel'
        },
        divine_intervention: {
            path: 'sfx/kernel/kernel_divine_intervention.wav',
            volume: 0.9,
            loop: false,
            description: 'Intervention divine du Kernel'
        },
        time_stop: {
            path: 'sfx/kernel/kernel_time_stop.wav',
            volume: 0.8,
            loop: false,
            description: 'Arrêt du temps par Kernel'
        }
    },

    // === LOCKDOWN (Sons de verrouillage) ===
    lockdown: {
        hard_lock: {
            path: 'sfx/lockdown/system_hard_lock.wav',
            volume: 0.7,
            loop: false,
            description: 'Verrouillage dur du système'
        },
        system_lockdown: {
            path: 'sfx/lockdown/system_lockdown.wav',
            volume: 0.7,
            loop: false,
            description: 'Verrouillage système complet'
        }
    },

    // === PAIN (Sons de douleur) ===
    pain: {
        digital_pain: {
            path: 'sfx/pain/os_digital_pain.wav',
            volume: 0.6,
            loop: false,
            description: 'Douleur numérique d\'un OS'
        }
    }
};

// ============================================
// SOUND MANAGER PRINCIPAL
// ============================================

/**
 * Gestionnaire principal des effets sonores
 * Supporte : play, stop, loop, fade in/out, preload
 */
const SoundManager = {
    // État interne
    isInitialized: false,
    masterVolume: 0.7,
    isMuted: false,

    // Cache des sons préchargés
    preloadedSounds: new Map(),

    // Sons actuellement en cours de lecture
    activeSounds: new Map(),

    // Limite de sons simultanés par catégorie (anti-overlap)
    maxSoundsPerCategory: 2,

    // Historique de lecture (pour éviter répétitions)
    playHistory: [],
    maxHistoryLength: 10,

    // File d'attente pour les sons bloqués
    pendingSounds: [],

    // ============================================
    // INITIALISATION
    // ============================================

    /**
     * Initialise le Sound Manager
     * @param {Object} options - Options d'initialisation
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('🔊 SoundManager déjà initialisé');
            return;
        }

        // Appliquer les options
        this.masterVolume = options.masterVolume ?? 0.7;
        this.maxSoundsPerCategory = options.maxSoundsPerCategory ?? 2;

        // Initialiser le système de déverrouillage audio
        AudioUnlocker.init();

        // Callback quand l'audio est déverrouillé
        AudioUnlocker.onUnlock(() => {
            console.log('🔊 Audio déverrouillé - Lecture des sons en attente...');
            this.playPendingSounds();
        });

        // Précharger les sons critiques si demandé
        if (options.preloadCritical !== false) {
            this.preloadCategory('kernel');
            this.preloadCategory('attacks');
        }

        this.isInitialized = true;
        console.log('🔊 SoundManager initialisé avec succès');
        console.log(`   Volume: ${this.masterVolume * 100}%`);
        console.log(`   Catégories: ${Object.keys(SFX_CATALOG).join(', ')}`);
        console.log(`   Audio déverrouillé: ${AudioUnlocker.isUnlocked ? '✅' : '⚠️ En attente d\'interaction'}`);
    },

    /**
     * Joue les sons en attente après déverrouillage
     */
    playPendingSounds() {
        if (this.pendingSounds.length === 0) return;

        console.log(`🔊 Lecture de ${this.pendingSounds.length} son(s) en attente...`);

        while (this.pendingSounds.length > 0) {
            const pending = this.pendingSounds.shift();
            this.play(pending.category, pending.soundId, pending.options);
        }
    },

    // ============================================
    // PRELOADING (Préchargement)
    // ============================================

    /**
     * Précharge un son spécifique
     * @param {string} category - Catégorie du son
     * @param {string} soundId - ID du son
     * @returns {Promise<Audio>}
     */
    preload(category, soundId) {
        return new Promise((resolve, reject) => {
            const soundConfig = this.getSoundConfig(category, soundId);
            if (!soundConfig) {
                reject(new Error(`Son non trouvé: ${category}/${soundId}`));
                return;
            }

            const key = `${category}/${soundId}`;

            // Déjà préchargé ?
            if (this.preloadedSounds.has(key)) {
                resolve(this.preloadedSounds.get(key));
                return;
            }

            const audio = new Audio();
            audio.preload = 'auto';

            audio.oncanplaythrough = () => {
                this.preloadedSounds.set(key, audio);
                console.log(`🔊 Préchargé: ${key}`);
                resolve(audio);
            };

            audio.onerror = (e) => {
                console.error(`🔊 Erreur préchargement: ${key}`, e);
                reject(e);
            };

            audio.src = soundConfig.path;
        });
    },

    /**
     * Précharge tous les sons d'une catégorie
     * @param {string} category - Catégorie à précharger
     * @returns {Promise<void>}
     */
    async preloadCategory(category) {
        const categoryConfig = SFX_CATALOG[category];
        if (!categoryConfig) {
            console.warn(`🔊 Catégorie inconnue: ${category}`);
            return;
        }

        console.log(`🔊 Préchargement de la catégorie: ${category}...`);

        const promises = Object.keys(categoryConfig).map(soundId =>
            this.preload(category, soundId).catch(e => {
                console.warn(`🔊 Échec préchargement: ${category}/${soundId}`);
            })
        );

        await Promise.allSettled(promises);
        console.log(`🔊 Catégorie ${category} préchargée`);
    },

    /**
     * Précharge tous les sons
     * @returns {Promise<void>}
     */
    async preloadAll() {
        console.log('🔊 Préchargement de tous les sons...');

        for (const category of Object.keys(SFX_CATALOG)) {
            await this.preloadCategory(category);
        }

        console.log('🔊 Tous les sons préchargés !');
    },

    // ============================================
    // LECTURE (Play)
    // ============================================

    /**
     * Joue un son
     * @param {string} category - Catégorie du son
     * @param {string} soundId - ID du son
     * @param {Object} options - Options de lecture
     * @returns {string|null} - ID unique de l'instance ou null si erreur
     */
    play(category, soundId, options = {}) {
        if (!this.isInitialized) {
            console.warn('🔊 SoundManager non initialisé');
            return null;
        }

        if (this.isMuted) {
            console.log(`🔊 Son ignoré (muet): ${category}/${soundId}`);
            return null;
        }

        const soundConfig = this.getSoundConfig(category, soundId);
        if (!soundConfig) {
            console.warn(`🔊 ❌ Son non trouvé: ${category}/${soundId}`);
            console.warn(`🔊 Sons disponibles dans ${category}:`, Object.keys(SFX_CATALOG[category] || {}));
            return null;
        }

        // Vérifier si l'audio est déverrouillé
        if (!AudioUnlocker.isUnlocked) {
            console.log(`🔊 ⏳ Audio bloqué - Son mis en attente: ${category}/${soundId}`);

            // Ajouter à la file d'attente si pas déjà présent
            if (!options.noPending) {
                this.pendingSounds.push({ category, soundId, options });
            }

            // Tenter le déverrouillage
            AudioUnlocker.tryUnlock();

            return null;
        }

        // Anti-overlap : vérifier le nombre de sons actifs dans la catégorie
        if (!options.allowOverlap && this.countActiveSoundsInCategory(category) >= this.maxSoundsPerCategory) {
            console.log(`🔊 Anti-overlap: ${category} (max ${this.maxSoundsPerCategory} atteint)`);
            // Arrêter le son le plus ancien de la catégorie
            this.stopOldestInCategory(category);
        }

        // Créer ou récupérer l'audio
        const key = `${category}/${soundId}`;
        let audio;

        if (this.preloadedSounds.has(key)) {
            // Cloner l'audio préchargé pour permettre plusieurs lectures
            const preloaded = this.preloadedSounds.get(key);
            audio = preloaded.cloneNode();
            console.log(`🔊 Utilisation du cache: ${key}`);
        } else {
            audio = new Audio(soundConfig.path);
            console.log(`🔊 Chargement: ${key}`);
        }

        // Configurer l'audio
        const volume = (options.volume ?? soundConfig.volume ?? 0.7) * this.masterVolume;
        const loop = options.loop ?? soundConfig.loop ?? false;

        audio.volume = options.fadeIn ? 0 : volume;
        audio.loop = loop;

        // Générer un ID unique pour cette instance
        const instanceId = `${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Stocker l'instance
        this.activeSounds.set(instanceId, {
            audio,
            category,
            soundId,
            targetVolume: volume,
            startTime: Date.now()
        });

        // Ajouter à l'historique
        this.addToHistory(category, soundId);

        // Gestionnaire de fin
        audio.onended = () => {
            if (!loop) {
                this.activeSounds.delete(instanceId);
                console.log(`🔊 ✅ Terminé: ${key}`);
            }
        };

        // Gestion des erreurs de chargement
        audio.onerror = (e) => {
            console.error(`🔊 ❌ Erreur chargement: ${key}`);
            console.error(`🔊 Chemin: ${soundConfig.path}`);
            console.error(`🔊 Vérifiez que le fichier existe`);
            this.activeSounds.delete(instanceId);
        };

        // Lancer la lecture
        const playPromise = audio.play();

        if (playPromise) {
            playPromise
                .then(() => {
                    console.log(`🔊 ▶️ Lecture en cours: ${key} (vol: ${Math.round(volume * 100)}%)${loop ? ' 🔁' : ''}`);
                })
                .catch(e => {
                    if (e.name === 'AbortError') {
                        console.log(`🔊 ⏹️ Lecture interrompue: ${key} (normal si scène change)`);
                    } else if (e.name === 'NotAllowedError') {
                        console.warn(`🔊 🔒 Lecture bloquée (autoplay): ${key}`);
                        console.warn(`🔊 → Cliquez sur le bouton "Activer le son" ou interagissez avec la page`);
                        AudioUnlocker.showUnlockButton();
                    } else {
                        console.error(`🔊 ❌ Erreur lecture: ${key}`, e.name, e.message);
                    }
                    this.activeSounds.delete(instanceId);
                });
        }

        // Fade in si demandé
        if (options.fadeIn) {
            this.fadeIn(instanceId, options.fadeInDuration ?? 1000);
        }

        return instanceId;
    },

    /**
     * Joue un son aléatoire dans une catégorie
     * @param {string} category - Catégorie
     * @param {Object} options - Options de lecture
     * @returns {string|null}
     */
    playRandom(category, options = {}) {
        const categoryConfig = SFX_CATALOG[category];
        if (!categoryConfig) {
            console.warn(`🔊 Catégorie inconnue: ${category}`);
            return null;
        }

        const soundIds = Object.keys(categoryConfig);

        // Éviter les sons récemment joués si possible
        let availableSounds = soundIds.filter(id =>
            !this.playHistory.some(h => h.category === category && h.soundId === id)
        );

        // Si tous ont été joués récemment, prendre dans la liste complète
        if (availableSounds.length === 0) {
            availableSounds = soundIds;
        }

        const randomId = availableSounds[Math.floor(Math.random() * availableSounds.length)];
        return this.play(category, randomId, options);
    },

    // ============================================
    // CONTRÔLE (Stop, Pause, Resume)
    // ============================================

    /**
     * Arrête un son par son ID d'instance
     * @param {string} instanceId - ID de l'instance
     * @param {Object} options - Options (fadeOut, etc.)
     */
    stop(instanceId, options = {}) {
        const instance = this.activeSounds.get(instanceId);
        if (!instance) {
            console.warn(`🔊 Instance non trouvée: ${instanceId}`);
            return;
        }

        if (options.fadeOut) {
            this.fadeOut(instanceId, options.fadeOutDuration ?? 500, () => {
                instance.audio.pause();
                instance.audio.currentTime = 0;
                this.activeSounds.delete(instanceId);
            });
        } else {
            instance.audio.pause();
            instance.audio.currentTime = 0;
            this.activeSounds.delete(instanceId);
            console.log(`🔊 Stop: ${instanceId}`);
        }
    },

    /**
     * Arrête tous les sons d'une catégorie
     * @param {string} category - Catégorie
     * @param {Object} options - Options
     */
    stopCategory(category, options = {}) {
        const toStop = [];

        this.activeSounds.forEach((instance, id) => {
            if (instance.category === category) {
                toStop.push(id);
            }
        });

        toStop.forEach(id => this.stop(id, options));
        console.log(`🔊 Catégorie arrêtée: ${category} (${toStop.length} sons)`);
    },

    /**
     * Arrête tous les sons
     * @param {Object} options - Options
     */
    stopAll(options = {}) {
        const toStop = Array.from(this.activeSounds.keys());
        toStop.forEach(id => this.stop(id, options));
        console.log(`🔊 Tous les sons arrêtés (${toStop.length})`);
    },

    /**
     * Met en pause un son
     * @param {string} instanceId - ID de l'instance
     */
    pause(instanceId) {
        const instance = this.activeSounds.get(instanceId);
        if (instance) {
            instance.audio.pause();
            instance.isPaused = true;
            console.log(`🔊 Pause: ${instanceId}`);
        }
    },

    /**
     * Reprend un son en pause
     * @param {string} instanceId - ID de l'instance
     */
    resume(instanceId) {
        const instance = this.activeSounds.get(instanceId);
        if (instance && instance.isPaused) {
            instance.audio.play().catch(e => console.warn('🔊 Resume bloqué:', e));
            instance.isPaused = false;
            console.log(`🔊 Resume: ${instanceId}`);
        }
    },

    // ============================================
    // FADE IN / FADE OUT
    // ============================================

    /**
     * Effectue un fade in sur un son
     * @param {string} instanceId - ID de l'instance
     * @param {number} duration - Durée en ms
     */
    fadeIn(instanceId, duration = 1000) {
        const instance = this.activeSounds.get(instanceId);
        if (!instance) return;

        const targetVolume = instance.targetVolume;
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = targetVolume / steps;
        let currentStep = 0;

        instance.audio.volume = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            instance.audio.volume = Math.min(targetVolume, volumeStep * currentStep);

            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                instance.audio.volume = targetVolume;
                console.log(`🔊 Fade in terminé: ${instanceId}`);
            }
        }, stepDuration);
    },

    /**
     * Effectue un fade out sur un son
     * @param {string} instanceId - ID de l'instance
     * @param {number} duration - Durée en ms
     * @param {Function} callback - Callback à la fin
     */
    fadeOut(instanceId, duration = 500, callback = null) {
        const instance = this.activeSounds.get(instanceId);
        if (!instance) {
            if (callback) callback();
            return;
        }

        const startVolume = instance.audio.volume;
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = startVolume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            instance.audio.volume = Math.max(0, startVolume - (volumeStep * currentStep));

            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                instance.audio.volume = 0;
                console.log(`🔊 Fade out terminé: ${instanceId}`);
                if (callback) callback();
            }
        }, stepDuration);
    },

    // ============================================
    // VOLUME ET MUTE
    // ============================================

    /**
     * Définit le volume global
     * @param {number} volume - Volume (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        // Mettre à jour tous les sons actifs
        this.activeSounds.forEach(instance => {
            const configVolume = this.getSoundConfig(instance.category, instance.soundId)?.volume ?? 0.7;
            instance.targetVolume = configVolume * this.masterVolume;
            instance.audio.volume = instance.targetVolume;
        });

        console.log(`🔊 Volume global: ${Math.round(this.masterVolume * 100)}%`);
    },

    /**
     * Active/désactive le mute
     * @param {boolean} muted - État mute
     */
    setMuted(muted) {
        this.isMuted = muted;

        this.activeSounds.forEach(instance => {
            instance.audio.muted = muted;
        });

        console.log(`🔊 Mute: ${muted ? 'ON' : 'OFF'}`);
    },

    /**
     * Toggle mute
     * @returns {boolean} - Nouvel état
     */
    toggleMute() {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    },

    // ============================================
    // UTILITAIRES
    // ============================================

    /**
     * Récupère la configuration d'un son
     * @param {string} category - Catégorie
     * @param {string} soundId - ID du son
     * @returns {Object|null}
     */
    getSoundConfig(category, soundId) {
        return SFX_CATALOG[category]?.[soundId] ?? null;
    },

    /**
     * Compte les sons actifs dans une catégorie
     * @param {string} category - Catégorie
     * @returns {number}
     */
    countActiveSoundsInCategory(category) {
        let count = 0;
        this.activeSounds.forEach(instance => {
            if (instance.category === category) count++;
        });
        return count;
    },

    /**
     * Arrête le son le plus ancien d'une catégorie
     * @param {string} category - Catégorie
     */
    stopOldestInCategory(category) {
        let oldest = null;
        let oldestTime = Date.now();

        this.activeSounds.forEach((instance, id) => {
            if (instance.category === category && instance.startTime < oldestTime) {
                oldest = id;
                oldestTime = instance.startTime;
            }
        });

        if (oldest) {
            this.stop(oldest, { fadeOut: true, fadeOutDuration: 200 });
        }
    },

    /**
     * Ajoute un son à l'historique de lecture
     * @param {string} category - Catégorie
     * @param {string} soundId - ID du son
     */
    addToHistory(category, soundId) {
        this.playHistory.push({ category, soundId, time: Date.now() });

        // Limiter la taille de l'historique
        if (this.playHistory.length > this.maxHistoryLength) {
            this.playHistory.shift();
        }
    },

    /**
     * Liste tous les sons disponibles
     * @returns {Object}
     */
    listSounds() {
        const sounds = {};

        for (const [category, categoryConfig] of Object.entries(SFX_CATALOG)) {
            sounds[category] = Object.keys(categoryConfig).map(id => ({
                id,
                ...categoryConfig[id]
            }));
        }

        return sounds;
    },

    /**
     * Retourne les sons actuellement en lecture
     * @returns {Array}
     */
    getActiveSounds() {
        const active = [];

        this.activeSounds.forEach((instance, id) => {
            active.push({
                instanceId: id,
                category: instance.category,
                soundId: instance.soundId,
                volume: instance.audio.volume,
                isPaused: instance.isPaused ?? false,
                currentTime: instance.audio.currentTime
            });
        });

        return active;
    },

    /**
     * Retourne les statistiques du Sound Manager
     * @returns {Object}
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            masterVolume: this.masterVolume,
            isMuted: this.isMuted,
            preloadedCount: this.preloadedSounds.size,
            activeSoundsCount: this.activeSounds.size,
            totalSoundsInCatalog: Object.values(SFX_CATALOG).reduce(
                (sum, cat) => sum + Object.keys(cat).length, 0
            )
        };
    }
};

// ============================================
// SCENE MANAGER - Intégration narrative
// ============================================

/**
 * Gestionnaire de scènes sonores pour le visual novel
 * Permet de créer des séquences audio narratives
 */
const NarrativeSoundManager = {
    currentScene: null,
    ambientSoundId: null,

    // Scènes sonores prédéfinies
    scenes: {
        // === Scène : ChromeOS attaque ===
        chromeos_attack: {
            name: 'Attaque de ChromeOS',
            sequence: [
                { action: 'play', category: 'attacks', sound: 'chromeos_attack', delay: 0 },
                { action: 'play', category: 'pain', sound: 'digital_pain', delay: 500 }
            ]
        },

        // === Scène : Intervention du Kernel ===
        kernel_intervention: {
            name: 'Intervention divine du Kernel',
            sequence: [
                { action: 'stopCategory', category: 'attacks', delay: 0 },
                { action: 'play', category: 'kernel', sound: 'divine_intervention', delay: 100 },
                { action: 'play', category: 'kernel', sound: 'time_stop', delay: 800 }
            ]
        },

        // === Scène : Freeze total ===
        total_freeze: {
            name: 'Gel total du système',
            sequence: [
                { action: 'stopAll', delay: 0 },
                { action: 'play', category: 'freeze', sound: 'system_freeze', delay: 100 },
                { action: 'play', category: 'freeze', sound: 'ui_frozen', delay: 1000, options: { loop: true } }
            ]
        },

        // === Scène : ChromeOS gelé par Kernel ===
        chromeos_frozen_by_kernel: {
            name: 'ChromeOS gelé par le Kernel',
            sequence: [
                { action: 'play', category: 'kernel', sound: 'divine_override', delay: 0 },
                { action: 'play', category: 'freeze', sound: 'chromeos_frozen', delay: 500 },
                { action: 'stopCategory', category: 'attacks', delay: 600 }
            ]
        },

        // === Scène : Lockdown système ===
        system_lockdown: {
            name: 'Verrouillage du système',
            sequence: [
                { action: 'play', category: 'lockdown', sound: 'system_lockdown', delay: 0 },
                { action: 'play', category: 'lockdown', sound: 'hard_lock', delay: 800 }
            ]
        },

        // === Scène : Corruption ChromeOS ===
        chromeos_corruption: {
            name: 'ChromeOS corrompt le système',
            sequence: [
                { action: 'play', category: 'attacks', sound: 'chromeos_corruption', delay: 0 },
                { action: 'startAmbient', category: 'ambience', sound: 'reality_pause', delay: 1000 }
            ]
        },

        // === Scène : Ambiance digitale ===
        digital_ambiance: {
            name: 'Ambiance monde digital',
            sequence: [
                { action: 'startAmbient', category: 'ambience', sound: 'monitor', delay: 0, options: { fadeIn: true, fadeInDuration: 2000 } }
            ]
        }
    },

    /**
     * Joue une scène sonore
     * @param {string} sceneId - ID de la scène
     * @returns {Promise<void>}
     */
    async playScene(sceneId) {
        const scene = this.scenes[sceneId];
        if (!scene) {
            console.warn(`🎬 Scène inconnue: ${sceneId}`);
            return;
        }

        console.log(`🎬 Scène: ${scene.name}`);
        this.currentScene = sceneId;

        for (const step of scene.sequence) {
            // Attendre le délai
            if (step.delay > 0) {
                await this.wait(step.delay);
            }

            // Exécuter l'action
            switch (step.action) {
                case 'play':
                    SoundManager.play(step.category, step.sound, step.options);
                    break;
                case 'playRandom':
                    SoundManager.playRandom(step.category, step.options);
                    break;
                case 'stop':
                    SoundManager.stop(step.instanceId, step.options);
                    break;
                case 'stopCategory':
                    SoundManager.stopCategory(step.category, step.options);
                    break;
                case 'stopAll':
                    SoundManager.stopAll(step.options);
                    break;
                case 'startAmbient':
                    this.startAmbient(step.category, step.sound, step.options);
                    break;
                case 'stopAmbient':
                    this.stopAmbient(step.options);
                    break;
            }
        }

        console.log(`🎬 Scène terminée: ${scene.name}`);
        this.currentScene = null;
    },

    /**
     * Démarre un son d'ambiance
     * @param {string} category - Catégorie
     * @param {string} soundId - ID du son
     * @param {Object} options - Options
     */
    startAmbient(category, soundId, options = {}) {
        // Arrêter l'ambiance précédente
        if (this.ambientSoundId) {
            SoundManager.stop(this.ambientSoundId, { fadeOut: true, fadeOutDuration: 500 });
        }

        // Démarrer la nouvelle ambiance
        this.ambientSoundId = SoundManager.play(category, soundId, {
            ...options,
            loop: true
        });
    },

    /**
     * Arrête le son d'ambiance
     * @param {Object} options - Options
     */
    stopAmbient(options = {}) {
        if (this.ambientSoundId) {
            SoundManager.stop(this.ambientSoundId, options);
            this.ambientSoundId = null;
        }
    },

    /**
     * Utilitaire pour attendre
     * @param {number} ms - Millisecondes
     * @returns {Promise}
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Ajoute une scène personnalisée
     * @param {string} id - ID de la scène
     * @param {Object} scene - Configuration de la scène
     */
    addScene(id, scene) {
        this.scenes[id] = scene;
        console.log(`🎬 Scène ajoutée: ${id}`);
    },

    /**
     * Liste toutes les scènes disponibles
     * @returns {Object}
     */
    listScenes() {
        return Object.entries(this.scenes).map(([id, scene]) => ({
            id,
            name: scene.name,
            stepsCount: scene.sequence.length
        }));
    }
};

// ============================================
// INTÉGRATION UI VISUAL NOVEL
// ============================================

/**
 * Fonctions utilitaires pour l'intégration avec l'UI du visual novel
 */
const SoundUI = {
    /**
     * Attache un son à un bouton/élément
     * @param {string|Element} element - Sélecteur ou élément DOM
     * @param {string} category - Catégorie du son
     * @param {string} soundId - ID du son
     * @param {string} event - Événement déclencheur (click, mouseenter, etc.)
     * @param {Object} options - Options de lecture
     */
    attachToElement(element, category, soundId, event = 'click', options = {}) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) {
            console.warn(`🔊 Élément non trouvé: ${element}`);
            return;
        }

        el.addEventListener(event, () => {
            SoundManager.play(category, soundId, options);
        });

        console.log(`🔊 Son attaché à: ${element} (${event})`);
    },

    /**
     * Joue un son au chargement d'une scène
     * @param {string} sceneId - ID de la scène narrative
     */
    onSceneLoad(sceneId) {
        // Mapping sceneId → sons automatiques
        const sceneMapping = {
            chromeos_appears: () => SoundManager.play('ambience', 'reality_pause'),
            kernel_arrives: () => NarrativeSoundManager.playScene('kernel_intervention'),
            system_crash: () => NarrativeSoundManager.playScene('total_freeze'),
            battle_start: () => SoundManager.playRandom('attacks')
        };

        if (sceneMapping[sceneId]) {
            sceneMapping[sceneId]();
        }
    },

    /**
     * Joue un son basé sur un dialogue
     * @param {Object} dialogue - Objet dialogue avec speaker, text, etc.
     */
    onDialogue(dialogue) {
        // Sons automatiques selon le speaker
        const speakerSounds = {
            chromeos: { category: 'attacks', sound: 'chromeos_corruption', chance: 0.2 },
            kernel: { category: 'kernel', sound: 'divine_intervention', chance: 0.3 }
        };

        const speakerConfig = speakerSounds[dialogue.speaker?.toLowerCase()];
        if (speakerConfig && Math.random() < speakerConfig.chance) {
            SoundManager.play(speakerConfig.category, speakerConfig.sound, { volume: 0.3 });
        }
    }
};

// ============================================
// FONCTIONS GLOBALES (RACCOURCIS)
// ============================================

// Raccourcis pour utilisation simple
function playSFX(category, soundId, options) {
    return SoundManager.play(category, soundId, options);
}

function stopSFX(instanceId, options) {
    SoundManager.stop(instanceId, options);
}

function playScene(sceneId) {
    return NarrativeSoundManager.playScene(sceneId);
}

function startAmbient(category, soundId, options) {
    NarrativeSoundManager.startAmbient(category, soundId, options);
}

function stopAllSFX() {
    SoundManager.stopAll({ fadeOut: true });
}

function setSFXVolume(volume) {
    SoundManager.setMasterVolume(volume);
}

function muteSFX(muted) {
    SoundManager.setMuted(muted);
}

// ============================================
// INITIALISATION AUTOMATIQUE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le Sound Manager
    SoundManager.init({
        masterVolume: 0.7,
        preloadCritical: true
    });

    console.log('🔊 ═══════════════════════════════════════');
    console.log('🔊 SOUND MANAGER v2.0 - OS BOOK');
    console.log('🔊 ═══════════════════════════════════════');
    console.log('🔊 Commandes disponibles:');
    console.log('   • SoundManager.play("category", "soundId")');
    console.log('   • NarrativeSoundManager.playScene("sceneId")');
    console.log('   • ensureAudioUnlocked() - Déverrouiller l\'audio');
    console.log('   • diagnoseAudio() - Diagnostic audio');
    console.log('🔊 ═══════════════════════════════════════');
});

// ============================================
// EXEMPLE: SCÈNE CHROMEOS VS KERNEL
// ============================================

/**
 * Exemple de scène: ChromeOS face au Kernel
 * Utilisation: await playSceneChromeosFacesKernel()
 */
async function playSceneChromeosFacesKernel() {
    console.log('🎬 ═══ SCÈNE: ChromeOS face au Kernel ═══');

    // S'assurer que l'audio est déverrouillé
    const unlocked = await ensureAudioUnlocked();
    if (!unlocked) {
        console.warn('🎬 Audio non déverrouillé - Cliquez sur le bouton');
        return false;
    }

    // Démarrer l'ambiance en fond (faible volume)
    NarrativeSoundManager.startAmbient('ambience', 'digital_silence', {
        fadeIn: true,
        fadeInDuration: 1000,
        volume: 0.15
    });

    // Attendre un peu
    await wait(500);

    // ChromeOS parle (effet de corruption)
    console.log('🎬 ChromeOS parle...');
    SoundManager.play('attacks', 'chromeos_corruption', { volume: 0.5 });

    // Douleur numérique
    await wait(800);
    console.log('🎬 Douleur ressentie...');
    SoundManager.play('pain', 'digital_pain', { volume: 0.6 });

    // Le Kernel intervient
    await wait(1500);
    console.log('🎬 Le Kernel intervient !');
    await NarrativeSoundManager.playScene('kernel_intervention');

    console.log('🎬 ═══ FIN DE LA SCÈNE ═══');
    return true;
}

/**
 * Utilitaire d'attente
 * @param {number} ms - Millisecondes
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// EXPORT POUR MODULES (si utilisé avec bundler)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SFX_CATALOG,
        SoundManager,
        NarrativeSoundManager,
        SoundUI,
        AudioUnlocker,
        ensureAudioUnlocked,
        diagnoseAudio
    };
}
