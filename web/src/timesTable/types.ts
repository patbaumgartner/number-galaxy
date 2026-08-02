export type GalaxyId = 'home' | 'squares' | 'shortcuts' | 'deep'

export type PlanetId =
  | 't1'
  | 't2'
  | 't3'
  | 't4'
  | 't5'
  | 't6'
  | 't7'
  | 't8'
  | 't9'
  | 't10'
  | 't11'
  | 't12'
  | 'sq-core'
  | 'sq-deep'
  | 't15'
  | 't20'
  | 't25'
  | 't13'
  | 't14'
  | 't16'
  | 't17'
  | 't18'
  | 't19'

export type Phase = 'learn' | 'practice' | 'speed' | 'daily'
export type FactKey = `${number}x${number}`

export type Fact = {
  readonly key: FactKey
  readonly a: number
  readonly b: number
  readonly answer: number
}

export type StarLevel = 0 | 1 | 2 | 3

export type FactProgress = {
  readonly box: 1 | 2 | 3 | 4 | 5
  readonly lastDay: number
  readonly last3: readonly {
    readonly correct: boolean
    readonly ms: number
  }[]
}
