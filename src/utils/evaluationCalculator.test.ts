import { describe, it, expect } from 'vitest'
import { calculateEvaluationMetrics, getRequiredSkinfoldsForProtocol } from './evaluationCalculator'

describe('evaluationCalculator', () => {
  it('should calculate Pollock 3 correctly for males', () => {
    const result = calculateEvaluationMetrics({
      gender: 'M',
      age: 30,
      weight: 80,
      height: 180,
      protocol: 'POLLOCK_3',
      equation: 'SIRI',
      skinfolds: { pectoral: 12, abdominal: 20, thigh: 15 },
    })

    expect(result.bodyDensity).toBeGreaterThan(1.04)
    expect(result.bodyFatPercentage).toBeGreaterThan(5)
    expect(result.fatMass + result.leanMass).toBeCloseTo(80, 1)
    expect(result.bmi).toBe(24.69)
  })

  it('should return correct required skinfolds per protocol', () => {
    expect(getRequiredSkinfoldsForProtocol('POLLOCK_3', 'M')).toEqual(['pectoral', 'abdominal', 'thigh'])
    expect(getRequiredSkinfoldsForProtocol('POLLOCK_3', 'F')).toEqual(['triceps', 'suprailiac', 'thigh'])
    expect(getRequiredSkinfoldsForProtocol('PETROSKI_4', 'M')).toEqual(['triceps', 'subscapular', 'suprailiac', 'calf'])
  })
})
