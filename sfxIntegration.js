/**
 * ============================================
 * OS BOOK - SFX INTEGRATION v1.0
 * Intégration du SoundManager avec le Visual Novel
 * ============================================
 * 
 * Ce fichier connecte le SoundManager au moteur VN existant :
 * - Déverrouillage audio automatique
 * - Sons sur les événements du jeu
 * - Synchronisation des contrôles audio
 * - Logs détaillés
 */

// ============================================
// CONFIGURATION DES SFX PAR ÉVÉNEMENT
// ============================================

const SFX_EVENTS = {
    // Sons pour les personnages
    speakers: {
        chromeos: {
            category: 'attacks',
            sound: 'chromeos_corruption',
            volume: 0.5,
            chance: 0.3, // 30% de chance de jouer
            firstTimeScene: 'chromeos_attack' // Scène narrative pour la première apparition
        },
        kernel: {
            category: 'kernel',
            sound: 'divine_intervention',
            volume: 0.6,
            chance: 0.4,
            firstTimeScene: 'kernel_intervention'
        }
    },

    // Sons pour les événements spéciaux
    events: {
        freeze: {
            scene: 'total_freeze',
            fallback: { category: 'freeze', sound: 'system_freeze' }
        },
        lockdown: {
            scene: 'system_lockdown',
            fallback: { category: 'lockdown', sound: 'system_lockdown' }
        },
        pain: {
            category: 'pain',
            sound: 'digital_pain',
            volume: 0.6
        }
    },

    // Son UI pour avancer le dialogue (discret)
    advance: {
        category: 'freeze',
        sound: 'ui_frozen',
        volume: 0.08,
        enabled: false // Désactivé par défaut car peut être fatiguant
    }
};

// ============================================
// TRACKER DE PREMIÈRE APPARITION
// ============================================

const SpeakerTracker = {
    firstAppearance: new Set(),
    storageKey: 'osbook_first_speakers',

    init() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.firstAppearance = new Set(JSON.parse(stored));
            }
        } catch (e) {
            console.warn('SpeakerTracker: Impossible de charger les données');
        }
    },

    isFirstTime(speaker) {
        const key = speaker.toLowerCase();
        if (this.firstAppearance.has(key)) {
            return false;
        }
        return true;
    },

    markSeen(speaker) {
        const key = speaker.toLowerCase();
        this.firstAppearance.add(key);

        try {
            localStorage.setItem(this.storageKey, JSON.stringify([...this.firstAppearance]));
        } catch (e) {
            // Ignorer
        }
    },

    reset() {
        this.firstAppearance.clear();
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            // Ignorer
        }
    }
};

// ============================================
// INTÉGRATION PRINCIPALE
// ============================================

const SFXIntegration = {
    isInitialized: false,
    lastSpeaker: null,
    advanceSoundCooldown: false,

    /**
     * Initialise l'intégration SFX
     */
    init() {
        if (this.isInitialized) return;

        console.log('🎵 ═══════════════════════════════════════');
        console.log('🎵 SFX INTEGRATION - OS BOOK');
        console.log('🎵 ═══════════════════════════════════════');

        // Initialiser le tracker
        SpeakerTracker.init();

        // S'assurer que le SoundManager est initialisé
        if (typeof SoundManager !== 'undefined' && !SoundManager.isInitialized) {
            SoundManager.init({
                masterVolume: 0.7,
                preloadCritical: true,
                maxSoundsPerCategory: 2
            });
        }

        // Configurer le déverrouillage audio global
        this.setupAudioUnlock();

        // Synchroniser les contrôles audio existants
        this.setupAudioControls();

        // Intercepter les événements du jeu
        this.hookGameEvents();

        this.isInitialized = true;

        console.log('🎵 SFX Integration initialisée !');
        console.log('🎵 ═══════════════════════════════════════');
    },

    /**
     * Configure le déverrouillage audio au premier clic
     */
    setupAudioUnlock() {
        // Événements pour déverrouiller l'audio
        const unlockEvents = ['click', 'touchstart', 'keydown'];

        const unlockHandler = async () => {
            if (typeof AudioUnlocker !== 'undefined' && !AudioUnlocker.isUnlocked) {
                console.log('🎵 Tentative de déverrouillage audio...');
                const success = await AudioUnlocker.ensureUnlocked();

                if (success) {
                    console.log('🎵 ✅ Audio déverrouillé avec succès !');
                } else {
                    // Afficher le bouton si pas encore visible
                    if (!AudioUnlocker.unlockButton) {
                        AudioUnlocker.showUnlockButton();
                    }
                }
            }
        };

        unlockEvents.forEach(event => {
            document.addEventListener(event, unlockHandler, { passive: true });
        });

        console.log('🎵 Listeners de déverrouillage audio configurés');
    },

    /**
     * Synchronise les contrôles audio avec SoundManager
     */
    setupAudioControls() {
        // #audio-toggle - Bouton mute
        const audioToggle = document.getElementById('audio-toggle');
        const audioToggleGame = document.getElementById('audio-toggle-game');

        const handleMuteToggle = (btn) => {
            if (!btn) return;

            btn.addEventListener('click', () => {
                if (typeof SoundManager !== 'undefined') {
                    const isMuted = SoundManager.toggleMute();
                    console.log(`🎵 SFX ${isMuted ? 'MUTE' : 'UNMUTE'}`);

                    // Mettre à jour les icônes
                    this.updateMuteButtons(isMuted);
                }
            });
        };

        handleMuteToggle(audioToggle);
        handleMuteToggle(audioToggleGame);

        // #volume-slider - Slider de volume
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value, 10);
                const volume = value / 100;

                if (typeof SoundManager !== 'undefined') {
                    SoundManager.setMasterVolume(volume);
                    console.log(`🎵 Volume SFX: ${value}%`);
                }
            });
        }

        console.log('🎵 Contrôles audio synchronisés avec SoundManager');
    },

    /**
     * Met à jour les boutons mute
     */
    updateMuteButtons(isMuted) {
        const buttons = [
            document.getElementById('audio-toggle'),
            document.getElementById('audio-toggle-game')
        ];

        buttons.forEach(btn => {
            if (btn) {
                btn.textContent = isMuted ? '🔇' : '🔊';
                btn.setAttribute('aria-pressed', isMuted.toString());
            }
        });
    },

    /**
     * Connecte les SFX aux événements du jeu
     */
    hookGameEvents() {
        // Hook sur le bouton COMMENCER
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.onGameStart();
            });
        }

        // Observer les changements de dialogue pour déclencher les SFX
        this.setupDialogueObserver();

        console.log('🎵 Hooks sur les événements du jeu configurés');
    },

    /**
     * Appelé au démarrage du jeu
     */
    async onGameStart() {
        console.log('🎵 🎮 Jeu démarré - Lancement de l\'ambiance...');

        // S'assurer que l'audio est déverrouillé
        if (typeof AudioUnlocker !== 'undefined') {
            await AudioUnlocker.ensureUnlocked();
        }

        // Démarrer une ambiance légère
        if (typeof NarrativeSoundManager !== 'undefined') {
            NarrativeSoundManager.startAmbient('ambience', 'digital_silence', {
                fadeIn: true,
                fadeInDuration: 2000,
                volume: 0.1
            });
        }
    },

    /**
     * Observe les changements de dialogue
     */
    setupDialogueObserver() {
        // Observer le speaker name pour détecter qui parle
        const speakerEl = document.getElementById('speaker-name');
        if (speakerEl) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        const speaker = speakerEl.textContent.trim();
                        if (speaker && speaker !== this.lastSpeaker) {
                            this.onSpeakerChange(speaker);
                            this.lastSpeaker = speaker;
                        }
                    }
                });
            });

            observer.observe(speakerEl, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }

        // Hook sur les clics pour le son d'avancement (optionnel)
        if (SFX_EVENTS.advance.enabled) {
            document.addEventListener('click', (e) => {
                const dialogueContainer = document.querySelector('.dialogue-container');
                if (dialogueContainer && dialogueContainer.contains(e.target)) {
                    this.onDialogueAdvance();
                }
            });
        }
    },

    /**
     * Appelé quand le speaker change
     */
    onSpeakerChange(speakerName) {
        // Trouver la config du speaker
        const speakerKey = this.findSpeakerKey(speakerName);
        if (!speakerKey) return;

        const config = SFX_EVENTS.speakers[speakerKey];
        if (!config) return;

        // Première apparition ? Jouer la scène narrative
        if (SpeakerTracker.isFirstTime(speakerKey) && config.firstTimeScene) {
            console.log(`🎵 🎭 Première apparition de ${speakerName} !`);
            SpeakerTracker.markSeen(speakerKey);

            // Jouer la scène narrative
            if (typeof NarrativeSoundManager !== 'undefined') {
                NarrativeSoundManager.playScene(config.firstTimeScene).catch(() => {
                    // Fallback si la scène échoue
                    this.playSFXWithFallback(config.category, config.sound, config.volume);
                });
            }
            return;
        }

        // Sinon, jouer le son avec une probabilité
        if (Math.random() < (config.chance || 0.3)) {
            console.log(`🎵 🗣️ ${speakerName} parle...`);
            this.playSFXWithFallback(config.category, config.sound, config.volume);
        }
    },

    /**
     * Trouve la clé du speaker dans la config
     */
    findSpeakerKey(speakerName) {
        const name = speakerName.toLowerCase();

        for (const key of Object.keys(SFX_EVENTS.speakers)) {
            if (name.includes(key)) {
                return key;
            }
        }

        return null;
    },

    /**
     * Joue un SFX avec fallback si échec
     */
    playSFXWithFallback(category, soundId, volume = 0.5) {
        if (typeof SoundManager === 'undefined') {
            console.warn('🎵 SoundManager non disponible');
            return null;
        }

        try {
            const instanceId = SoundManager.play(category, soundId, { volume });

            if (instanceId) {
                console.log(`🎵 ▶️ SFX joué: ${category}/${soundId}`);
            }

            return instanceId;
        } catch (e) {
            console.error(`🎵 Erreur SFX: ${category}/${soundId}`, e);
            return null;
        }
    },

    /**
     * Son d'avancement du dialogue (optionnel)
     */
    onDialogueAdvance() {
        if (this.advanceSoundCooldown) return;

        const config = SFX_EVENTS.advance;
        this.playSFXWithFallback(config.category, config.sound, config.volume);

        // Cooldown pour éviter le spam
        this.advanceSoundCooldown = true;
        setTimeout(() => {
            this.advanceSoundCooldown = false;
        }, 300);
    },

    /**
     * Joue un événement sonore prédéfini
     * @param {string} eventName - Nom de l'événement (freeze, lockdown, pain, etc.)
     */
    playEvent(eventName) {
        const config = SFX_EVENTS.events[eventName];
        if (!config) {
            console.warn(`🎵 Événement inconnu: ${eventName}`);
            return;
        }

        // Scène narrative ?
        if (config.scene && typeof NarrativeSoundManager !== 'undefined') {
            NarrativeSoundManager.playScene(config.scene).catch(() => {
                // Fallback
                if (config.fallback) {
                    this.playSFXWithFallback(
                        config.fallback.category,
                        config.fallback.sound,
                        config.fallback.volume || 0.7
                    );
                }
            });
            return;
        }

        // Son simple
        if (config.category && config.sound) {
            this.playSFXWithFallback(config.category, config.sound, config.volume);
        }
    },

    /**
     * APIs publiques pour l'intégration
     */

    // Jouer un SFX personnalisé
    play(category, soundId, options = {}) {
        return this.playSFXWithFallback(category, soundId, options.volume || 0.5);
    },

    // Jouer une scène narrative
    async playScene(sceneId) {
        if (typeof NarrativeSoundManager !== 'undefined') {
            return NarrativeSoundManager.playScene(sceneId);
        }
    },

    // Arrêter tous les SFX
    stopAll() {
        if (typeof SoundManager !== 'undefined') {
            SoundManager.stopAll({ fadeOut: true });
        }
    },

    // Diagnostic
    diagnose() {
        console.log('🎵 ═══════════════════════════════════════');
        console.log('🎵 DIAGNOSTIC SFX INTEGRATION');
        console.log('🎵 ═══════════════════════════════════════');
        console.log(`🎵 SoundManager: ${typeof SoundManager !== 'undefined' ? '✅' : '❌'}`);
        console.log(`🎵 AudioUnlocker: ${typeof AudioUnlocker !== 'undefined' ? '✅' : '❌'}`);
        console.log(`🎵 NarrativeSoundManager: ${typeof NarrativeSoundManager !== 'undefined' ? '✅' : '❌'}`);

        if (typeof AudioUnlocker !== 'undefined') {
            console.log(`🎵 Audio déverrouillé: ${AudioUnlocker.isUnlocked ? '✅' : '❌'}`);
        }

        if (typeof SoundManager !== 'undefined') {
            console.log(`🎵 Volume: ${Math.round(SoundManager.masterVolume * 100)}%`);
            console.log(`🎵 Mute: ${SoundManager.isMuted ? 'Oui' : 'Non'}`);
            console.log(`🎵 Sons actifs: ${SoundManager.activeSounds.size}`);
        }

        console.log(`🎵 Speakers vus: ${[...SpeakerTracker.firstAppearance].join(', ') || 'Aucun'}`);
        console.log('🎵 ═══════════════════════════════════════');
    }
};

// ============================================
// FONCTIONS GLOBALES POUR LE JEU
// ============================================

/**
 * Joue un SFX depuis le scénario
 * Usage dans SCENARIO: { ..., sfx: 'attacks/chromeos_attack' }
 */
function playSFX(categoryOrPath, soundId, options = {}) {
    // Format "category/soundId" ou séparé
    if (soundId === undefined && categoryOrPath.includes('/')) {
        const parts = categoryOrPath.split('/');
        return SFXIntegration.play(parts[0], parts[1], options);
    }
    return SFXIntegration.play(categoryOrPath, soundId, options);
}

/**
 * Joue un événement SFX prédéfini
 * Usage: playSFXEvent('freeze') ou playSFXEvent('pain')
 */
function playSFXEvent(eventName) {
    return SFXIntegration.playEvent(eventName);
}

/**
 * Joue une scène narrative complète
 * Usage: playSFXScene('kernel_intervention')
 */
function playSFXScene(sceneId) {
    return SFXIntegration.playScene(sceneId);
}

/**
 * Arrête tous les SFX
 */
function stopAllSFXIntegration() {
    return SFXIntegration.stopAll();
}

/**
 * Diagnostic de l'intégration SFX
 */
function diagnoseSFX() {
    SFXIntegration.diagnose();
}

// ============================================
// INITIALISATION AUTOMATIQUE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu que les autres scripts soient chargés
    setTimeout(() => {
        SFXIntegration.init();
    }, 100);
});

// ============================================
// EXPORT
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SFXIntegration,
        SFX_EVENTS,
        SpeakerTracker,
        playSFX,
        playSFXEvent,
        playSFXScene
    };
}
