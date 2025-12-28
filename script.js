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
        this.monitorSoundPath = 'sfx/Monitor.mp3';
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
    }
};

// ============================================
// CONFIGURATION DES CHAPITRES
// Index calculés manuellement depuis les transitions du SCENARIO
// ============================================

const CHAPTERS = [
    { id: 'prologue', name: "Prologue", desc: "L'Aube de XP (2001)", icon: "🌅", startIndex: 0 },
    { id: 'acte2', name: "Acte 2", desc: "L'Ère Multimédia (2006)", icon: "📀", startIndex: 12 },
    { id: 'acte3', name: "Acte 3", desc: "Le Professionnel (2010)", icon: "💼", startIndex: 24 },
    { id: 'acte4', name: "Acte 4", desc: "La Légende XP (2014)", icon: "👑", startIndex: 38 },
    { id: 'acte5', name: "Acte 5", desc: "L'Incompris - Win 8 (2016)", icon: "💔", startIndex: 55 },
    { id: 'acte6', name: "Acte 6", desc: "L'Adieu de Vista (2017)", icon: "🏥", startIndex: 70 },
    { id: 'acte7', name: "Acte 7", desc: "L'Adieu de Win 7 (2020)", icon: "⚰️", startIndex: 90 },
    { id: 'acte8', name: "Acte 8", desc: "L'Adieu de Win 8.1 (2023)", icon: "🔧", startIndex: 110 },
    { id: 'acte9', name: "Acte 9", desc: "La Fin de Win 10 (2025)", icon: "🌌", startIndex: 130 },
    { id: 'acte10', name: "Acte 10", desc: "Le Futur (2026)", icon: "🚀", startIndex: 160 },
    { id: 'arc2', name: "Arc 2", desc: "Le Monde Oublié", icon: "🌀", startIndex: 186, requiresArc1: true },
    { id: 'arc2_ch2', name: "Arc 2 — Chapitre 2", desc: "La Guerre des OS", icon: "⚔️", startIndex: 203, requiresArc2: true },
    { id: 'arc2_ch3', name: "Arc 2 — Chapitre 3", desc: "Le Cloud Noir", icon: "☁️", startIndex: 221, requiresArc2Ch2: true },
    { id: 'arc2_ch4', name: "Arc 2 — Chapitre 4", desc: "Entrée dans le Cloud Noir", icon: "🌀", startIndex: 239, requiresArc2Ch3: true }
];

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
        finalRestart: true,
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
        arcEnd: 'arc2_ch4'
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
                name: document.getElementById('char-left-name')
            },
            charCenter: {
                slot: document.getElementById('character-center'),
                img: document.getElementById('char-center-img'),
                name: document.getElementById('char-center-name')
            },
            charRight: {
                slot: document.getElementById('character-right'),
                img: document.getElementById('char-right-img'),
                name: document.getElementById('char-right-name')
            }
        };

        this.menuOpen = false;

        this.bindEvents();
        this.setupAudioControls();
        this.bindReducedMotionListener();
        this.setupMenu();
        this.setupChapterModal();
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

            this.handleAdvance();
        });

        document.addEventListener('keydown', (e) => {
            // ESC pour ouvrir/fermer le menu
            if (e.code === 'Escape') {
                if (this.screens.vn.classList.contains('active')) {
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
                if (this.screens.vn.classList.contains('active') && !this.menuOpen) {
                    e.preventDefault();
                    this.handleAdvance();
                }
            }
        });
    }

    startGame() {
        this.audioManager.init();
        this.transitionScreen(this.screens.start, this.screens.vn);
        this.currentSceneIndex = 0;
        this.currentSceneId = 'hospital';
        this.finalRestartShown = false;
        setTimeout(() => this.playScene(), 600);
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
        this.currentSceneIndex = 0;
        this.currentSceneId = 'hospital';
        this.heartMonitor.hide();
        this.hideGraves();
        this.changeSceneBackground('hospital');
        this.resetCharacters();
        // Relancer la première scène
        setTimeout(() => this.playScene(), 300);
    }

    returnToStartScreen() {
        // Arrêter la musique
        this.audioManager.stopMusic();
        this.audioManager.stopSFX();
        // Réinitialiser l'UI
        this.finalRestartShown = false;
        this.currentSceneIndex = 0;
        this.currentSceneId = 'hospital';
        this.heartMonitor.hide();
        this.hideGraves();
        this.changeSceneBackground('hospital');
        this.resetCharacters();
        // Retour à l'écran de démarrage
        this.transitionScreen(this.screens.vn, this.screens.start);
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

    renderChapterList() {
        const chapterList = document.getElementById('chapter-list');
        if (!chapterList) return;

        const maxProgress = this.getProgress();

        // Index de l'Acte 10 - Arc 2 se débloque quand on atteint l'Acte 10
        const acte10 = CHAPTERS.find(ch => ch.id === 'acte10');
        const arc1EndIndex = acte10 ? acte10.startIndex : 160;

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
                const arc2StartIndex = arc2 ? arc2.startIndex : 186;
                isUnlocked = maxProgress >= arc2StartIndex;
            } else if (chapter.requiresArc2Ch2) {
                // Arc 2 Chapitre 3 se débloque quand on a atteint Arc 2 Chapitre 2
                const arc2Ch2 = CHAPTERS.find(ch => ch.id === 'arc2_ch2');
                const arc2Ch2StartIndex = arc2Ch2 ? arc2Ch2.startIndex : 203;
                isUnlocked = maxProgress >= arc2Ch2StartIndex;
            } else if (chapter.requiresArc2Ch3) {
                // Arc 2 Chapitre 4 se débloque quand on a atteint Arc 2 Chapitre 3
                const arc2Ch3 = CHAPTERS.find(ch => ch.id === 'arc2_ch3');
                const arc2Ch3StartIndex = arc2Ch3 ? arc2Ch3.startIndex : 221;
                isUnlocked = maxProgress >= arc2Ch3StartIndex;
            } else {
                isUnlocked = maxProgress >= chapter.startIndex;
            }

            const item = document.createElement('div');
            item.className = `chapter-item${isUnlocked ? '' : ' locked'}`;
            item.dataset.chapterId = chapter.id;
            item.dataset.startIndex = chapter.startIndex;

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
        }
    }

    closeChapterModal() {
        const chapterModal = document.getElementById('chapter-modal');
        if (chapterModal) {
            chapterModal.classList.remove('open');
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
                grave.innerHTML = `
                    <span class="grave-cross">✝</span>
                    <img src="${character.image}" alt="${character.name}" class="grave-image">
                    <span class="grave-name">${character.name}</span>
                    <span class="grave-dates">${character.dates || ''}</span>
                `;
                this.gravesContainer.appendChild(grave);
            }
        });

        this.gravesContainer.classList.add('visible');
    }

    hideGraves() {
        this.gravesContainer.classList.remove('visible');
        this.gravesContainer.innerHTML = '';
    }

    async playScene() {
        if (this.currentSceneIndex >= SCENARIO.length) {
            this.endGame();
            return;
        }

        const scene = SCENARIO[this.currentSceneIndex];

        const progress = ((this.currentSceneIndex + 1) / SCENARIO.length) * 100;
        this.elements.progressFill.style.width = `${progress}%`;


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

        if (scene.graves) {
            this.showGraves(scene.graves);
        } else if (this.currentSceneId === 'void') {
            this.hideGraves();
        }

        this.handleAudio(scene);
        this.handleMonitor(scene);
        this.updateCharacters(scene);
        this.updateDialogue(scene);
    }

    handleAudio(scene) {
        if (scene.music) {
            this.audioManager.playMusic(scene.music);
        }

        if (scene.stopMusic) {
            this.audioManager.stopMusic(true);
        }

        if (scene.sfx) {
            setTimeout(() => {
                this.audioManager.playSFX(scene.sfx);
            }, 500);
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

        positions.forEach((pos, index) => {
            const charId = scene.characters[pos];
            const elements = charElements[index];

            // Remove effects
            elements.slot.classList.remove('lonely', 'shake', 'xp-appear', 'fade-out-goodbye', 'crying', 'hug-animation', 'hugging-left', 'hugging-right', 'death-effect', 'ubuntu-appear', 'bow-head', 'fast-death-effect', 'windows12-appear', 'kernel', 'villain', 'chromeos-appear', 'ssj', 'ssj-calm', 'chromeos-weakening', 'chromeos-glitch', 'chromeos-disconnect', 'chromeos-death');

            if (charId) {
                const character = CHARACTERS[charId];

                elements.slot.classList.add('visible');
                elements.img.src = character.image;
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

                // Apply ChromeOS weakening effect (losing power)
                if (scene.chromeosWeakening && charId === 'chromeos' && !this.reduceMotion) {
                    elements.slot.classList.add('chromeos-weakening');
                }

                // Apply ChromeOS glitch effect (visual bug)
                if (scene.chromeosGlitch && charId === 'chromeos' && !this.reduceMotion) {
                    elements.slot.classList.add('chromeos-glitch');
                }

                // Apply ChromeOS disconnect effect (losing connection)
                if (scene.chromeosDisconnect && charId === 'chromeos' && !this.reduceMotion) {
                    elements.slot.classList.add('chromeos-disconnect');
                }

                // Apply ChromeOS death effect (final disappearance)
                if (scene.chromeosDeath && charId === 'chromeos' && !this.reduceMotion) {
                    elements.slot.classList.add('chromeos-death');
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

        this.elements.speakerName.textContent = character.name;
        this.elements.speakerName.style.background = `linear-gradient(135deg, ${character.color}, ${this.adjustColor(character.color, 30)})`;

        this.elements.continueIndicator.style.visibility = 'hidden';

        this.typeText(scene.text);
    }

    typeText(text) {
        this.isTyping = true;
        this.canAdvance = false;
        this.elements.dialogueVisual.textContent = '';
        this.elements.dialogueLive.textContent = '';

        let index = 0;
        this.currentTypingText = text;

        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';

        if (this.reduceMotion || this.typingSpeed === 0) {
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
        const currentScene = SCENARIO[this.currentSceneIndex];

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
// CONTROLES MEDIA PLAYER (Taskbar Aero)
// Contrôle UNIQUEMENT la musique de fond (musicPlayer)
// ============================================

function setPlayPauseState(isPlaying) {
    const btn = document.getElementById('play-pause-btn');
    const btnImg = btn?.querySelector('img');
    if (!btn || !btnImg) return;

    btnImg.src = isPlaying ? 'Media Player/Break.png' : 'Media Player/Play.png';
    btn.classList.toggle('playing', isPlaying);
    btn.setAttribute('aria-pressed', isPlaying.toString());
}

function setupTaskbarControls() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const stopBtn = document.getElementById('wmp-stop');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', stopAudio);
    }
}

function togglePlayPause() {
    if (!musicPlayer || !musicPlayer.src) return;

    if (musicPlayer.paused) {
        musicPlayer.play().then(() => {
            setPlayPauseState(true);
        }).catch(e => console.warn('Erreur lecture:', e));
    } else {
        musicPlayer.pause();
        setPlayPauseState(false);
    }
}

function stopAudio() {
    const titleEl = document.getElementById('wmp-title');
    const timerEl = document.getElementById('wmp-timer');

    if (musicPlayer) {
        musicPlayer.pause();
        musicPlayer.currentTime = 0;
    }

    setPlayPauseState(false);
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
    if (musicPlayer && !musicPlayer.paused && musicPlayer.src) {
        setPlayPauseState(true);
    } else {
        setPlayPauseState(false);
    }
}, 500);

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    window.vnEngine = new VisualNovelEngine();
    setupTaskbarControls();
});
