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
}

export const translations: Record<Language, Translations> = { de, en, it, fr }

export function fill(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
        template,
    )
}
