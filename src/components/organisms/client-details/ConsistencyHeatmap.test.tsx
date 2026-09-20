import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConsistencyHeatmap } from './ConsistencyHeatmap'
import * as api from '../../../services/api/apiService'

vi.mock('../../../services/api/apiService', () => ({
  getActivityHeatmap: vi.fn(),
}))

describe('ConsistencyHeatmap', () => {
  it('renders heatmap metrics and days', async () => {
    vi.mocked(api.getActivityHeatmap).mockResolvedValue({
      studentId: 'student-1',
      totalCompletedMonth: 12,
      currentStreak: 5,
      lastWorkoutDate: '2026-09-19T10:00:00.000Z',
      days: [
        {
          date: '2026-09-19',
          status: 'COMPLETED',
          workoutName: 'Treino A',
          durationMinutes: 45,
        },
        {
          date: '2026-09-18',
          status: 'NO_ACTIVITY',
        },
      ],
    })

    render(<ConsistencyHeatmap clientId="student-1" />)

    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('5 dias')).toBeInTheDocument()
    expect(screen.getByText(/Consistência nos últimos 30 dias/)).toBeInTheDocument()
  })
})
