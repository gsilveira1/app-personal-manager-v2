// A centralized API client to handle fetch requests, authentication, and error handling.

const API_BASE_URL = '/api'; // This would be an environment variable in a real production app.

/**
 * A wrapper around the Fetch API to make authenticated requests to the backend.
 * @param endpoint The API endpoint to call (e.g., '/clients').
 * @param options The standard RequestInit options for fetch.
 * @returns The JSON response from the API.
 * @throws An error if the network request fails or the API returns a non-ok response.
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
      
      const error = new Error(errorData?.message || `Request failed with status ${response.status}`);
      throw error;
    }

    // Handle responses with no content (e.g., 204 from a DELETE request)
    if (response.status === 204) {
      return null as T;
    }

    return await response.json();

  } catch (error) {
    console.error(`API Client Error: ${error.message}`, { endpoint, options });
    // Re-throw the error so it can be handled by the calling function/component
    throw error;
  }
};

export default apiClient;
