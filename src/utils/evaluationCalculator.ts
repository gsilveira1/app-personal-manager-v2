import type { Skinfolds, Perimeters, ProtocolType, EquationType } from '../types'

export interface EvaluationCalculatorParams {
  gender: 'M' | 'F' | string
  age: number
  weight: number
  height?: number
  skinfolds?: Skinfolds
  perimeters?: Perimeters
  protocol: ProtocolType | string
  equation: EquationType | string
}

export interface EvaluationCalculatorOutput {
  bodyDensity: number
  bodyFatPercentage: number
  fatMass: number
  leanMass: number
  bmi?: number
  waistToHipRatio?: number
  idealWeight?: number
}

export const calculateEvaluationMetrics = ({ gender, age, weight, height, skinfolds = {}, perimeters = {}, protocol, equation }: EvaluationCalculatorParams): EvaluationCalculatorOutput => {
  const isFemale = (gender || 'M').toUpperCase().startsWith('F')
  const gNorm: 'M' | 'F' = isFemale ? 'F' : 'M'
  const validAge = age || 25
  const validWeight = weight || 70

  let bodyDensity = 1.05

  // Map aliases
  const triceps = skinfolds.triceps || 0
  const biceps = skinfolds.biceps || 0
  const subscapular = skinfolds.subscapular || 0
  const pectoral = skinfolds.pectoral || (skinfolds as any).chest || 0
  const suprailiac = skinfolds.suprailiac || skinfolds.supraSpinal || 0
  const axillary = skinfolds.axillary || (skinfolds as any).midaxillary || 0
  const abdominal = skinfolds.abdominal || 0
  const thigh = skinfolds.thigh || 0
  const calf = skinfolds.calf || 0

  if (protocol === 'POLLOCK_3') {
    if (gNorm === 'M') {
      const sum = pectoral + abdominal + thigh
      if (sum > 0) {
        bodyDensity = 1.10938 - 0.0008267 * sum + 0.0000016 * Math.pow(sum, 2) - 0.0002574 * validAge
      }
    } else {
      const sum = triceps + suprailiac + thigh
      if (sum > 0) {
        bodyDensity = 1.0994921 - 0.0009929 * sum + 0.0000023 * Math.pow(sum, 2) - 0.0001392 * validAge
      }
    }
  } else if (protocol === 'POLLOCK_7') {
    const sum = pectoral + axillary + triceps + subscapular + abdominal + suprailiac + thigh
    if (sum > 0) {
      if (gNorm === 'M') {
        bodyDensity = 1.112 - 0.00043499 * sum + 0.00000055 * Math.pow(sum, 2) - 0.00028826 * validAge
      } else {
        bodyDensity = 1.097 - 0.00046971 * sum + 0.00000056 * Math.pow(sum, 2) - 0.00012828 * validAge
      }
    }
  } else if (protocol === 'PETROSKI_4') {
    const sum = triceps + subscapular + suprailiac + calf
    if (sum > 0) {
      if (gNorm === 'M') {
        bodyDensity = 1.10726863 - 0.00081201 * sum + 0.00000212 * Math.pow(sum, 2) - 0.00041761 * validAge
      } else {
        bodyDensity = 1.1954713 - 0.07513507 * Math.log10(sum) - 0.00041072 * validAge
      }
    }
  } else if (protocol === 'DURNIN_WOMERSLEY_4') {
    const sum = biceps + triceps + subscapular + suprailiac
    if (sum > 0) {
      let c = 1.162
      let m = 0.063
      if (validAge < 17) {
        c = gNorm === 'M' ? 1.1533 : 1.1369
        m = gNorm === 'M' ? 0.0643 : 0.0598
      } else if (validAge <= 19) {
        c = gNorm === 'M' ? 1.162 : 1.1549
        m = gNorm === 'M' ? 0.063 : 0.0678
      } else if (validAge <= 29) {
        c = gNorm === 'M' ? 1.1631 : 1.1599
        m = gNorm === 'M' ? 0.0632 : 0.0717
      } else if (validAge <= 39) {
        c = gNorm === 'M' ? 1.1422 : 1.1423
        m = gNorm === 'M' ? 0.0544 : 0.0684
      } else if (validAge <= 49) {
        c = gNorm === 'M' ? 1.162 : 1.1333
        m = gNorm === 'M' ? 0.07 : 0.0612
      } else {
        c = gNorm === 'M' ? 1.1715 : 1.1339
        m = gNorm === 'M' ? 0.0779 : 0.0645
      }
      bodyDensity = c - m * Math.log10(sum)
    }
  }

  let bodyFatPercentage = 0
  if (equation === 'BROZEK') {
    bodyFatPercentage = (4.57 / bodyDensity - 4.142) * 100
  } else {
    bodyFatPercentage = (4.95 / bodyDensity - 4.5) * 100
  }

  bodyFatPercentage = Math.max(2, Math.min(60, bodyFatPercentage))
  const fatMass = validWeight * (bodyFatPercentage / 100)
  const leanMass = validWeight - fatMass

  let bmi: number | undefined
  if (height && height > 0) {
    const hM = height / 100
    bmi = Number((validWeight / (hM * hM)).toFixed(2))
  }

  let waistToHipRatio: number | undefined
  const waist = perimeters.waist || perimeters.abdomen
  const hip = perimeters.hip
  if (waist && hip && hip > 0) {
    waistToHipRatio = Number((waist / hip).toFixed(2))
  }

  const targetFatPct = gNorm === 'M' ? 15 : 22
  const idealWeight = Number((leanMass / (1 - targetFatPct / 100)).toFixed(2))

  return {
    bodyDensity: Number(bodyDensity.toFixed(5)),
    bodyFatPercentage: Number(bodyFatPercentage.toFixed(2)),
    fatMass: Number(fatMass.toFixed(2)),
    leanMass: Number(leanMass.toFixed(2)),
    bmi,
    waistToHipRatio,
    idealWeight,
  }
}

/**
 * Returns required skinfold fields for a given protocol.
 */
export const getRequiredSkinfoldsForProtocol = (protocol: ProtocolType | string, gender: string = 'M'): (keyof Skinfolds)[] => {
  const isFemale = (gender || 'M').toUpperCase().startsWith('F')
  switch (protocol) {
    case 'POLLOCK_3':
      return isFemale ? ['triceps', 'suprailiac', 'thigh'] : ['pectoral', 'abdominal', 'thigh']
    case 'POLLOCK_7':
      return ['pectoral', 'axillary', 'triceps', 'subscapular', 'abdominal', 'suprailiac', 'thigh']
    case 'PETROSKI_4':
      return ['triceps', 'subscapular', 'suprailiac', 'calf']
    case 'DURNIN_WOMERSLEY_4':
      return ['biceps', 'triceps', 'subscapular', 'suprailiac']
    default:
      return ['triceps', 'subscapular', 'suprailiac', 'abdominal']
  }
}
