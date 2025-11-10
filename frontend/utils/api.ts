// Backend is running on 0.0.0.0:8000, but frontend needs actual reachable address
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL ='https://eff5ee185fb3.ngrok-free.APP'; // Production fallback

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
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  profile_complete: boolean;
  user_id: number;
}

interface UserProfile {
  id: number;
  email: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
  total_scans: number;
  co2_saved: number;
  level: string;
  created_at: string;
}

interface CompleteProfileData {
  first_name: string;
  last_name: string;
  address: string;
  name?: string;
}

interface ProfileStatusResponse {
  profile_complete: boolean;
  missing_fields: string[];
}

interface ClassificationRequest {
  image_data: string;
}

interface ClassificationResponse {
  item_type: string;
  confidence: number;
  recyclable: boolean;
  co2_impact: number;
  bbox?: number[];
  fallback_model?: boolean;
  image_path?: string;
}

class ApiService {
  private token: string | null = null;

  async initializeToken(): Promise<string | null> {
    const storedToken = await SecureStore.getItemAsync('authToken');
    if (storedToken) {
      this.token = storedToken;
      return storedToken;
    }
    return null;
  }

  async setToken(token: string) {
    this.token = token;
    await SecureStore.setItemAsync('authToken', token);
  }

  async clearToken() {
    this.token = null;
    await SecureStore.deleteItemAsync('authToken');
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
    return this.request<UserProfile>('/profile/profile');
  }

  async updateProfile(data: Partial<Pick<UserProfile, 'name' | 'first_name' | 'last_name' | 'address'>>): Promise<UserProfile> {
    return this.request<UserProfile>('/profile/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async completeProfile(data: CompleteProfileData): Promise<{ message: string; profile_complete: boolean; user: UserProfile }> {
    return this.request<{ message: string; profile_complete: boolean; user: UserProfile }>('/profile/complete-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkProfileStatus(): Promise<ProfileStatusResponse> {
    return this.request<ProfileStatusResponse>('/profile/check-profile-status');
  }

  async classifyItem(imageData: string): Promise<ClassificationResponse> {
    return this.request<ClassificationResponse>('/recycle/classify', {
      method: 'POST',
      body: JSON.stringify({ image_data: imageData }),
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const apiService = new ApiService();
export type { LoginData, SignupData, AuthResponse, UserProfile, ClassificationRequest, ClassificationResponse, CompleteProfileData, ProfileStatusResponse };