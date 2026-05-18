import type { Language, Operation, Level, Difficulty } from './game'

export type Translations = {
    // Navigation
    navHome: string
    navHallOfFame: string
    navSettings: string
    // HomePage
    homeSubtitle: string
    homeTagline: string
    homeProfile: string
    homeProfileHint: string
    homeNameLabel: string
    homeNamePlaceholder: string
    homeAvatarLabel: string
    homeBtnSave: string
    homeBtnPlay: string
    homeNameError: string
    homeProfileSaved: string
    homeProfileError: string
    homePlayingAs: string
    homeHowToPlay: string
    homeInstructions: string[]
    // GamePage labels
    gameScore: string
    gameLives: string
    gameStreak: string
    gameQuestion: string
    gameShoot: string
    gameStart: string
    gameStop: string
    gameNew: string
    gameWon: string
    gameOver: string
    gamePressStart: string
    gameSteering: string
    // GamePage feedback (use {score} and {answer} as placeholders)
    gameFeedbackCorrect: string
    gameFeedbackStreak: string
    gameFeedbackWrong: string
    gameFeedbackTimeout: string
    gameFeedbackNewRecord: string
    gameFeedbackComplete: string
    gameFeedbackStopped: string
    gameFeedbackGameOver: string
    gameLevelUp: string
    // HallOfFamePage
    hofTitle: string
    hofSubtitle: string
    hofColPlayer: string
    hofColScore: string
    hofColQuestions: string
    hofColMath: string
    hofEmpty: string
    hofPlayNow: string
    // Shared label maps (used in Settings & Hall of Fame)
    operationLabels: Record<Operation, string>
    levelLabels: Record<Level, string>
    difficultyLabels: Record<Difficulty, string>
    // SettingsPage
    settingsTitle: string
    settingsTagline: string
    settingsLangSection: string
    settingsOpsSection: string
    settingsOpsHint: string
    settingsLevelSection: string
    settingsDiffSection: string
    settingsProfileSection: string
    settingsProfileName: string
    settingsProfileAvatar: string
    settingsProfileSince: string
    settingsNoProfile: string
    settingsNoProfileLink: string
    settingsDataSection: string
    settingsDataInfo: string[]
    settingsDeleteBtn: string
    settingsDeleteConfirm: string
    settingsPlayBtn: string
}

export const translations: Record<Language, Translations> = {
    en: {
        navHome: 'Home',
        navHallOfFame: 'Hall of Fame',
        navSettings: 'Settings',
        homeSubtitle: 'Shoot the right answer and get better at math every day!',
        homeTagline: 'No login needed • Always free • Works offline',
        homeProfile: '👤 Who Are You?',
        homeProfileHint: 'Pick a name and an avatar — your scores will be saved!',
        homeNameLabel: 'Your Name',
        homeNamePlaceholder: 'Type your name here',
        homeAvatarLabel: 'Choose Your Avatar',
        homeBtnSave: '💾 Save Changes',
        homeBtnPlay: "✨ Let's Play!",
        homeNameError: 'Name must be at least 2 characters',
        homeProfileSaved: '✨ Profile saved!',
        homeProfileError: '❌ Error saving profile',
        homePlayingAs: 'Playing as:',
        homeHowToPlay: '🎮 How to Play',
        homeInstructions: [
            'Go to Settings and pick what math you want to practise',
            'Enter your name and pick an avatar',
            'Press ▶️ Start and answer 20 questions!',
            'Keyboard: steer with ⬅️ ➡️ arrow keys · Touch: swipe left/right',
            'Keyboard: press Space to shoot · Touch: swipe ⬆️ or tap the selected lane',
            'Get answers right in a row for bonus points! 🔥',
        ],
        gameScore: 'Score',
        gameLives: 'Lives',
        gameStreak: 'Streak',
        gameQuestion: 'Q',
        gameShoot: '🎯 Shoot',
        gameStart: '▶️ Start',
        gameStop: '🛑 Stop Game',
        gameNew: '🔄 New',
        gameWon: '✨ Won!',
        gameOver: '💀 Over!',
        gamePressStart: '🎮 Press Start to launch!',
        gameSteering: '⬅️ ➡️ Swipe/Keys · Tap selected lane or Swipe ⬆️ to Shoot!',
        gameFeedbackCorrect: '✅ Correct!',
        gameFeedbackStreak: '🔥 Streak ×{streak}',
        gameFeedbackWrong: '❌ Wrong! Answer: {answer}',
        gameFeedbackTimeout: "⏰ Time's up! Answer: {answer}",
        gameFeedbackNewRecord: '🏆 New Record! {score} pts — entering Hall of Fame…',
        gameFeedbackComplete: '🎉 Mission complete! {score} pts — entering Hall of Fame…',
        gameFeedbackStopped: '🛑 Stopped. {score} pts — entering Hall of Fame…',
        gameFeedbackGameOver: '💀 Game Over! {score} pts — entering Hall of Fame…',
        gameLevelUp: '🔥 Wave {wave}/4 — harder questions, more points!',
        hofTitle: '🏆 BEST SCORES 🏆',
        hofSubtitle: 'Can you make it to the top?',
        hofColPlayer: 'Player',
        hofColScore: 'Score',
        hofColQuestions: 'Questions',
        hofColMath: 'Math',
        hofEmpty: '🚀 Nobody here yet — play a game and be first on the board!',
        hofPlayNow: '🎮 Play Now!',
        operationLabels: {
            addition: '➕ Plus',
            subtraction: '➖ Minus',
            multiplication: '✖️ Times',
            division: '➗ Divide',
            remainders: '📊 Remainders',
        },
        levelLabels: {
            starter: '🟢 Starter (≤10)',
            beginner: '🔵 Beginner (≤20)',
            elementary: '🟡 Elementary (≤50)',
            intermediate: '🟠 Intermediate (≤100)',
            advanced: '🔴 Advanced (≤250)',
            expert: '⭐ Expert (≤500)',
            master: '💥 Master (≤1000)',
        },
        difficultyLabels: {
            easy: '😊 Easy (more time)',
            normal: '🎯 Normal',
            hard: '🔥 Hard (less time)',
        },
        settingsTitle: '⚙️ SETTINGS ⚙️',
        settingsTagline: 'Changes are saved right away and used in your next game.',
        settingsLangSection: '🌐 Language',
        settingsOpsSection: '➕ What to Practise',
        settingsOpsHint: "Choose one or more — they'll be mixed together!",
        settingsLevelSection: '📊 How Big Are the Numbers?',
        settingsDiffSection: '⏱️ Time per Question',
        settingsProfileSection: '👤 Your Profile',
        settingsProfileName: 'Name:',
        settingsProfileAvatar: 'Avatar:',
        settingsProfileSince: 'Playing since:',
        settingsNoProfile: 'No profile yet —',
        settingsNoProfileLink: 'create one on the home page',
        settingsDataSection: '💾 Your Data',
        settingsDataInfo: [
            'All your scores are saved on this device',
            'Nothing is sent to the internet',
            'Works offline too!',
        ],
        settingsDeleteBtn: '🗑️ Delete Everything',
        settingsDeleteConfirm: "This will delete your name, avatar and all scores.\nAre you sure?",
        settingsPlayBtn: '🎮 Play',
    },

    de: {
        navHome: 'Start',
        navHallOfFame: 'Bestenliste',
        navSettings: 'Einstellungen',
        homeSubtitle: 'Triff die richtige Antwort und werde jeden Tag besser in Mathe!',
        homeTagline: 'Kein Login nötig • Immer kostenlos • Funktioniert offline',
        homeProfile: '👤 Wer bist du?',
        homeProfileHint: 'Wähle einen Namen und einen Avatar — deine Punkte werden gespeichert!',
        homeNameLabel: 'Dein Name',
        homeNamePlaceholder: 'Gib deinen Namen ein',
        homeAvatarLabel: 'Wähle deinen Avatar',
        homeBtnSave: '💾 Änderungen speichern',
        homeBtnPlay: '✨ Auf geht\'s!',
        homeNameError: 'Der Name muss mindestens 2 Zeichen haben',
        homeProfileSaved: '✨ Profil gespeichert!',
        homeProfileError: '❌ Fehler beim Speichern',
        homePlayingAs: 'Spielst als:',
        homeHowToPlay: '🎮 So wird gespielt',
        homeInstructions: [
            'Gehe zu Einstellungen und wähle, was du üben möchtest',
            'Gib deinen Namen ein und wähle einen Avatar',
            'Drücke ▶️ Start und beantworte 20 Fragen!',
            'Tastatur: Rakete mit ⬅️ ➡️ Pfeiltasten lenken · Touch: links/rechts wischen',
            'Tastatur: Leertaste zum Schiessen · Touch: ⬆️ wischen oder ausgewählte Spur antippen',
            'Beantworte mehrere Fragen richtig hintereinander für Bonuspunkte! 🔥',
        ],
        gameScore: 'Punkte',
        gameLives: 'Leben',
        gameStreak: 'Serie',
        gameQuestion: 'Frage',
        gameShoot: '🎯 Schiessen',
        gameStart: '▶️ Start',
        gameStop: '🛑 Stopp',
        gameNew: '🔄 Neu',
        gameWon: '✨ Gewonnen!',
        gameOver: '💀 Verloren!',
        gamePressStart: '🎮 Drücke Start zum Spielen!',
        gameSteering: '⬅️ ➡️ Wischen/Tasten · Ausgewählte Spur antippen oder ⬆️ wischen!',
        gameFeedbackCorrect: '✅ Richtig!',
        gameFeedbackStreak: '🔥 Serie ×{streak}',
        gameFeedbackWrong: '❌ Falsch! Antwort: {answer}',
        gameFeedbackTimeout: '⏰ Zeit abgelaufen! Antwort: {answer}',
        gameFeedbackNewRecord: '🏆 Neuer Rekord! {score} Pkt — Hall of Fame…',
        gameFeedbackComplete: '🎉 Mission erfüllt! {score} Pkt — Hall of Fame…',
        gameFeedbackStopped: '🛑 Gestoppt. {score} Pkt — Hall of Fame…',
        gameFeedbackGameOver: '💀 Verloren! {score} Pkt — Hall of Fame…',
        gameLevelUp: '🔥 Welle {wave}/4 — schwieriger, mehr Punkte!',
        hofTitle: '🏆 BESTENLISTE 🏆',
        hofSubtitle: 'Schaffst du es ganz nach oben?',
        hofColPlayer: 'Spieler',
        hofColScore: 'Punkte',
        hofColQuestions: 'Fragen',
        hofColMath: 'Mathe',
        hofEmpty: '🚀 Noch niemand hier — spiel eine Runde und sei der Erste!',
        hofPlayNow: '🎮 Jetzt spielen!',
        operationLabels: {
            addition: '➕ Plus',
            subtraction: '➖ Minus',
            multiplication: '✖️ Mal',
            division: '➗ Dividieren',
            remainders: '📊 Rest',
        },
        levelLabels: {
            starter: '🟢 Anfänger (≤10)',
            beginner: '🔵 Einsteiger (≤20)',
            elementary: '🟡 Grundstufe (≤50)',
            intermediate: '🟠 Mittelstufe (≤100)',
            advanced: '🔴 Fortgeschritten (≤250)',
            expert: '⭐ Experte (≤500)',
            master: '💥 Meister (≤1000)',
        },
        difficultyLabels: {
            easy: '😊 Leicht (mehr Zeit)',
            normal: '🎯 Normal',
            hard: '🔥 Schwer (weniger Zeit)',
        },
        settingsTitle: '⚙️ EINSTELLUNGEN ⚙️',
        settingsTagline: 'Änderungen werden sofort gespeichert und beim nächsten Spiel verwendet.',
        settingsLangSection: '🌐 Sprache',
        settingsOpsSection: '➕ Was möchtest du üben?',
        settingsOpsHint: 'Wähle eine oder mehrere — sie werden gemischt!',
        settingsLevelSection: '📊 Wie gross sollen die Zahlen sein?',
        settingsDiffSection: '⏱️ Zeit pro Frage',
        settingsProfileSection: '👤 Dein Profil',
        settingsProfileName: 'Name:',
        settingsProfileAvatar: 'Avatar:',
        settingsProfileSince: 'Dabei seit:',
        settingsNoProfile: 'Noch kein Profil —',
        settingsNoProfileLink: 'auf der Startseite erstellen',
        settingsDataSection: '💾 Deine Daten',
        settingsDataInfo: [
            'Alle Punkte werden auf diesem Gerät gespeichert',
            'Es wird nichts ins Internet gesendet',
            'Funktioniert auch offline!',
        ],
        settingsDeleteBtn: '🗑️ Alles löschen',
        settingsDeleteConfirm: 'Damit werden dein Name, Avatar und alle Punkte gelöscht.\nBist du sicher?',
        settingsPlayBtn: '🎮 Spielen',
    },

    it: {
        navHome: 'Home',
        navHallOfFame: 'Hall of Fame',
        navSettings: 'Impostazioni',
        homeSubtitle: 'Spara la risposta giusta e migliora in matematica ogni giorno!',
        homeTagline: 'Nessun login • Sempre gratis • Funziona offline',
        homeProfile: '👤 Chi sei?',
        homeProfileHint: 'Scegli un nome e un avatar — i tuoi punteggi verranno salvati!',
        homeNameLabel: 'Il tuo nome',
        homeNamePlaceholder: 'Scrivi il tuo nome qui',
        homeAvatarLabel: 'Scegli il tuo avatar',
        homeBtnSave: '💾 Salva modifiche',
        homeBtnPlay: '✨ Giochiamo!',
        homeNameError: 'Il nome deve avere almeno 2 caratteri',
        homeProfileSaved: '✨ Profilo salvato!',
        homeProfileError: '❌ Errore nel salvataggio',
        homePlayingAs: 'Stai giocando come:',
        homeHowToPlay: '🎮 Come si gioca',
        homeInstructions: [
            'Vai alle impostazioni e scegli cosa vuoi esercitare',
            'Inserisci il tuo nome e scegli un avatar',
            'Premi ▶️ Inizia e rispondi a 20 domande!',
            'Tastiera: guida con i tasti freccia ⬅️ ➡️ · Touch: scorri a sinistra/destra',
            'Tastiera: premi Spazio · Touch: scorri ⬆️ o tocca la corsia selezionata',
            'Rispondi correttamente di fila per punti bonus! 🔥',
        ],
        gameScore: 'Punti',
        gameLives: 'Vite',
        gameStreak: 'Serie',
        gameQuestion: 'Dom.',
        gameShoot: '🎯 Spara',
        gameStart: '▶️ Inizia',
        gameStop: '🛑 Ferma',
        gameNew: '🔄 Nuovo',
        gameWon: '✨ Vinto!',
        gameOver: '💀 Finito!',
        gamePressStart: '🎮 Premi Inizia per giocare!',
        gameSteering: '⬅️ ➡️ Scorri/Tasti · Tocca la corsia selezionata o Scorri ⬆️!',
        gameFeedbackCorrect: '✅ Corretto!',
        gameFeedbackStreak: '🔥 Serie ×{streak}',
        gameFeedbackWrong: '❌ Sbagliato! Risposta: {answer}',
        gameFeedbackTimeout: '⏰ Tempo scaduto! Risposta: {answer}',
        gameFeedbackNewRecord: '🏆 Nuovo record! {score} pt — Hall of Fame…',
        gameFeedbackComplete: '🎉 Missione compiuta! {score} pt — Hall of Fame…',
        gameFeedbackStopped: '🛑 Fermato. {score} pt — Hall of Fame…',
        gameFeedbackGameOver: '💀 Game Over! {score} pt — Hall of Fame…',
        gameLevelUp: '🔥 Onda {wave}/4 — più difficile, più punti!',
        hofTitle: '🏆 PUNTEGGI MIGLIORI 🏆',
        hofSubtitle: 'Riesci ad arrivare in cima?',
        hofColPlayer: 'Giocatore',
        hofColScore: 'Punteggio',
        hofColQuestions: 'Domande',
        hofColMath: 'Matematica',
        hofEmpty: '🚀 Nessuno ancora — gioca e sii il primo!',
        hofPlayNow: '🎮 Gioca ora!',
        operationLabels: {
            addition: '➕ Addizione',
            subtraction: '➖ Sottrazione',
            multiplication: '✖️ Moltiplicazione',
            division: '➗ Divisione',
            remainders: '📊 Resti',
        },
        levelLabels: {
            starter: '🟢 Principiante (≤10)',
            beginner: '🔵 Base (≤20)',
            elementary: '🟡 Elementare (≤50)',
            intermediate: '🟠 Intermedio (≤100)',
            advanced: '🔴 Avanzato (≤250)',
            expert: '⭐ Esperto (≤500)',
            master: '💥 Maestro (≤1000)',
        },
        difficultyLabels: {
            easy: '😊 Facile (più tempo)',
            normal: '🎯 Normale',
            hard: '🔥 Difficile (meno tempo)',
        },
        settingsTitle: '⚙️ IMPOSTAZIONI ⚙️',
        settingsTagline: 'Le modifiche vengono salvate subito e usate nel prossimo gioco.',
        settingsLangSection: '🌐 Lingua',
        settingsOpsSection: '➕ Cosa vuoi esercitare?',
        settingsOpsHint: 'Scegline uno o più — verranno mescolati!',
        settingsLevelSection: '📊 Quanto grandi devono essere i numeri?',
        settingsDiffSection: '⏱️ Tempo per domanda',
        settingsProfileSection: '👤 Il tuo profilo',
        settingsProfileName: 'Nome:',
        settingsProfileAvatar: 'Avatar:',
        settingsProfileSince: 'Gioca da:',
        settingsNoProfile: 'Nessun profilo ancora —',
        settingsNoProfileLink: 'creane uno nella pagina principale',
        settingsDataSection: '💾 I tuoi dati',
        settingsDataInfo: [
            'Tutti i punteggi sono salvati su questo dispositivo',
            'Niente viene inviato a internet',
            'Funziona anche offline!',
        ],
        settingsDeleteBtn: '🗑️ Elimina tutto',
        settingsDeleteConfirm: 'Questo eliminerà il tuo nome, avatar e tutti i punteggi.\nSei sicuro?',
        settingsPlayBtn: '🎮 Gioca',
    },

    fr: {
        navHome: 'Accueil',
        navHallOfFame: 'Hall of Fame',
        navSettings: 'Paramètres',
        homeSubtitle: 'Tire la bonne réponse et améliore-toi en maths chaque jour!',
        homeTagline: 'Sans connexion • Toujours gratuit • Fonctionne hors ligne',
        homeProfile: '👤 Qui es-tu ?',
        homeProfileHint: 'Choisis un nom et un avatar — tes scores seront sauvegardés !',
        homeNameLabel: 'Ton nom',
        homeNamePlaceholder: 'Écris ton nom ici',
        homeAvatarLabel: 'Choisis ton avatar',
        homeBtnSave: '💾 Enregistrer',
        homeBtnPlay: '✨ À nous de jouer !',
        homeNameError: 'Le nom doit comporter au moins 2 caractères',
        homeProfileSaved: '✨ Profil enregistré !',
        homeProfileError: '❌ Erreur lors de la sauvegarde',
        homePlayingAs: 'Tu joues en tant que :',
        homeHowToPlay: '🎮 Comment jouer',
        homeInstructions: [
            'Va dans les paramètres et choisis ce que tu veux pratiquer',
            'Entre ton nom et choisis un avatar',
            'Appuie sur ▶️ Démarrer et réponds à 20 questions !',
            'Clavier : pilote avec les touches ⬅️ ➡️ · Tactile : glisse à gauche/droite',
            'Clavier : appuie sur Espace · Tactile : glisse ⬆️ ou touche la piste sélectionnée',
            'Réponds correctement à la suite pour des points bonus ! 🔥',
        ],
        gameScore: 'Score',
        gameLives: 'Vies',
        gameStreak: 'Série',
        gameQuestion: 'Q',
        gameShoot: '🎯 Tirer',
        gameStart: '▶️ Démarrer',
        gameStop: '🛑 Arrêter',
        gameNew: '🔄 Nouveau',
        gameWon: '✨ Gagné !',
        gameOver: '💀 Perdu !',
        gamePressStart: '🎮 Appuie sur Démarrer pour jouer !',
        gameSteering: '⬅️ ➡️ Glisse/Touches · Touche la piste sélectionnée ou Glisse ⬆️ !',
        gameFeedbackCorrect: '✅ Correct !',
        gameFeedbackStreak: '🔥 Série ×{streak}',
        gameFeedbackWrong: '❌ Faux ! Réponse : {answer}',
        gameFeedbackTimeout: '⏰ Temps écoulé ! Réponse : {answer}',
        gameFeedbackNewRecord: '🏆 Nouveau record ! {score} pts — Hall of Fame…',
        gameFeedbackComplete: '🎉 Mission accomplie ! {score} pts — Hall of Fame…',
        gameFeedbackStopped: '🛑 Arrêté. {score} pts — Hall of Fame…',
        gameFeedbackGameOver: '💀 Perdu ! {score} pts — Hall of Fame…',
        gameLevelUp: '🔥 Vague {wave}/4 — plus difficile, plus de points !',
        hofTitle: '🏆 MEILLEURS SCORES 🏆',
        hofSubtitle: 'Peux-tu atteindre le sommet ?',
        hofColPlayer: 'Joueur',
        hofColScore: 'Score',
        hofColQuestions: 'Questions',
        hofColMath: 'Maths',
        hofEmpty: '🚀 Personne encore — joue et sois le premier !',
        hofPlayNow: '🎮 Jouer maintenant !',
        operationLabels: {
            addition: '➕ Addition',
            subtraction: '➖ Soustraction',
            multiplication: '✖️ Multiplication',
            division: '➗ Division',
            remainders: '📊 Restes',
        },
        levelLabels: {
            starter: '🟢 Débutant (≤10)',
            beginner: '🔵 Niveau 1 (≤20)',
            elementary: '🟡 Élémentaire (≤50)',
            intermediate: '🟠 Intermédiaire (≤100)',
            advanced: '🔴 Avancé (≤250)',
            expert: '⭐ Expert (≤500)',
            master: '💥 Maître (≤1000)',
        },
        difficultyLabels: {
            easy: '😊 Facile (plus de temps)',
            normal: '🎯 Normal',
            hard: '🔥 Difficile (moins de temps)',
        },
        settingsTitle: '⚙️ PARAMÈTRES ⚙️',
        settingsTagline: 'Les modifications sont enregistrées immédiatement et utilisées au prochain jeu.',
        settingsLangSection: '🌐 Langue',
        settingsOpsSection: '➕ Que veux-tu pratiquer ?',
        settingsOpsHint: 'Choisis-en un ou plusieurs — ils seront mélangés !',
        settingsLevelSection: '📊 Quelle taille doivent avoir les nombres ?',
        settingsDiffSection: '⏱️ Temps par question',
        settingsProfileSection: '👤 Ton profil',
        settingsProfileName: 'Nom :',
        settingsProfileAvatar: 'Avatar :',
        settingsProfileSince: 'Joue depuis :',
        settingsNoProfile: 'Pas encore de profil —',
        settingsNoProfileLink: "crées-en un sur la page d'accueil",
        settingsDataSection: '💾 Tes données',
        settingsDataInfo: [
            'Tous tes scores sont enregistrés sur cet appareil',
            "Rien n'est envoyé sur internet",
            'Fonctionne aussi hors ligne !',
        ],
        settingsDeleteBtn: '🗑️ Tout supprimer',
        settingsDeleteConfirm: "Cela supprimera ton nom, avatar et tous les scores.\nEs-tu sûr(e) ?",
        settingsPlayBtn: '🎮 Jouer',
    },
}
