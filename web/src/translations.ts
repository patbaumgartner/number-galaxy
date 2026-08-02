import type { Language, Operation, Rank } from './game'

export type Translations = {
    nav: { home: string; hallOfFame: string; settings: string }
    home: {
        defaultName: string
        tagline: string
        subtitle: string
        play: string
        playAgain: string
        greeting: string
        rename: string
        namePlaceholder: string
        nameLabel: string
        avatarLabel: string
        save: string
        cancel: string
        missionTitle: string
        change: string
        chooseGame: string
        gameInvaders: string
        gameTables: string
        howToTitle: string
        howToSteps: string[]
    }
    game: {
        score: string
        combo: string
        question: string
        quit: string
        help: string
        helpTitle: string
        helpClose: string
        start: string
        startHint: string
        answerHint: string
        correct: string
        wrong: string
        timeUp: string
        theAnswerIs: string
        untimed: string
    }
    summary: {
        complete: string
        perfect: string
        score: string
        accuracy: string
        bestStreak: string
        fastest: string
        newRecord: string
        newBest: string
        playAgain: string
        changeMission: string
        seeScores: string
    }
    settings: {
        title: string
        tagline: string
        practiceTitle: string
        practiceHint: string
        rankTitle: string
        rankHint: string
        rankRange: string
        keepOne: string
        languageTitle: string
        moreTitle: string
        timerTitle: string
        timerHint: string
        soundTitle: string
        soundHint: string
        hintsTitle: string
        hintsHint: string
        on: string
        off: string
        dataTitle: string
        dataInfo: string[]
        reset: string
        resetConfirm: string
        done: string
    }
    hof: {
        title: string
        subtitle: string
        empty: string
        timed: string
        untimed: string
        accuracy: string
        streak: string
        legacyTitle: string
        legacyHint: string
    }
    error: { title: string; body: string; reload: string }
    operations: Record<Operation, string>
    ranks: Record<Rank, string>
    tt: {
        padSubmit: string; padDelete: string; title: string
        galaxyHome: string; galaxyHomeTagline: string; galaxySquares: string; galaxySquaresTagline: string
        galaxyShortcuts: string; galaxyShortcutsTagline: string; galaxyDeep: string; galaxyDeepTagline: string
        dailyMission: string; duePlayMission: string; allCaughtUp: string
        lockedHintSquares: string; lockedHintShortcuts: string; lockedHintDeep: string; lockedHintSpeed: string
        phaseLearn: string; phasePractice: string; phaseSpeed: string
        heatmapTitle: string; heatmapCore: string; heatmapExtended: string; heatmapSquares: string
        trainExit: string; summaryAccuracy: string; summaryStreak: string; summaryLeveledUp: string
        summaryPracticeBtn: string; summaryTime: string; summaryNewBest: string; summaryStarsEarned: string
        summarySpeedUnlocked: string; summaryMastered: string; summaryKeepPracticing: string
        learnFinish: string; learnCardDismiss: string; learnGuided: string; speedGo: string
        settingsTitle: string; settingsStrategyCards: string; settingsStrategyHint: string
        settingsReset: string; settingsResetConfirm: string
    }
}

const de: Translations = {
    nav: { home: 'Start', hallOfFame: 'Bestenliste', settings: 'Einstellungen' },
    home: {
        defaultName: 'Pilot',
        tagline: 'Triff die richtige Antwort!',
        subtitle: 'Kein Login · Immer kostenlos · Funktioniert offline',
        play: 'Spielen',
        playAgain: 'Weiterspielen',
        greeting: 'Hallo, {name}!',
        rename: 'Name ändern',
        namePlaceholder: 'Dein Name',
        nameLabel: 'Name',
        avatarLabel: 'Figur',
        save: 'Speichern',
        cancel: 'Abbrechen',
        missionTitle: 'Deine Mission',
        change: 'Ändern',
        chooseGame: 'Wähle dein Spiel',
        gameInvaders: 'Math Invaders',
        gameTables: 'Einmaleins-Galaxie',
        howToTitle: 'So geht’s',
        howToSteps: [
            'Drücke auf Spielen — es geht sofort los.',
            'Tippe das Alien mit der richtigen Antwort an.',
            'Triff mehrere hintereinander für mehr Punkte!',
        ],
    },
    game: {
        score: 'Punkte',
        combo: 'Kombo',
        question: 'Aufgabe',
        quit: 'Beenden',
        help: 'Hilfe',
        helpTitle: 'So rechnest du',
        helpClose: 'Weiter',
        start: 'Los geht’s',
        startHint: 'Tippe auf die richtige Antwort',
        answerHint: 'Wähle eine Antwort',
        correct: 'Richtig!',
        wrong: 'Daneben!',
        timeUp: 'Zeit um!',
        theAnswerIs: 'Richtig wäre',
        untimed: 'Ohne Zeitdruck',
    },
    summary: {
        complete: 'Mission geschafft!',
        perfect: 'Perfekt!',
        score: 'Punkte',
        accuracy: 'Richtig',
        bestStreak: 'Beste Serie',
        fastest: 'Schnellste',
        newRecord: 'Neuer Rekord!',
        newBest: 'Neue Bestzeit!',
        playAgain: 'Nochmal',
        changeMission: 'Mission ändern',
        seeScores: 'Bestenliste',
    },
    settings: {
        title: 'Einstellungen',
        tagline: 'Stelle deine Mission ein',
        practiceTitle: 'Was möchtest du üben?',
        practiceHint: 'Wähle eine oder mehrere — alle sind bei jedem Rang verfügbar.',
        rankTitle: 'Wie schwer?',
        rankHint: 'Der Rang bestimmt nur, wie gross die Zahlen werden und wie viel Zeit du hast.',
        rankRange: 'bis {max}',
        keepOne: 'Mindestens eine Rechenart muss aktiv bleiben.',
        languageTitle: 'Sprache',
        moreTitle: 'Mehr Einstellungen',
        timerTitle: 'Countdown',
        timerHint: 'Aus: rechne in deinem Tempo. An: Zeit pro Aufgabe.',
        soundTitle: 'Ton',
        soundHint: 'Klänge bei Treffern und Fehlern.',
        hintsTitle: 'Lösungswege',
        hintsHint: 'Zeigt den Rechenweg nach einem Fehler und den Hilfe-Knopf.',
        on: 'An',
        off: 'Aus',
        dataTitle: 'Deine Daten',
        dataInfo: [
            'Alles bleibt auf deinem Gerät.',
            'Kein Konto, keine Werbung, kein Tracking.',
        ],
        reset: 'Alle Daten löschen',
        resetConfirm: 'Wirklich alle Daten löschen?',
        done: 'Fertig',
    },
    hof: {
        title: 'Bestenliste',
        subtitle: 'Deine besten Missionen',
        empty: 'Noch nichts hier — spiel eine Mission!',
        timed: 'Mit Countdown',
        untimed: 'Ohne Countdown',
        accuracy: 'Richtig',
        streak: 'Serie',
        legacyTitle: 'Früher',
        legacyHint: 'Ergebnisse aus der alten Version — nicht vergleichbar.',
    },
    error: {
        title: '👾 Da ist etwas schiefgelaufen',
        body: 'Das Spiel hat einen Fehler. Deine Punkte sind sicher — probier es nochmal.',
        reload: 'Neu laden',
    },
    operations: {
        addition: '➕ Plus',
        subtraction: '➖ Minus',
        multiplication: '✖️ Mal',
        division: '➗ Geteilt',
        remainders: '🔢 Mit Rest',
    },
    ranks: {
        rookie: '🌱 Neuling',
        cadet: '⭐ Kadett',
        pilot: '🚀 Pilot',
        ace: '🔥 Ass',
        legend: '👑 Legende',
    },
    tt: {
        padSubmit: 'Bestätigen', padDelete: 'Löschen', title: '✖️ Einmaleins-Galaxie',
        galaxyHome: 'Start-Galaxie', galaxyHomeTagline: 'Die Reihen 1 bis 12', galaxySquares: 'Quadrat-Nebel', galaxySquaresTagline: 'Zahlen mal sich selbst',
        galaxyShortcuts: 'Abkürzungs-Gürtel', galaxyShortcutsTagline: 'Tricks für 15, 20 und 25', galaxyDeep: 'Tiefer Raum', galaxyDeepTagline: 'Die großen Reihen 13 bis 19',
        dailyMission: 'Tagesmission', duePlayMission: 'fällige Aufgaben spielen', allCaughtUp: 'Alles geschafft!',
        lockedHintSquares: 'Verdiene ⭐⭐ auf 5 Startplaneten', lockedHintShortcuts: 'Verdiene ⭐ auf den Quadraten bis 12²', lockedHintDeep: 'Verdiene ⭐⭐ auf den Reihen 2 bis 12', lockedHintSpeed: 'Verdiene ⭐ für den Sprint',
        phaseLearn: 'Lernen', phasePractice: 'Üben', phaseSpeed: 'Sprint', heatmapTitle: 'Deine Lernkarte', heatmapCore: 'Basis 1–12', heatmapExtended: 'Erweitert 13–25', heatmapSquares: 'Quadrate 1–25',
        trainExit: 'Zurück zur Karte', summaryAccuracy: 'Richtig', summaryStreak: 'Beste Serie', summaryLeveledUp: 'Aufgestiegen', summaryPracticeBtn: 'Jetzt üben', summaryTime: 'Zeit', summaryNewBest: 'Neue Bestzeit!', summaryStarsEarned: '{n} Stern(e) verdient!', summarySpeedUnlocked: 'Sprint freigeschaltet!', summaryMastered: 'Planet gemeistert!', summaryKeepPracticing: 'Übe weiter für Sterne.', learnFinish: 'Super gemacht!', learnCardDismiss: 'Verstanden', learnGuided: 'Jetzt probieren', speedGo: 'LOS!',
        settingsTitle: 'Einmaleins-Trainer', settingsStrategyCards: 'Strategiekarten', settingsStrategyHint: 'Zeigt bei Bedarf einen Rechentipp.', settingsReset: 'Trainer-Fortschritt löschen', settingsResetConfirm: 'Einmaleins-Fortschritt wirklich löschen?',
    },
}

const en: Translations = {
    nav: { home: 'Home', hallOfFame: 'Best scores', settings: 'Settings' },
    home: {
        defaultName: 'Ace',
        tagline: 'Hit the right answer!',
        subtitle: 'No login · Always free · Works offline',
        play: 'Play',
        playAgain: 'Keep playing',
        greeting: 'Hi, {name}!',
        rename: 'Change name',
        namePlaceholder: 'Your name',
        nameLabel: 'Name',
        avatarLabel: 'Character',
        save: 'Save',
        cancel: 'Cancel',
        missionTitle: 'Your mission',
        change: 'Change',
        chooseGame: 'Choose your game',
        gameInvaders: 'Math Invaders',
        gameTables: 'Times Tables Galaxy',
        howToTitle: 'How to play',
        howToSteps: [
            'Press Play — you start right away.',
            'Tap the alien holding the right answer.',
            'Get several right in a row for more points!',
        ],
    },
    game: {
        score: 'Score',
        combo: 'Combo',
        question: 'Question',
        quit: 'Finish',
        help: 'Help',
        helpTitle: 'How to work it out',
        helpClose: 'Continue',
        start: 'Start',
        startHint: 'Tap the right answer',
        answerHint: 'Pick an answer',
        correct: 'Correct!',
        wrong: 'Missed!',
        timeUp: 'Time’s up!',
        theAnswerIs: 'The answer was',
        untimed: 'No time pressure',
    },
    summary: {
        complete: 'Mission complete!',
        perfect: 'Perfect!',
        score: 'Score',
        accuracy: 'Correct',
        bestStreak: 'Best streak',
        fastest: 'Fastest',
        newRecord: 'New record!',
        newBest: 'New best time!',
        playAgain: 'Play again',
        changeMission: 'Change mission',
        seeScores: 'Best scores',
    },
    settings: {
        title: 'Settings',
        tagline: 'Set up your mission',
        practiceTitle: 'What do you want to practise?',
        practiceHint: 'Pick one or more — all of them work at every rank.',
        rankTitle: 'How hard?',
        rankHint: 'Rank only sets how big the numbers get and how much time you have.',
        rankRange: 'up to {max}',
        keepOne: 'At least one kind of maths has to stay on.',
        languageTitle: 'Language',
        moreTitle: 'More settings',
        timerTitle: 'Countdown',
        timerHint: 'Off: work at your own pace. On: a clock per question.',
        soundTitle: 'Sound',
        soundHint: 'Sounds for hits and misses.',
        hintsTitle: 'Worked solutions',
        hintsHint: 'Shows the working after a miss, plus the help button.',
        on: 'On',
        off: 'Off',
        dataTitle: 'Your data',
        dataInfo: [
            'Everything stays on your device.',
            'No account, no ads, no tracking.',
        ],
        reset: 'Delete all data',
        resetConfirm: 'Really delete all data?',
        done: 'Done',
    },
    hof: {
        title: 'Best scores',
        subtitle: 'Your best missions',
        empty: 'Nothing here yet — play a mission!',
        timed: 'With countdown',
        untimed: 'Without countdown',
        accuracy: 'Correct',
        streak: 'Streak',
        legacyTitle: 'Earlier',
        legacyHint: 'Results from the old version — not comparable.',
    },
    error: {
        title: '👾 Something went wrong',
        body: 'The game hit a snag. Your scores are safe — give it another go.',
        reload: 'Reload',
    },
    operations: {
        addition: '➕ Plus',
        subtraction: '➖ Minus',
        multiplication: '✖️ Times',
        division: '➗ Divide',
        remainders: '🔢 Remainder',
    },
    ranks: {
        rookie: '🌱 Rookie',
        cadet: '⭐ Cadet',
        pilot: '🚀 Pilot',
        ace: '🔥 Ace',
        legend: '👑 Legend',
    },
    tt: {
        padSubmit: 'Submit', padDelete: 'Delete', title: '✖️ Times Tables Galaxy',
        galaxyHome: 'Home Galaxy', galaxyHomeTagline: 'Times tables 1 to 12', galaxySquares: 'Squares Nebula', galaxySquaresTagline: 'Numbers times themselves', galaxyShortcuts: 'Shortcuts Belt', galaxyShortcutsTagline: 'Tricks for 15, 20, and 25', galaxyDeep: 'Deep Space', galaxyDeepTagline: 'The bigger tables 13 to 19',
        dailyMission: 'Daily mission', duePlayMission: 'due facts — play mission', allCaughtUp: 'All caught up!', lockedHintSquares: 'Earn ⭐⭐ on 5 home planets', lockedHintShortcuts: 'Earn ⭐ on squares up to 12²', lockedHintDeep: 'Earn ⭐⭐ on tables 2 to 12', lockedHintSpeed: 'Earn ⭐ to unlock Speed Run',
        phaseLearn: 'Learn', phasePractice: 'Practice', phaseSpeed: 'Speed Run', heatmapTitle: 'Mastery map', heatmapCore: 'Core 1–12', heatmapExtended: 'Extended 13–25', heatmapSquares: 'Squares 1–25',
        trainExit: 'Back to map', summaryAccuracy: 'Accuracy', summaryStreak: 'Best streak', summaryLeveledUp: 'Levelled up', summaryPracticeBtn: 'Practise now', summaryTime: 'Time', summaryNewBest: 'New personal best!', summaryStarsEarned: 'You earned {n} star(s)!', summarySpeedUnlocked: 'Speed Run unlocked!', summaryMastered: 'Planet mastered!', summaryKeepPracticing: 'Keep practising for stars.', learnFinish: 'Great work!', learnCardDismiss: 'Got it', learnGuided: 'Try these now', speedGo: 'GO!',
        settingsTitle: 'Times tables trainer', settingsStrategyCards: 'Strategy cards', settingsStrategyHint: 'Shows a calculation tip when you need one.', settingsReset: 'Reset trainer progress', settingsResetConfirm: 'Really reset all times tables progress?',
    },
}

const it: Translations = {
    nav: { home: 'Inizio', hallOfFame: 'Classifica', settings: 'Impostazioni' },
    home: {
        defaultName: 'Asso',
        tagline: 'Colpisci la risposta giusta!',
        subtitle: 'Nessun login · Sempre gratis · Funziona offline',
        play: 'Gioca',
        playAgain: 'Continua',
        greeting: 'Ciao, {name}!',
        rename: 'Cambia nome',
        namePlaceholder: 'Il tuo nome',
        nameLabel: 'Nome',
        avatarLabel: 'Personaggio',
        save: 'Salva',
        cancel: 'Annulla',
        missionTitle: 'La tua missione',
        change: 'Cambia',
        chooseGame: 'Scegli il tuo gioco',
        gameInvaders: 'Math Invaders',
        gameTables: 'Galassia delle tabelline',
        howToTitle: 'Come si gioca',
        howToSteps: [
            'Premi Gioca — si parte subito.',
            'Tocca l’alieno con la risposta giusta.',
            'Indovina più volte di fila per fare più punti!',
        ],
    },
    game: {
        score: 'Punti',
        combo: 'Combo',
        question: 'Domanda',
        quit: 'Termina',
        help: 'Aiuto',
        helpTitle: 'Come si calcola',
        helpClose: 'Continua',
        start: 'Via!',
        startHint: 'Tocca la risposta giusta',
        answerHint: 'Scegli una risposta',
        correct: 'Giusto!',
        wrong: 'Mancato!',
        timeUp: 'Tempo scaduto!',
        theAnswerIs: 'La risposta era',
        untimed: 'Senza fretta',
    },
    summary: {
        complete: 'Missione compiuta!',
        perfect: 'Perfetto!',
        score: 'Punti',
        accuracy: 'Giuste',
        bestStreak: 'Serie migliore',
        fastest: 'Più veloce',
        newRecord: 'Nuovo record!',
        newBest: 'Nuovo tempo migliore!',
        playAgain: 'Ancora',
        changeMission: 'Cambia missione',
        seeScores: 'Classifica',
    },
    settings: {
        title: 'Impostazioni',
        tagline: 'Prepara la tua missione',
        practiceTitle: 'Cosa vuoi allenare?',
        practiceHint: 'Scegline uno o più — sono tutti disponibili a ogni grado.',
        rankTitle: 'Quanto difficile?',
        rankHint: 'Il grado decide solo quanto sono grandi i numeri e quanto tempo hai.',
        rankRange: 'fino a {max}',
        keepOne: 'Almeno un tipo di calcolo deve restare attivo.',
        languageTitle: 'Lingua',
        moreTitle: 'Altre impostazioni',
        timerTitle: 'Conto alla rovescia',
        timerHint: 'Spento: vai con calma. Acceso: tempo per domanda.',
        soundTitle: 'Suono',
        soundHint: 'Suoni per colpi ed errori.',
        hintsTitle: 'Spiegazioni',
        hintsHint: 'Mostra il procedimento dopo un errore e il pulsante aiuto.',
        on: 'Sì',
        off: 'No',
        dataTitle: 'I tuoi dati',
        dataInfo: [
            'Tutto resta sul tuo dispositivo.',
            'Nessun account, nessuna pubblicità, nessun tracciamento.',
        ],
        reset: 'Cancella tutti i dati',
        resetConfirm: 'Cancellare davvero tutti i dati?',
        done: 'Fatto',
    },
    hof: {
        title: 'Classifica',
        subtitle: 'Le tue missioni migliori',
        empty: 'Ancora niente — gioca una missione!',
        timed: 'Con conto alla rovescia',
        untimed: 'Senza conto alla rovescia',
        accuracy: 'Giuste',
        streak: 'Serie',
        legacyTitle: 'Prima',
        legacyHint: 'Risultati della vecchia versione — non confrontabili.',
    },
    error: {
        title: '👾 Qualcosa è andato storto',
        body: 'Il gioco ha avuto un problema. I tuoi punti sono al sicuro — riprova.',
        reload: 'Ricarica',
    },
    operations: {
        addition: '➕ Più',
        subtraction: '➖ Meno',
        multiplication: '✖️ Per',
        division: '➗ Diviso',
        remainders: '🔢 Con resto',
    },
    ranks: {
        rookie: '🌱 Novellino',
        cadet: '⭐ Cadetto',
        pilot: '🚀 Pilota',
        ace: '🔥 Asso',
        legend: '👑 Leggenda',
    },
    tt: {
        padSubmit: 'Invia', padDelete: 'Cancella', title: '✖️ Galassia delle tabelline',
        galaxyHome: 'Galassia base', galaxyHomeTagline: 'Le tabelline da 1 a 12', galaxySquares: 'Nebulosa dei quadrati', galaxySquaresTagline: 'Numeri moltiplicati per se stessi', galaxyShortcuts: 'Cintura delle scorciatoie', galaxyShortcutsTagline: 'Trucchi per 15, 20 e 25', galaxyDeep: 'Spazio profondo', galaxyDeepTagline: 'Le grandi tabelline da 13 a 19',
        dailyMission: 'Missione quotidiana', duePlayMission: 'fatti da ripassare — gioca', allCaughtUp: 'Tutto fatto!', lockedHintSquares: 'Ottieni ⭐⭐ su 5 pianeti base', lockedHintShortcuts: 'Ottieni ⭐ sui quadrati fino a 12²', lockedHintDeep: 'Ottieni ⭐⭐ sulle tabelline 2–12', lockedHintSpeed: 'Ottieni ⭐ per sbloccare la corsa veloce',
        phaseLearn: 'Impara', phasePractice: 'Esercitati', phaseSpeed: 'Corsa veloce', heatmapTitle: 'Mappa della padronanza', heatmapCore: 'Base 1–12', heatmapExtended: 'Estesa 13–25', heatmapSquares: 'Quadrati 1–25',
        trainExit: 'Torna alla mappa', summaryAccuracy: 'Precisione', summaryStreak: 'Migliore serie', summaryLeveledUp: 'Avanzato', summaryPracticeBtn: 'Esercitati ora', summaryTime: 'Tempo', summaryNewBest: 'Nuovo record personale!', summaryStarsEarned: 'Hai guadagnato {n} stella/e!', summarySpeedUnlocked: 'Corsa veloce sbloccata!', summaryMastered: 'Pianeta conquistato!', summaryKeepPracticing: 'Continua per guadagnare stelle.', learnFinish: 'Ottimo lavoro!', learnCardDismiss: 'Capito', learnGuided: 'Prova ora', speedGo: 'VIA!',
        settingsTitle: 'Allenatore di tabelline', settingsStrategyCards: 'Carte strategia', settingsStrategyHint: 'Mostra un suggerimento di calcolo quando serve.', settingsReset: 'Azzera i progressi', settingsResetConfirm: 'Azzerare davvero tutti i progressi delle tabelline?',
    },
}

const fr: Translations = {
    nav: { home: 'Accueil', hallOfFame: 'Meilleurs scores', settings: 'Réglages' },
    home: {
        defaultName: 'As',
        tagline: 'Touche la bonne réponse !',
        subtitle: 'Sans compte · Toujours gratuit · Fonctionne hors ligne',
        play: 'Jouer',
        playAgain: 'Continuer',
        greeting: 'Salut, {name} !',
        rename: 'Changer de nom',
        namePlaceholder: 'Ton prénom',
        nameLabel: 'Prénom',
        avatarLabel: 'Personnage',
        save: 'Enregistrer',
        cancel: 'Annuler',
        missionTitle: 'Ta mission',
        change: 'Modifier',
        chooseGame: 'Choisis ton jeu',
        gameInvaders: 'Math Invaders',
        gameTables: 'Galaxie des multiplications',
        howToTitle: 'Comment jouer',
        howToSteps: [
            'Appuie sur Jouer — ça commence tout de suite.',
            'Touche l’alien qui porte la bonne réponse.',
            'Enchaîne les bonnes réponses pour plus de points !',
        ],
    },
    game: {
        score: 'Points',
        combo: 'Combo',
        question: 'Question',
        quit: 'Terminer',
        help: 'Aide',
        helpTitle: 'Comment calculer',
        helpClose: 'Continuer',
        start: 'C’est parti',
        startHint: 'Touche la bonne réponse',
        answerHint: 'Choisis une réponse',
        correct: 'Bravo !',
        wrong: 'Raté !',
        timeUp: 'Temps écoulé !',
        theAnswerIs: 'La réponse était',
        untimed: 'Sans chrono',
    },
    summary: {
        complete: 'Mission accomplie !',
        perfect: 'Parfait !',
        score: 'Points',
        accuracy: 'Bonnes',
        bestStreak: 'Meilleure série',
        fastest: 'Plus rapide',
        newRecord: 'Nouveau record !',
        newBest: 'Nouveau meilleur temps !',
        playAgain: 'Rejouer',
        changeMission: 'Changer de mission',
        seeScores: 'Meilleurs scores',
    },
    settings: {
        title: 'Réglages',
        tagline: 'Prépare ta mission',
        practiceTitle: 'Que veux-tu entraîner ?',
        practiceHint: 'Choisis-en un ou plusieurs — tous sont disponibles à chaque grade.',
        rankTitle: 'Quelle difficulté ?',
        rankHint: 'Le grade fixe seulement la taille des nombres et le temps dont tu disposes.',
        rankRange: 'jusqu’à {max}',
        keepOne: 'Au moins un type de calcul doit rester activé.',
        languageTitle: 'Langue',
        moreTitle: 'Plus de réglages',
        timerTitle: 'Chrono',
        timerHint: 'Désactivé : à ton rythme. Activé : du temps par question.',
        soundTitle: 'Son',
        soundHint: 'Sons pour les réussites et les erreurs.',
        hintsTitle: 'Explications',
        hintsHint: 'Montre le calcul après une erreur, et le bouton aide.',
        on: 'Oui',
        off: 'Non',
        dataTitle: 'Tes données',
        dataInfo: [
            'Tout reste sur ton appareil.',
            'Pas de compte, pas de pub, pas de pistage.',
        ],
        reset: 'Effacer toutes les données',
        resetConfirm: 'Vraiment tout effacer ?',
        done: 'Terminé',
    },
    hof: {
        title: 'Meilleurs scores',
        subtitle: 'Tes meilleures missions',
        empty: 'Rien ici — joue une mission !',
        timed: 'Avec chrono',
        untimed: 'Sans chrono',
        accuracy: 'Bonnes',
        streak: 'Série',
        legacyTitle: 'Avant',
        legacyHint: 'Résultats de l’ancienne version — non comparables.',
    },
    error: {
        title: '👾 Un problème est survenu',
        body: 'Le jeu a rencontré une erreur. Tes points sont en sécurité — réessaie.',
        reload: 'Recharger',
    },
    operations: {
        addition: '➕ Plus',
        subtraction: '➖ Moins',
        multiplication: '✖️ Fois',
        division: '➗ Divisé',
        remainders: '🔢 Avec reste',
    },
    ranks: {
        rookie: '🌱 Débutant',
        cadet: '⭐ Cadet',
        pilot: '🚀 Pilote',
        ace: '🔥 As',
        legend: '👑 Légende',
    },
    tt: {
        padSubmit: 'Valider', padDelete: 'Effacer', title: '✖️ Galaxie des multiplications',
        galaxyHome: 'Galaxie de départ', galaxyHomeTagline: 'Les tables de 1 à 12', galaxySquares: 'Nébuleuse des carrés', galaxySquaresTagline: 'Les nombres multipliés par eux-mêmes', galaxyShortcuts: 'Ceinture des raccourcis', galaxyShortcutsTagline: 'Astuces pour 15, 20 et 25', galaxyDeep: 'Espace profond', galaxyDeepTagline: 'Les grandes tables de 13 à 19',
        dailyMission: 'Mission quotidienne', duePlayMission: 'faits à revoir — jouer', allCaughtUp: 'Tout est fait !', lockedHintSquares: 'Gagne ⭐⭐ sur 5 planètes de départ', lockedHintShortcuts: 'Gagne ⭐ sur les carrés jusqu’à 12²', lockedHintDeep: 'Gagne ⭐⭐ sur les tables 2 à 12', lockedHintSpeed: 'Gagne ⭐ pour débloquer le sprint',
        phaseLearn: 'Apprendre', phasePractice: 'S’entraîner', phaseSpeed: 'Sprint', heatmapTitle: 'Carte de maîtrise', heatmapCore: 'Base 1–12', heatmapExtended: 'Étendu 13–25', heatmapSquares: 'Carrés 1–25',
        trainExit: 'Retour à la carte', summaryAccuracy: 'Précision', summaryStreak: 'Meilleure série', summaryLeveledUp: 'Progressé', summaryPracticeBtn: 'S’entraîner', summaryTime: 'Temps', summaryNewBest: 'Nouveau record personnel !', summaryStarsEarned: 'Tu as gagné {n} étoile(s) !', summarySpeedUnlocked: 'Sprint débloqué !', summaryMastered: 'Planète maîtrisée !', summaryKeepPracticing: 'Continue pour gagner des étoiles.', learnFinish: 'Excellent travail !', learnCardDismiss: 'Compris', learnGuided: 'Essaie maintenant', speedGo: 'GO !',
        settingsTitle: 'Entraîneur de tables', settingsStrategyCards: 'Cartes stratégie', settingsStrategyHint: 'Affiche une astuce de calcul au besoin.', settingsReset: 'Réinitialiser les progrès', settingsResetConfirm: 'Réinitialiser tous les progrès des tables ?',
    },
}

export const translations: Record<Language, Translations> = { de, en, it, fr }

export function fill(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
        template,
    )
}
