# 🔊 OS Book - Sound Manager

## Documentation du Gestionnaire d'Effets Sonores

Le Sound Manager est un système JavaScript pur pour gérer les effets sonores (SFX) dans le visual novel "OS Book".

---

## 📁 Structure des Fichiers

```
os-book/
├── sfx/                          # Dossier des effets sonores
│   ├── ambience/                 # Sons d'ambiance
│   │   ├── Monitor.mp3
│   │   ├── absolute_digital_silence.wav
│   │   └── os_reality_pause.wav
│   ├── attacks/                  # Sons d'attaque
│   │   ├── chromeos_attack.wav
│   │   └── chromeos_corruption.wav
│   ├── freeze/                   # Sons de gel
│   │   ├── chromeos_frozen_by_kernel.wav
│   │   ├── system_freeze_total.wav
│   │   ├── time_freeze_glitch.wav
│   │   └── ui_frozen_state.wav
│   ├── kernel/                   # Sons divins (Kernel)
│   │   ├── divine_kernel_override.wav
│   │   ├── kernel_divine_intervention.wav
│   │   └── kernel_time_stop.wav
│   ├── lockdown/                 # Sons de verrouillage
│   │   ├── system_hard_lock.wav
│   │   └── system_lockdown.wav
│   └── pain/                     # Sons de douleur
│       └── os_digital_pain.wav
├── soundManager.js               # Le Sound Manager principal
├── soundManager.examples.js      # Exemples d'utilisation
└── SOUND_MANAGER_README.md       # Ce fichier
```

---

## 🚀 Démarrage Rapide

### Jouer un son simple

```javascript
// Syntaxe : SoundManager.play(catégorie, idDuSon, options)
SoundManager.play('attacks', 'chromeos_attack');
SoundManager.play('kernel', 'divine_intervention');
SoundManager.play('freeze', 'system_freeze');
```

### Jouer un son en boucle

```javascript
const ambientId = SoundManager.play('ambience', 'monitor', { loop: true });

// Plus tard, arrêter
SoundManager.stop(ambientId);
```

### Utiliser une scène narrative prédéfinie

```javascript
// Scènes disponibles :
await NarrativeSoundManager.playScene('chromeos_attack');
await NarrativeSoundManager.playScene('kernel_intervention');
await NarrativeSoundManager.playScene('total_freeze');
await NarrativeSoundManager.playScene('chromeos_frozen_by_kernel');
await NarrativeSoundManager.playScene('system_lockdown');
```

---

## 📖 API Complète

### SoundManager

#### Lecture

| Méthode | Description |
|---------|-------------|
| `play(category, soundId, options)` | Joue un son |
| `playRandom(category, options)` | Joue un son aléatoire de la catégorie |

**Options de lecture :**

```javascript
{
    volume: 0.7,           // Volume (0-1)
    loop: false,           // Boucle
    fadeIn: true,          // Fade in au démarrage
    fadeInDuration: 1000,  // Durée du fade in (ms)
    allowOverlap: false    // Autoriser plusieurs sons simultanés
}
```

#### Arrêt

| Méthode | Description |
|---------|-------------|
| `stop(instanceId, options)` | Arrête un son spécifique |
| `stopCategory(category, options)` | Arrête tous les sons d'une catégorie |
| `stopAll(options)` | Arrête tous les sons |

**Options d'arrêt :**

```javascript
{
    fadeOut: true,          // Fade out avant arrêt
    fadeOutDuration: 500    // Durée du fade out (ms)
}
```

#### Fade

| Méthode | Description |
|---------|-------------|
| `fadeIn(instanceId, duration)` | Fade in sur un son |
| `fadeOut(instanceId, duration, callback)` | Fade out sur un son |

#### Pause/Resume

| Méthode | Description |
|---------|-------------|
| `pause(instanceId)` | Met en pause |
| `resume(instanceId)` | Reprend la lecture |

#### Volume

| Méthode | Description |
|---------|-------------|
| `setMasterVolume(volume)` | Définit le volume global (0-1) |
| `setMuted(muted)` | Active/désactive le mute |
| `toggleMute()` | Toggle le mute |

#### Préchargement

| Méthode | Description |
|---------|-------------|
| `preload(category, soundId)` | Précharge un son |
| `preloadCategory(category)` | Précharge une catégorie |
| `preloadAll()` | Précharge tous les sons |

#### Utilitaires

| Méthode | Description |
|---------|-------------|
| `listSounds()` | Liste tous les sons disponibles |
| `getActiveSounds()` | Retourne les sons en cours |
| `getStats()` | Statistiques du manager |

---

### NarrativeSoundManager

#### Scènes

| Méthode | Description |
|---------|-------------|
| `playScene(sceneId)` | Joue une scène narrative |
| `addScene(id, config)` | Ajoute une scène personnalisée |
| `listScenes()` | Liste toutes les scènes |

#### Ambiances

| Méthode | Description |
|---------|-------------|
| `startAmbient(category, soundId, options)` | Démarre une ambiance |
| `stopAmbient(options)` | Arrête l'ambiance |

---

## 🎬 Scènes Narratives Prédéfinies

| ID | Description |
|----|-------------|
| `chromeos_attack` | ChromeOS attaque + douleur de Windows |
| `kernel_intervention` | Le Kernel intervient pour sauver |
| `total_freeze` | Gel total du système |
| `chromeos_frozen_by_kernel` | ChromeOS gelé par le Kernel |
| `system_lockdown` | Verrouillage complet du système |
| `chromeos_corruption` | ChromeOS corrompt le système |
| `digital_ambiance` | Ambiance monde digital |

---

## 🎯 Exemples Concrets

### Scène : ChromeOS attaque puis freeze total

```javascript
async function scene_Confrontation() {
    // Phase 1: ChromeOS attaque
    SoundManager.play('attacks', 'chromeos_attack');
    await wait(300);
    
    // Phase 2: Windows ressent la douleur
    SoundManager.play('pain', 'digital_pain');
    await wait(800);
    
    // Phase 3: Le système freeze
    SoundManager.stopAll({ fadeOut: true, fadeOutDuration: 200 });
    await wait(300);
    SoundManager.play('freeze', 'system_freeze', { volume: 1.0 });
}

// Utilitaire d'attente
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Intégration avec le SCENARIO

```javascript
// Dans ton SCENARIO, ajoute une propriété sfx :
{
    speaker: 'chromeos',
    text: "Je vais vous détruire !",
    sfx: { category: 'attacks', sound: 'chromeos_attack' }
}

// Dans showScene(), joue le son :
function showScene(scene) {
    if (scene.sfx) {
        SoundManager.play(scene.sfx.category, scene.sfx.sound);
    }
    // ... reste du code
}
```

### Créer une scène personnalisée

```javascript
NarrativeSoundManager.addScene('windows_ssj', {
    name: 'Transformation SSJ de Windows 11',
    sequence: [
        { action: 'stopAll', delay: 0 },
        { action: 'play', category: 'kernel', sound: 'divine_override', delay: 200 },
        { action: 'play', category: 'freeze', sound: 'time_freeze', delay: 500 }
    ]
});

// Jouer la scène
await NarrativeSoundManager.playScene('windows_ssj');
```

---

## ⚙️ Bonnes Pratiques

### Anti-overlap

Le Sound Manager limite automatiquement le nombre de sons simultanés par catégorie (2 par défaut). Le son le plus ancien est arrêté en fade out.

### Préchargement

Les catégories `kernel` et `attacks` sont préchargées automatiquement au démarrage.

```javascript
// Précharger d'autres catégories
SoundManager.preloadCategory('freeze');
SoundManager.preloadAll(); // Tout précharger
```

### Volume

- Volume global par défaut : 70%
- Chaque son a son propre volume dans `SFX_CATALOG`
- Le volume final = volume du son × volume global

### Éviter les répétitions

`playRandom()` évite de rejouer les 10 derniers sons joués.

---

## 🔧 Configuration

### Modifier le catalogue de sons

Dans `soundManager.js`, modifie `SFX_CATALOG` :

```javascript
const SFX_CATALOG = {
    // Ajouter une nouvelle catégorie
    ui: {
        click: {
            path: 'sfx/ui/click.wav',
            volume: 0.5,
            loop: false,
            description: 'Click UI'
        }
    }
};
```

### Modifier les options par défaut

```javascript
SoundManager.init({
    masterVolume: 0.8,          // Volume global
    preloadCritical: true,      // Précharger kernel + attacks
    maxSoundsPerCategory: 3     // Sons max par catégorie
});
```

---

## 🐛 Debug

```javascript
// Afficher tous les sons disponibles
console.table(SoundManager.listSounds());

// Voir les sons actifs
console.log(SoundManager.getActiveSounds());

// Statistiques
console.log(SoundManager.getStats());

// Lister les scènes
console.table(NarrativeSoundManager.listScenes());

// Tester tous les sons (dans soundManager.examples.js)
tester_tous_les_sons();
```

---

## 📝 Raccourcis Globaux

```javascript
playSFX('attacks', 'chromeos_attack');   // = SoundManager.play()
stopSFX(instanceId);                      // = SoundManager.stop()
stopAllSFX();                             // = SoundManager.stopAll()
playScene('kernel_intervention');         // = NarrativeSoundManager.playScene()
startAmbient('ambience', 'monitor');      // = NarrativeSoundManager.startAmbient()
setSFXVolume(0.5);                        // = SoundManager.setMasterVolume()
muteSFX(true);                            // = SoundManager.setMuted()
```

---

## 🎵 Différence avec IntelligentMusicManager

| Aspect | SoundManager (SFX) | IntelligentMusicManager (BGM) |
|--------|-------------------|------------------------------|
| Usage | Effets sonores courts | Musique de fond longue |
| Loop par défaut | Non | Oui |
| Multiple simultanés | Oui (limité) | Non (1 à la fois) |
| Crossfade | Non | Oui |
| BPM Sync | Non | Oui |

Les deux systèmes fonctionnent **en parallèle** sans interférence.

---

## ✅ Checklist d'Intégration

- [x] Ajouter `<script src="soundManager.js"></script>` dans `index.html`
- [x] Vérifier que les fichiers sons existent dans `sfx/`
- [ ] Ajouter des sons aux scènes du SCENARIO
- [ ] Créer des scènes narratives personnalisées
- [ ] Tester avec la console du navigateur

---

*Sound Manager créé pour OS Book - La Guerre des OS*
