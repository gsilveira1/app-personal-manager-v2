import { type PlanFeatureDescriptor } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Retrieves the catalogue of features a plan can enable. The catalogue is defined
 * in the API code; it cannot be edited from the client.
 */
export const getPlanFeatures = async () => apiClient<PlanFeatureDescriptor[]>('/plan-features')
