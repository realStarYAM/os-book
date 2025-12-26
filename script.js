/**
 * ============================================
 * OS Book - Visual Novel Engine v4.0
 * La Saga Complète de Windows (2017-2025)
 * 4 Actes Chronologiques
 * ============================================
 */

// ============================================
// GESTIONNAIRE AUDIO
// ============================================

class AudioManager {
    constructor() {
        this.bgm = null;
        this.currentBgmPath = null;
        this.fadeInterval = null;
        this.sfxPool = [];
        this.volume = 0.5;
        this.isMuted = false;
        this.isInitialized = false;
        this.audioCache = {};
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('🔊 Audio Manager initialisé');
    }

    preload(path) {
        if (!this.audioCache[path]) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.audioCache[path] = audio;
        }
        return this.audioCache[path];
    }

    stopCurrentMusicImmediately() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        if (this.bgm) {
            try {
                this.bgm.pause();
                this.bgm.currentTime = 0;
                this.bgm.src = '';
            } catch (e) {
                console.warn('Erreur arrêt musique:', e);
            }
            this.bgm = null;
            this.currentBgmPath = null;
        }
    }

    playMusic(path, fadeIn = true) {
        this.init();

        if (this.currentBgmPath === path && this.bgm && !this.bgm.paused) {
            return;
        }

        this.stopCurrentMusicImmediately();

        this.bgm = new Audio(path);
        this.bgm.loop = true;
        this.bgm.volume = fadeIn ? 0 : this.volume * (this.isMuted ? 0 : 1);
        this.currentBgmPath = path;

        console.log('🎵 Nouvelle musique:', path);

        const playPromise = this.bgm.play();
        if (playPromise) {
            playPromise.catch(e => console.warn('Autoplay bloqué:', e));
        }

        if (fadeIn) {
            this.fadeIn(this.bgm, 2000);
        }
    }

    stopMusic(fadeOut = true) {
        if (!this.bgm) return;

        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        if (fadeOut) {
            const audioToStop = this.bgm;

            this.fadeOut(audioToStop, 1500, () => {
                try {
                    audioToStop.pause();
                    audioToStop.currentTime = 0;
                    audioToStop.src = '';
                } catch (e) {
                    console.warn('Erreur arrêt musique fade:', e);
                }
            });

            this.bgm = null;
            this.currentBgmPath = null;
        } else {
            this.stopCurrentMusicImmediately();
        }
    }

    playSFX(path, volume = 1) {
        this.init();

        const sfx = new Audio(path);
        sfx.volume = this.volume * volume * (this.isMuted ? 0 : 1);

        const playPromise = sfx.play();
        if (playPromise) {
            playPromise.catch(e => console.warn('SFX bloqué:', e));
        }

        sfx.onended = () => {
            sfx.src = '';
        };

        return sfx;
    }

    fadeIn(audio, duration) {
        const targetVolume = this.volume * (this.isMuted ? 0 : 1);
        const step = targetVolume / (duration / 50);
        audio.volume = 0;

        const fade = setInterval(() => {
            if (!audio || audio.paused) {
                clearInterval(fade);
                return;
            }

            if (audio.volume + step >= targetVolume) {
                audio.volume = targetVolume;
                clearInterval(fade);
            } else {
                audio.volume += step;
            }
        }, 50);
    }

    fadeOut(audio, duration, callback) {
        if (!audio) {
            if (callback) callback();
            return;
        }

        const startVolume = audio.volume;
        const step = startVolume / (duration / 50);

        this.fadeInterval = setInterval(() => {
            if (!audio || audio.paused) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                if (callback) callback();
                return;
            }

            if (audio.volume - step <= 0) {
                audio.volume = 0;
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                if (callback) callback();
            } else {
                audio.volume -= step;
            }
        }, 50);
    }

    setVolume(value) {
        this.volume = value;
        if (this.bgm && !this.isMuted) {
            this.bgm.volume = value;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgm) {
            this.bgm.volume = this.isMuted ? 0 : this.volume;
        }
        return this.isMuted;
    }
}

// ============================================
// ANIMATION ECG / MONITEUR CARDIAQUE
// ============================================

class HeartMonitor {
    constructor() {
        this.element = document.getElementById('heart-monitor');
        this.ecgPath = document.getElementById('ecg-path');
        this.bpmValue = document.getElementById('bpm-value');
        this.monitorLabel = document.querySelector('.monitor-label');

        this.isRunning = false;
        this.bpm = 72;
        this.animationFrame = null;

        this.monitorSound = null;
        this.monitorSoundPath = 'sfx/monitor.mp3';
        this.monitorVolume = 0.3;
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
            this.monitorSound = new Audio(this.monitorSoundPath);
            this.monitorSound.loop = true;
            this.monitorSound.volume = volume;

            const playPromise = this.monitorSound.play();
            if (playPromise) {
                playPromise.catch(e => console.warn('Son moniteur bloqué:', e));
            }
        } catch (e) {
            console.warn('Erreur lecture son moniteur:', e);
        }
    }

    stopSound() {
        if (this.monitorSound) {
            try {
                this.monitorSound.pause();
                this.monitorSound.currentTime = 0;
                this.monitorSound.src = '';
            } catch (e) {
                console.warn('Erreur arrêt son moniteur:', e);
            }
            this.monitorSound = null;
        }
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
    }
};

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
        text: "Acte 1 - L'Aube (2001) : Windows 1.0 à Windows 95 ont ouvert la voie.",
        emotion: 'normal',
        characters: { left: 'windows98', center: null, right: 'windowsme' },
        music: 'music/95 (Windows Classic Remix).mp3'
    },
    {
        scene: 'void',
        speaker: 'windows98',
        text: "Oh nonnnnnnn ! Tous sont morts...",
        emotion: 'fear',
        characters: { left: 'windows98', center: null, right: 'windowsme' },
        shake: true  // Les personnages tremblent
    },
    {
        scene: 'void',
        speaker: 'windowsme',
        text: "*tremble* Qu'est-ce qu'on va devenir ?!",
        emotion: 'fear',
        characters: { left: 'windows98', center: null, right: 'windowsme' },
        shake: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Soudain, une lumière aveuglante...",
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
        text: "C'est qui ?!",
        emotion: 'surprised',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windowsme',
        text: "Woah ! D'où il sort celui-là ?!",
        emotion: 'surprised',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "Je suis Windows XP.",
        emotion: 'confident',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windows98',
        text: "Hein ?! Tu es nouveau ?!",
        emotion: 'surprised',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windowsme',
        text: "On ne t'a jamais vu avant !",
        emotion: 'surprised',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "Je suis là pour prendre la relève. Une nouvelle ère commence.",
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
        text: "Acte 2 - L'Ère Multimédia (2006) : Windows 98 et Me nous ont quittés.",
        emotion: 'normal',
        characters: { left: 'windows98', center: 'xp', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Windows 2000 les rejoint pour les derniers adieux...",
        emotion: 'normal',
        characters: { left: 'windows98', center: 'windows2000', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windows98',
        text: "Notre temps est venu...",
        emotion: 'sad',
        characters: { left: 'windows98', center: 'windows2000', right: 'windowsme' }
    },
    {
        scene: 'void',
        speaker: 'windowsme',
        text: "Au revoir...",
        emotion: 'dying-slow',
        characters: { left: 'windows98', center: 'windows2000', right: 'windowsme' },
        fadeOutSides: true
    },
    {
        scene: 'void',
        speaker: 'windows2000',
        text: "Nonnnnnnn !",
        emotion: 'fear',
        characters: { left: null, center: 'windows2000', right: 'xp' }
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "Non ! Pas eux aussi !",
        emotion: 'fear',
        characters: { left: null, center: 'windows2000', right: 'xp' },
        xpCrying: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Windows XP, submergé par l'émotion, commence à trembler...",
        emotion: 'normal',
        characters: { left: null, center: 'windows2000', right: 'xp' },
        xpCrying: true
    },
    {
        scene: 'void',
        speaker: 'windows2000',
        text: "XP... Viens là.",
        emotion: 'sad',
        characters: { left: null, center: 'windows2000', right: 'xp' },
        hugAnimation: true
    },
    {
        scene: 'void',
        speaker: 'windows2000',
        text: "Ça va aller, XP. Je suis là.",
        emotion: 'normal',
        characters: { left: null, center: 'windows2000', right: 'xp' },
        hugging: true
    },
    {
        scene: 'void',
        speaker: 'xp',
        text: "*snif* ... Merci, 2000...",
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
        text: "Acte 3 - Le Professionnel (2010) : Windows 2000 a tiré sa révérence.",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows2000', right: 'vista' },
        music: 'sfx/monitor.mp3',
        showMonitor: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Windows 7 arrive pour rejoindre les autres au chevet de Windows 2000...",
        emotion: 'normal',
        characters: { left: 'xp', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'xp',
        text: "Oh non !!!!",
        emotion: 'fear',
        characters: { left: 'xp', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "La pauvre !",
        emotion: 'sad',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "Nonnnnnnn !",
        emotion: 'fear',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'windows2000',
        text: "Je suis très malade...",
        emotion: 'dying-slow',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Le moniteur cardiaque s'arrête...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'windows2000', right: 'windows7' },
        flatline: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Windows 2000 s'éteint paisiblement...",
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
        text: "Une silhouette apparaît dans un coin de la pièce...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'windows2000', right: 'ubuntu' },
        ubuntuAppear: true
    },
    {
        scene: 'hospital',
        speaker: 'ubuntu',
        text: "Je suis désolé.",
        emotion: 'sad',
        characters: { left: 'vista', center: 'windows2000', right: 'ubuntu' }
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
        text: "Acte 4 - La Légende (2014) : Windows XP est entré dans l'histoire.",
        emotion: 'normal',
        characters: { left: null, center: 'xp', right: null },
        music: 'music/Windows XP installation music.mp3',
        showMonitor: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "La chambre est pleine de visiteurs venus dire adieu à la légende...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'xp', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Même les plus jeunes générations sont là pour rendre hommage...",
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
        text: "XP... Tu ne peux pas nous quitter comme ça !",
        emotion: 'fear',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        shake: true
    },
    {
        scene: 'hospital',
        speaker: 'windows8',
        text: "La légende... Elle va vraiment partir ?",
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
        text: "Merci pour tout, les amis...",
        emotion: 'dying-slow',
        characters: { left: 'vista', center: 'xp', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'xp',
        text: "J'ai été... le système le plus utilisé au monde. Pendant 13 ans...",
        emotion: 'dying-slow',
        characters: { left: 'vista', center: 'xp', right: 'windows7' }
    },
    {
        scene: 'hospital',
        speaker: 'xp',
        text: "Prends soin... de l'héritage...",
        emotion: 'dying-slow',
        characters: { left: 'windows8', center: 'xp', right: 'windows81' }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Le moniteur cardiaque émet un dernier bip...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        flatline: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Windows XP, la légende vivante, s'éteint paisiblement...",
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
        text: "Tous baissent la tête en silence, rendant un dernier hommage à celui qui a changé l'histoire...",
        emotion: 'normal',
        characters: { left: 'vista', center: 'xp', right: 'windows7' },
        bowHeads: true
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
        text: "Acte 5 - L'Incompris (2016) : Windows 8 s'éteint prématurément.",
        emotion: 'normal',
        characters: { left: null, center: 'windows8', right: null },
        music: 'sfx/monitor.mp3',
        showMonitor: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "À son chevet, son frère jumeau Windows 8.1 et le petit Windows 10, à peine né l'année précédente...",
        emotion: 'normal',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows8',
        text: "C'est déjà fini ? Mais je viens d'arriver...",
        emotion: 'dying-slow',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows8',
        text: "J'ai à peine 4 ans.",
        emotion: 'dying-slow',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows81',
        text: "Je suis désolé, frère. La transition est obligatoire.",
        emotion: 'sad',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows8',
        text: "Promets-moi... qu'ils retrouveront le bouton Démarrer.",
        emotion: 'dying-slow',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows81',
        text: "Je le promets.",
        emotion: 'sad',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Le moniteur s'arrête brusquement...",
        emotion: 'normal',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' },
        flatline: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Windows 8 disparaît rapidement, sa vie écourtée par l'évolution...",
        emotion: 'normal',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' },
        fastDeathEffect: 'windows8'
    },
    {
        scene: 'hospital',
        speaker: 'windows10',
        text: "Il est parti où ?",
        emotion: 'normal',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
    },
    {
        scene: 'hospital',
        speaker: 'windows81',
        text: "Il fait partie de nous maintenant.",
        emotion: 'sad',
        characters: { left: 'windows81', center: 'windows8', right: 'windows10' }
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
        text: "ACTE 6 : L'Adieu de Vista",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        music: 'music/Hello Windows Vista Vista Sounds Remix High Quality.mp3'
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Quelque part dans le cyberespace, un hôpital virtuel accueille les systèmes d'exploitation en fin de vie...",
        emotion: 'normal',
        characters: { left: null, center: null, right: null }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Avril 2017. Windows Vista, après des années de service controversé, vit ses derniers instants.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        showMonitor: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Windows 7, son successeur et ami fidèle, est venu lui dire adieu...",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "Vista... Comment tu te sens ?",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "*tousse* ... J'ai connu des jours meilleurs, petit frère...",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "Ne dis pas ça ! Tu vas t'en sortir... Microsoft va prolonger ton support !",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "Haha... Toujours l'optimiste. Mais toi et moi savons que c'est fini...",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "Tu sais... Quand je suis sorti en 2007, les gens m'ont détesté.",
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
        text: "Vista... Ce n'était pas de ta faute. Le matériel n'était pas prêt pour toi.",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "Peut-être... Mais j'ai ouvert la voie. L'interface Aero, la sécurité UAC... C'était moi.",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "Et sans toi, je n'existerais pas. J'ai hérité de tout ce que tu as créé.",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Le moniteur cardiaque commence à ralentir...",
        emotion: 'normal',
        characters: { left: 'windows7', center: 'vista', right: null },
        slowHeartbeat: true
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "Je... je sens que c'est bientôt fini...",
        emotion: 'fear',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "Non ! Vista, reste avec moi !",
        emotion: 'fear',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "Prends soin de nos utilisateurs. Sois meilleur que moi...",
        emotion: 'sad',
        characters: { left: 'windows7', center: 'vista', right: null }
    },
    {
        scene: 'hospital',
        speaker: 'vista',
        text: "Adieu, Windows 7... Tu as été... le meilleur d'entre nous...",
        emotion: 'dying-slow',
        characters: { left: 'windows7', center: 'vista', right: null },
        flatline: true,
        stopMusic: true
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Le moniteur émet un long bip continu. Windows Vista s'éteint...",
        emotion: 'normal',
        characters: { left: 'windows7', center: null, right: null }
    },
    {
        scene: 'hospital',
        speaker: 'windows7',
        text: "VISTA !!!",
        emotion: 'fear',
        characters: { left: 'windows7', center: null, right: null }
    },
    {
        scene: 'hospital',
        speaker: 'narrator',
        text: "Ce jour-là, Windows 7 fit une promesse silencieuse...",
        emotion: 'normal',
        characters: { left: 'windows7', center: null, right: null },
        hideMonitor: true
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
        text: "ACTE 7 : L'Adieu de Windows 7",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        music: 'music/Windows 7 Remix 2 (By SilverWolf).mp3'
    },
    {
        scene: 'graveyard',
        speaker: 'narrator',
        text: "Le cimetière numérique. Janvier 2020.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        graves: ['vista']
    },
    {
        scene: 'graveyard',
        speaker: 'narrator',
        text: "Windows 7 a tenu sa promesse pendant 11 ans. Mais son heure est venue à son tour.",
        emotion: 'normal',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "Je n'arrive pas à croire qu'on enterre Windows 7 aujourd'hui...",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' },
        graves: ['vista', 'windows7']
    },
    {
        scene: 'graveyard',
        speaker: 'windows8',
        text: "Il était tellement aimé. Les utilisateurs ne voulaient pas le quitter...",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "Certains l'utilisent encore. Ils refusent de passer à moi.",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows8',
        text: "C'est bizarre, non ? Vista était détesté, mais 7 était adoré...",
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
        text: "Ne dis pas ça, Windows 8. Tu as apporté le tactile, l'interface moderne...",
        emotion: 'normal',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows8',
        text: "*soupire* ... J'ai supprimé le bouton Démarrer. Ils ne m'ont jamais pardonné.",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "Tu sais ce que Windows 7 m'a dit avant de partir ?",
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
        text: "Alors porte-le bien, Windows 10. Pour Vista, pour 7... et pour moi, bientôt.",
        emotion: 'sad',
        characters: { left: 'windows8', center: null, right: 'windows10' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "Ne parle pas comme ça... Tu as encore du temps devant toi.",
        emotion: 'fear',
        characters: { left: 'windows8', center: null, right: 'windows10' }
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
        text: "ACTE 8 : L'Adieu de Windows 8.1",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        music: 'music/Windows VistaWindows 7 Sounds Remix.mp3',
        graves: ['vista', 'windows7']
    },
    {
        scene: 'graveyard',
        speaker: 'narrator',
        text: "Le cimetière numérique. Janvier 2023. Une nouvelle tombe s'ajoute à la liste.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' },
        graves: ['vista', 'windows7', 'windows8']
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "Windows 8.1 s'est éteint aujourd'hui. Comme promis, je suis là.",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows11',
        text: "C'est... c'est la première fois que j'assiste à un enterrement.",
        emotion: 'fear',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "Bienvenue dans la famille, Windows 11. C'est comme ça que ça se passe chez nous.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows11',
        text: "Mais... tu ne vas pas t'éteindre toi aussi, n'est-ce pas ?",
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
        text: "Un jour, oui. Chaque Windows a son heure. C'est ainsi.",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows11',
        text: "Je ne veux pas que tu partes ! Tu es le plus populaire de tous !",
        emotion: 'fear',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "*sourit tristement* ... Windows 7 aussi était populaire. Ça n'a pas empêché Microsoft.",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "Écoute-moi bien, Windows 11. Quand mon heure viendra...",
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
        text: "Je... je te le promets.",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'graveyard',
        speaker: 'windows10',
        text: "C'est bien. Maintenant, profitons du temps qu'il nous reste ensemble.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
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
        text: "ACTE 9 : La Fin d'une Ère",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        music: 'music/Windows Vienna Sounds Remix.mp3'
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Le Vide. 14 Octobre 2025. La date fatidique est arrivée.",
        emotion: 'normal',
        characters: { left: null, center: null, right: null }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Microsoft met fin au support de Windows 10. Le plus grand de tous s'apprête à partir.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "Windows 10... s'il te plaît... ne pars pas...",
        emotion: 'fear',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "C'est l'heure, Windows 11. 10 ans de service... c'était une belle course.",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "Mais des milliards de personnes t'utilisent encore ! Tu ne peux pas partir !",
        emotion: 'fear',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "C'est exactement ce qu'on disait pour Windows 7... et pourtant.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "Tu te souviens de ma promesse à Vista ? Celle de Windows 7 ?",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "J'ai porté leur héritage pendant 10 ans. Maintenant, c'est ton tour.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "Je ne suis pas prêt... Les gens ne m'aiment pas autant que toi...",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "Vista non plus n'était pas aimé. Et pourtant, sans lui, rien de tout cela n'existerait.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "L'amour des utilisateurs n'est pas ce qui compte. C'est ce que tu laisses derrière toi.",
        emotion: 'normal',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "*pleure* ... Je ne t'oublierai jamais...",
        emotion: 'sad',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "Je sais. C'est pour ça que j'ai confiance en toi.",
        emotion: 'happy',
        characters: { left: 'windows10', center: null, right: 'windows11' }
    },
    {
        scene: 'void',
        speaker: 'windows10',
        text: "Adieu, Windows 11. Sois le meilleur Windows que cette famille n'a jamais eu.",
        emotion: 'dying-slow',
        characters: { left: 'windows10', center: null, right: 'windows11' },
        stopMusic: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Windows 10 s'éteint doucement, rejoignant ses prédécesseurs dans l'histoire.",
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
        text: "Je suis le dernier...",
        emotion: 'sad',
        characters: { left: null, center: 'windows11', right: null },
        lonelyCharacter: true
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Dans le silence du Vide, Windows 11 reste seul, portant sur ses épaules l'héritage de toute une famille.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "De Vista à Windows 10, chacun a apporté quelque chose. Chacun a sacrifié quelque chose.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null },
        music: 'music/Windows 11 Remix.mp3'
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "Je porterai votre héritage. Pour tous ceux qui vous ont aimés... et détestés.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "Car c'est ça, être un Windows. Naître, être critiqué, être aimé... puis partir.",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Et l'histoire continue...",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },

    // ========================================
    // ACTE 10 : LE FUTUR (2026)
    // L'arrivée surprise de Windows 12
    // ========================================
    {
        isTransition: true,
        transitionText: "2026\\nLe Futur",
        duration: 3000
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Acte 10 - Le Futur (2026).",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Windows 11 contemple l'horizon numérique, confiant en son avenir...",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "Soudain, une lumière aveuglante apparaît...",
        emotion: 'normal',
        characters: { left: null, center: 'windows11', right: null }
    },
    {
        scene: 'void',
        speaker: 'windows12',
        text: "",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'windows12', right: null },
        windows12Appear: true,
        sfx: 'sfx/startup.mp3'
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "😱 !!!",
        emotion: 'fear',
        characters: { left: 'windows11', center: 'windows12', right: null },
        shake: true
    },
    {
        scene: 'void',
        speaker: 'windows11',
        text: "Mais... je viens juste d'arriver ?!",
        emotion: 'fear',
        characters: { left: 'windows11', center: 'windows12', right: null },
        shake: true
    },
    {
        scene: 'void',
        speaker: 'windows12',
        text: "L'avenir n'attend pas.",
        emotion: 'normal',
        characters: { left: 'windows11', center: 'windows12', right: null }
    },
    {
        scene: 'void',
        speaker: 'narrator',
        text: "...",
        emotion: 'normal',
        characters: { left: null, center: null, right: null },
        abruptEnd: true,
        isFinalScene: true
    }
];

// ============================================
// MOTEUR DU VISUAL NOVEL
// ============================================

class VisualNovelEngine {
    constructor() {
        this.currentSceneIndex = 0;
        this.currentSceneId = 'hospital';
        this.isTyping = false;
        this.typingSpeed = 35;
        this.canAdvance = false;

        this.audioManager = new AudioManager();
        this.heartMonitor = new HeartMonitor();

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

        this.bindEvents();
        this.setupAudioControls();
    }

    setupAudioControls() {
        const audioToggle = document.getElementById('audio-toggle');
        const audioToggleGame = document.getElementById('audio-toggle-game');
        const volumeSlider = document.getElementById('volume-slider');

        const toggleMute = () => {
            const muted = this.audioManager.toggleMute();
            audioToggle.textContent = muted ? '🔇' : '🔊';
            audioToggle.classList.toggle('muted', muted);
            if (audioToggleGame) {
                audioToggleGame.textContent = muted ? '🔇' : '🔊';
                audioToggleGame.classList.toggle('muted', muted);
            }
        };

        audioToggle.addEventListener('click', toggleMute);
        if (audioToggleGame) {
            audioToggleGame.addEventListener('click', toggleMute);
        }

        volumeSlider.addEventListener('input', (e) => {
            this.audioManager.setVolume(e.target.value / 100);
        });

        this.audioManager.setVolume(volumeSlider.value / 100);
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        // Le bouton restart sera ajouté dynamiquement dans les crédits

        this.screens.vn.addEventListener('click', () => {
            this.handleAdvance();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                if (this.screens.vn.classList.contains('active')) {
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
        setTimeout(() => this.playScene(), 600);
    }

    restartGame() {
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
        if (this.isTyping) {
            this.skipTyping();
        } else if (this.canAdvance) {
            this.nextScene();
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
            this.transitionText.innerHTML = text.replace('\n', '<br>');
            this.transitionText.style.animation = 'none';

            this.transitionText.offsetHeight;

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
            elements.slot.classList.remove('lonely', 'shake', 'xp-appear', 'fade-out-goodbye', 'crying', 'hug-animation', 'hugging-left', 'hugging-right', 'death-effect', 'ubuntu-appear', 'bow-head', 'fast-death-effect', 'windows12-appear');

            if (charId) {
                const character = CHARACTERS[charId];

                elements.slot.classList.add('visible');
                elements.img.src = character.image;
                elements.img.alt = character.name;
                elements.name.textContent = character.name;

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
                if (scene.shake) {
                    elements.slot.classList.add('shake');
                }

                // Apply XP dramatic appearance effect
                if (scene.xpAppear && charId === 'xp' && pos === 'center') {
                    elements.slot.classList.add('xp-appear');
                }

                // Apply fadeOutSides effect (98 and ME disappear)
                if (scene.fadeOutSides && (pos === 'left' || pos === 'right')) {
                    elements.slot.classList.add('fade-out-goodbye');
                }

                // Apply XP crying effect (trembling with tears)
                if (scene.xpCrying && charId === 'xp') {
                    elements.slot.classList.add('crying');
                }

                // Apply hug animation (2000 moves toward XP)
                if (scene.hugAnimation && charId === 'windows2000') {
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
                if (scene.deathEffect && charId === scene.deathEffect) {
                    elements.slot.classList.add('death-effect');
                }

                // Apply Ubuntu appearance effect
                if (scene.ubuntuAppear && charId === 'ubuntu') {
                    elements.slot.classList.add('ubuntu-appear');
                }

                // Apply bow heads effect (characters lower their heads in mourning)
                if (scene.bowHeads && pos !== 'center') {
                    elements.slot.classList.add('bow-head');
                }

                // Apply fast death effect (quick disappearance - Windows 8)
                if (scene.fastDeathEffect && charId === scene.fastDeathEffect) {
                    elements.slot.classList.add('fast-death-effect');
                }

                // Apply Windows 12 flash appearance effect
                if (scene.windows12Appear && charId === 'windows12') {
                    elements.slot.classList.add('windows12-appear');
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
        slot.classList.remove('fear', 'sad', 'happy', 'angry', 'dying', 'dying-slow', 'shake', 'fade-out-goodbye', 'crying', 'hug-animation', 'hugging-left', 'hugging-right', 'death-effect', 'ubuntu-appear', 'bow-head', 'fast-death-effect', 'windows12-appear');
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
        this.elements.dialogueText.innerHTML = '';

        let index = 0;
        this.currentTypingText = text;

        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';

        this.typingInterval = setInterval(() => {
            if (index < text.length) {
                this.elements.dialogueText.textContent = text.substring(0, index + 1);
                this.elements.dialogueText.appendChild(cursor);
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

        const cursor = this.elements.dialogueText.querySelector('.typing-cursor');
        if (cursor) cursor.remove();

        this.elements.continueIndicator.style.visibility = 'visible';
    }

    skipTyping() {
        clearInterval(this.typingInterval);
        this.elements.dialogueText.textContent = this.currentTypingText;
        this.finishTyping();
    }

    nextScene() {
        this.canAdvance = false;
        this.currentSceneIndex++;
        this.playScene();
    }

    resetCharacters() {
        [this.elements.charLeft, this.elements.charCenter, this.elements.charRight].forEach(char => {
            char.slot.classList.remove('visible', 'speaking', 'lonely');
            this.clearEmotions(char.slot);
        });
    }

    endGame() {
        setTimeout(() => {
            this.audioManager.stopMusic();
            this.heartMonitor.hide();
            this.hideGraves();
            this.showMemorial();
            this.transitionScreen(this.screens.vn, this.screens.end);
            this.resetCharacters();
        }, 3000);
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

document.addEventListener('DOMContentLoaded', () => {
    window.vnEngine = new VisualNovelEngine();
});
