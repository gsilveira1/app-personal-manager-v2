// A centralized API client to handle fetch requests, authentication, and error handling.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_BASE_URL = '/api'; // This would be an environment variable in a real production app.

/**
 * A wrapper around the Fetch API to make authenticated requests to the backend.
 * @param endpoint The API endpoint to call (e.g., '/clients').
 * @param options The standard RequestInit options for fetch.
 * @returns The JSON response from the API.
 * @throws An ApiError if the network request fails or the API returns a non-ok response.
 */
const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('authToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      
      throw new ApiError(errorData?.message || `Request failed with status ${response.status}`, response.status);
    }

    // Handle responses with no content (e.g., 204 from a DELETE request)
    if (response.status === 204) {
      return null as T;
    }

    return await response.json();

  } catch (error) {
    if (error instanceof ApiError) {
        // Re-throw ApiError to be handled by the caller
        throw error;
    }
    // Handle network errors or other unexpected issues
    console.error(`API Client Network Error: ${(error as Error).message}`, { endpoint, options });
    throw new ApiError('A network error occurred. Please check your connection.', 0); // 0 for network error
  }
};

export default apiClient;
