import type { BeamSkill, BeamZoneId } from '../beam'
import type { SenseSkill, SenseZoneId } from '../sense'
import type { MissReason, Operation, Rank } from '../game'

export type Translations = {
    nav: { home: string; hallOfFame: string; settings: string }
    home: {
        appName: string
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
        whoIsPlaying: string
        addPlayer: string
        newPlayer: string
        removePlayer: string
        removeConfirm: string
        switchTo: string
        playingNow: string
        missionTitle: string
        change: string
        chooseGame: string
        missionLength: string
        dueToday: string
        gameSense: string
        gameSenseBlurb: string
        howToSenseTitle: string
        howToPlay: string
        howToSenseSteps: string[]
        gameInvaders: string
        gameTables: string
        gameBeam: string
        gameInvadersBlurb: string
        gameTablesBlurb: string
        gameBeamBlurb: string
        howToTitle: string
        howToSteps: string[]
        howToTablesTitle: string
        howToTablesSteps: string[]
        howToBeamTitle: string
        howToBeamSteps: string[]
    }
    game: {
        exit: string
        score: string
        combo: string
        question: string
        quit: string
        help: string
        helpTitle: string
        readAloud: string
        helpClose: string
        start: string
        startHint: string
        answerHint: string
        correct: string
        wrong: string
        timeUp: string
        theAnswerIs: string
        untimed: string
        gotIt: string
        strategyAsk: string
        strategyKnew: string
        strategyCounted: string
        strategyTrick: string
    }
    misses: Record<Exclude<MissReason, 'none'>, string>

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
        easier: string
        easierHint: string
        stop: string
        stopHint: string
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
        timerTitle: string
        timerHint: string
        soundTitle: string
        soundHint: string
        hintsTitle: string
        hintsHint: string
        storiesTitle: string
        storiesHint: string
        showScoreTitle: string
        showScoreHint: string
        on: string
        off: string
        dataTitle: string
        dataInfo: string[]
        reset: string
        resetConfirm: string
        practiseNextTitle: string
        practiseNextHint: string
        timerOff: string
        timerGentle: string
        timerTimed: string
        timerGentleHint: string
        thinkingTitle: string
        thinkingHint: string
        thinkingNormal: string
        thinkingMore: string
        thinkingMost: string
        readableTitle: string
        readableHint: string
        groupInvaders: string
        groupInvadersHint: string
        groupTables: string
        groupTablesHint: string
        groupBeam: string
        groupBeamHint: string
        groupSense: string
        groupSenseHint: string
        groupShared: string
        groupSharedHint: string
    }
    printables: {
        title: string
        hint: string
        dotCards: string
        tenFrames: string
        numberLines: string
    }
    progress: {
        title: string
        tagline: string
        forWhom: string
        arcadeTitle: string
        answered: string
        notYet: string
        factsKnown: string
        practiseNext: string
        nothingDue: string
        tablesTitle: string
        tablesKnown: string
        beamTitle: string
        senseTitle: string
        stars: string
        exportTitle: string
        exportHint: string
        exportButton: string
        printButton: string
        privacy: string
        strategyStillCounting: string
        strategyKnows: string
        strategyTricks: string
        strategyTitle: string
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
        help: string
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
    /** Labels the shared play HUD shows in every game. */
    play: {
        question: string
        streak: string
    }
    surprise: {
        title: string
        blurb: string
        again: string
    }
    sense: {
        title: string
        tagline: string
        mapTitle: string
        mapHint: string
        lockedHint: string
        zones: Record<SenseZoneId, string>
        zoneTaglines: Record<SenseZoneId, string>
        skills: Record<SenseSkill, string>
        howMany: string
        placeIt: string
        lookAgain: string
        exitToMap: string
        playTitle: string
        playHint: string
        playLess: string
        playMore: string
        playDots: string
        playFrame: string
        playRack: string
        playLine: string
        playCard: string
        glanceHint: string
        closeEnough: string
        tier: string
        pictureLabel: string
        settingsGlance: string
        settingsGlanceHint: string
        settingsReset: string
        settingsResetConfirm: string
    }
    beam: {
        title: string
        tagline: string
        mapTitle: string
        mapHint: string
        lockedHint: string
        zones: Record<BeamZoneId, string>
        zoneTaglines: Record<BeamZoneId, string>
        skills: Record<BeamSkill, string>
        tier: string
        best: string
        exit: string
        help: string
        helpTitle: string
        helpClose: string
        barLabel: string
        beamMove: string
        beamFire: string
        beamLess: string
        beamMore: string
        slideHint: string
        question: string
        streak: string
        correct: string
        wrong: string
        theAnswerIs: string
        summaryTitle: string
        summaryAccuracy: string
        summaryStreak: string
        summaryStars: string
        summaryNewBest: string
        summaryKeepGoing: string
        playAgain: string
        settingsBar: string
        settingsBarHint: string
        settingsReset: string
        settingsResetConfirm: string
    }
}

