// Backend is running on 0.0.0.0:8000, but frontend needs actual reachable address
const API_BASE_URL ='https://aaaf4299d3f2.ngrok-free.app'; // Production fallback

// Alternative configurations:
// const API_BASE_URL = 'http://localhost:8000'; // iOS Simulator
// const API_BASE_URL = 'http://192.168.1.XXX:8000'; // Your computer's IP for physical device

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

interface UserProfile {
  id: number;
  email: string;
  name: string;
  total_scans: number;
  co2_saved: number;
  level: string;
  created_at: string;
}

interface ClassificationRequest {
  image_data: string;
}

interface ClassificationResponse {
  item_type: string;
  confidence: number;
  recyclable: boolean;
  co2_impact: number;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/profile');
  }

  async classifyItem(imageData: string): Promise<ClassificationResponse> {
    return this.request<ClassificationResponse>('/classify', {
      method: 'POST',
      body: JSON.stringify({ image_data: imageData }),
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const apiService = new ApiService();
export type { LoginData, SignupData, AuthResponse, UserProfile, ClassificationRequest, ClassificationResponse };