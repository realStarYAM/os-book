/**
 * ============================================
 * OS BOOK - EXEMPLES D'UTILISATION DU SOUND MANAGER
 * ============================================
 * 
 * Ce fichier contient des exemples concrets pour :
 * - Jouer des sons individuels
 * - Créer des séquences narratives
 * - Intégrer avec le visual novel
 * - Gérer les ambiances
 */

// ============================================
// EXEMPLES BASIQUES
// ============================================

/**
 * Exemple 1 : Jouer un son simple
 */
function exemple_sonSimple() {
    // Jouer le son d'attaque de ChromeOS
    SoundManager.play('attacks', 'chromeos_attack');

    // Jouer avec volume personnalisé
    SoundManager.play('kernel', 'divine_intervention', { volume: 0.5 });

    // Jouer en boucle
    const ambientId = SoundManager.play('ambience', 'monitor', { loop: true });

    // Arrêter après 5 secondes
    setTimeout(() => {
        SoundManager.stop(ambientId, { fadeOut: true });
    }, 5000);
}

/**
 * Exemple 2 : Fade In et Fade Out
 */
function exemple_fadeInOut() {
    // Jouer avec fade in de 2 secondes
    const soundId = SoundManager.play('freeze', 'system_freeze', {
        fadeIn: true,
        fadeInDuration: 2000
    });

    // Après 4 secondes, fade out de 1 seconde
    setTimeout(() => {
        SoundManager.fadeOut(soundId, 1000, () => {
            console.log('Son terminé avec fade out');
        });
    }, 4000);
}

/**
 * Exemple 3 : Son aléatoire dans une catégorie
 */
function exemple_sonAleatoire() {
    // Jouer un son de freeze aléatoire
    SoundManager.playRandom('freeze');

    // Jouer un son du Kernel aléatoire
    SoundManager.playRandom('kernel', { volume: 0.8 });
}

// ============================================
// EXEMPLES SCÈNES NARRATIVES
// ============================================

/**
 * Exemple 4 : Scène complète - ChromeOS attaque puis freeze total
 * C'est la séquence typique d'un affrontement dans le jeu
 */
async function scene_ChromeOS_attaque_puis_freeze() {
    console.log('🎬 Début de la scène: ChromeOS attaque');

    // Phase 1: ChromeOS attaque
    SoundManager.play('attacks', 'chromeos_attack');
    await wait(300);

    // Phase 2: Windows ressent la douleur
    SoundManager.play('pain', 'digital_pain');
    await wait(800);

    // Phase 3: Le système commence à freezer
    SoundManager.play('freeze', 'time_freeze');
    await wait(500);

    // Phase 4: Freeze total
    SoundManager.stopAll({ fadeOut: true, fadeOutDuration: 200 });
    await wait(300);
    SoundManager.play('freeze', 'system_freeze', { volume: 1.0 });

    console.log('🎬 Fin de la scène');
}

/**
 * Exemple 5 : Intervention du Kernel (Dieu)
 */
async function scene_Kernel_intervention() {
    console.log('🎬 Le Kernel intervient !');

    // Arrêter tous les sons de combat
    SoundManager.stopCategory('attacks', { fadeOut: true });
    await wait(200);

    // Son divin d'intervention
    SoundManager.play('kernel', 'divine_intervention', { volume: 1.0 });
    await wait(800);

    // Arrêt du temps
    SoundManager.play('kernel', 'time_stop');
    await wait(500);

    // ChromeOS est gelé
    SoundManager.play('freeze', 'chromeos_frozen');

    console.log('🎬 ChromeOS est neutralisé');
}

/**
 * Exemple 6 : Utiliser les scènes prédéfinies
 */
async function exemples_scenesPredefines() {
    // Utiliser une scène narrative prédéfinie
    await NarrativeSoundManager.playScene('chromeos_attack');

    // Attendre 2 secondes
    await wait(2000);

    // Intervention du Kernel
    await NarrativeSoundManager.playScene('kernel_intervention');

    // Plus tard, freeze total
    await wait(3000);
    await NarrativeSoundManager.playScene('total_freeze');
}

// ============================================
// EXEMPLES INTÉGRATION VISUAL NOVEL
// ============================================

/**
 * Exemple 7 : Attacher des sons aux dialogues
 */
function integrer_dialogues() {
    // Fonction à appeler quand un dialogue est affiché
    function onDialogueDisplay(scene) {
        const speaker = scene.speaker;

        // Son selon le personnage qui parle
        switch (speaker) {
            case 'chromeos':
                // ChromeOS a une chance de jouer un son menaçant
                if (Math.random() < 0.3) {
                    SoundManager.play('attacks', 'chromeos_corruption', { volume: 0.2 });
                }
                break;

            case 'kernel':
                // Le Kernel a un son divin subtil
                if (Math.random() < 0.2) {
                    SoundManager.play('kernel', 'divine_override', { volume: 0.15 });
                }
                break;

            case 'windows11':
                // Quand Windows 11 est blessé
                if (scene.text.includes('douleur') || scene.text.includes('mal')) {
                    SoundManager.play('pain', 'digital_pain', { volume: 0.4 });
                }
                break;
        }
    }
}

/**
 * Exemple 8 : Intégration avec le système de choix
 */
function integrer_choix() {
    // Quand le joueur fait un choix
    function onChoice(choiceText) {
        // Son de validation
        // (vous pouvez ajouter un son UI dans sfx/ui/)

        // Réaction selon le choix
        if (choiceText.includes('attaquer')) {
            SoundManager.play('attacks', 'chromeos_attack', { volume: 0.5 });
        } else if (choiceText.includes('fuir')) {
            SoundManager.play('freeze', 'time_freeze', { volume: 0.3 });
        }
    }
}

/**
 * Exemple 9 : Gestion des ambiances de scène
 */
function gestion_ambiances() {
    // Démarrer une ambiance avec fade in
    function setAmbiance(type) {
        switch (type) {
            case 'hospital':
                NarrativeSoundManager.startAmbient('ambience', 'monitor', {
                    fadeIn: true,
                    fadeInDuration: 3000,
                    volume: 0.3
                });
                break;

            case 'void':
                NarrativeSoundManager.startAmbient('ambience', 'digital_silence', {
                    fadeIn: true,
                    fadeInDuration: 2000,
                    volume: 0.2
                });
                break;

            case 'combat':
                // Pas d'ambiance en combat, juste effets
                NarrativeSoundManager.stopAmbient({ fadeOut: true });
                break;
        }
    }

    // Changer d'ambiance sur changement de scène
    // setAmbiance('hospital');
}

// ============================================
// EXEMPLES AVANCÉS
// ============================================

/**
 * Exemple 10 : Créer une scène narrative personnalisée
 */
function creer_scene_personnalisee() {
    // Ajouter une nouvelle scène au manager
    NarrativeSoundManager.addScene('windows_ssj_transformation', {
        name: 'Transformation SSJ de Windows 11',
        sequence: [
            { action: 'stopAll', delay: 0 },
            { action: 'play', category: 'kernel', sound: 'divine_override', delay: 200 },
            { action: 'play', category: 'freeze', sound: 'time_freeze', delay: 500 },
            { action: 'play', category: 'kernel', sound: 'divine_intervention', delay: 1000 },
            { action: 'startAmbient', category: 'ambience', sound: 'reality_pause', delay: 2000 }
        ]
    });

    // Jouer la scène
    NarrativeSoundManager.playScene('windows_ssj_transformation');
}

/**
 * Exemple 11 : Contrôle du volume global
 */
function controle_volume() {
    // Baisser le volume pendant un dialogue important
    SoundManager.setMasterVolume(0.3);

    // Remettre le volume normal après
    setTimeout(() => {
        SoundManager.setMasterVolume(0.7);
    }, 5000);

    // Mute/Unmute
    SoundManager.toggleMute();
}

/**
 * Exemple 12 : Statistiques et debug
 */
function debug_sounds() {
    // Voir tous les sons disponibles
    console.table(SoundManager.listSounds());

    // Voir les sons en cours de lecture
    console.log('Sons actifs:', SoundManager.getActiveSounds());

    // Statistiques
    console.log('Stats:', SoundManager.getStats());

    // Scènes disponibles
    console.table(NarrativeSoundManager.listScenes());
}

// ============================================
// INTÉGRATION AVEC LE SCENARIO EXISTANT
// ============================================

/**
 * Exemple 13 : Ajouter des sons aux scènes du SCENARIO
 * 
 * Dans ton SCENARIO, tu peux ajouter une propriété `sfx` :
 * 
 * {
 *     speaker: 'chromeos',
 *     text: "Je vais vous détruire tous !",
 *     sfx: { category: 'attacks', sound: 'chromeos_attack' }
 * }
 * 
 * Puis modifier ta fonction showScene pour jouer le son :
 */
function exemple_integration_scenario() {
    // Modifier showScene pour supporter les SFX
    function showSceneWithSFX(scene) {
        // Si la scène a un effet sonore
        if (scene.sfx) {
            SoundManager.play(scene.sfx.category, scene.sfx.sound, scene.sfx.options);
        }

        // Si la scène a une scène narrative complète
        if (scene.sfxScene) {
            NarrativeSoundManager.playScene(scene.sfxScene);
        }

        // Continuer avec le reste de showScene...
    }
}

/**
 * Exemple 14 : Transition de scène avec sons
 */
async function transition_scene_avec_sons(fromScene, toScene) {
    // Fade out de l'ambiance actuelle
    NarrativeSoundManager.stopAmbient({ fadeOut: true, fadeOutDuration: 500 });

    // Attendre la fin du fade
    await wait(500);

    // Jouer un son de transition selon le type
    if (toScene === 'combat') {
        SoundManager.play('attacks', 'chromeos_attack', { volume: 0.6 });
    } else if (toScene === 'kernel_realm') {
        SoundManager.play('kernel', 'divine_intervention', { volume: 0.8 });
    }

    // Attendre un peu
    await wait(300);

    // Démarrer la nouvelle ambiance
    if (toScene === 'hospital') {
        NarrativeSoundManager.startAmbient('ambience', 'monitor', { fadeIn: true });
    }
}

// ============================================
// UTILITAIRE
// ============================================

/**
 * Fonction utilitaire d'attente
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// TESTS AUTOMATIQUES
// ============================================

/**
 * Tester tous les sons de chaque catégorie
 */
async function tester_tous_les_sons() {
    const categories = ['ambience', 'attacks', 'freeze', 'kernel', 'lockdown', 'pain'];

    for (const category of categories) {
        console.log(`\n🔊 Test catégorie: ${category}`);

        const sounds = SoundManager.listSounds()[category];
        for (const sound of sounds) {
            console.log(`   Playing: ${sound.id}`);
            SoundManager.play(category, sound.id, { volume: 0.3 });
            await wait(1500);
            SoundManager.stopAll();
            await wait(300);
        }
    }

    console.log('\n✅ Tests terminés !');
}

// ============================================
// EXEMPLES D'APPELS RAPIDES
// ============================================

/*
 * === APPELS RAPIDES (COPIER-COLLER) ===
 * 
 * // Jouer un son d'attaque
 * SoundManager.play('attacks', 'chromeos_attack');
 * 
 * // Jouer l'intervention du Kernel
 * SoundManager.play('kernel', 'divine_intervention');
 * 
 * // Freeze total
 * SoundManager.play('freeze', 'system_freeze');
 * 
 * // Douleur numérique
 * SoundManager.play('pain', 'digital_pain');
 * 
 * // Ambiance en boucle
 * SoundManager.play('ambience', 'monitor', { loop: true });
 * 
 * // Scène narrative complète
 * NarrativeSoundManager.playScene('chromeos_attack');
 * NarrativeSoundManager.playScene('kernel_intervention');
 * NarrativeSoundManager.playScene('total_freeze');
 * 
 * // Arrêter tout
 * SoundManager.stopAll({ fadeOut: true });
 */

console.log('📖 Exemples de Sound Manager chargés');
console.log('   Essayez: scene_ChromeOS_attaque_puis_freeze()');
console.log('   Ou: NarrativeSoundManager.playScene("chromeos_attack")');
