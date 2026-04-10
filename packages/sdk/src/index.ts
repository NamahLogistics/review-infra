export type ReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest';

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  text: string;
  authorName: string | null;
  verified: boolean;
  source: string;
  createdAt: string;
};

export type ReviewsResponse = {
  product: {
    id: string;
    externalId: string | null;
    name: string;
  };
  summary: {
    average: number;
    total: number;
    breakdown: Array<{ rating: number; count: number }>;
  };
  reviews: PublicReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    sort: ReviewSort;
    rating: number | null;
  };
};

export type AdminReview = {
  id: string;
  storeId: string;
  productId: string;
  authorName: string | null;
  authorEmail: string | null;
  rating: number;
  title: string | null;
  text: string;
  status: string;
  verified: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminReviewsResponse = {
  reviews: AdminReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type SubmitReviewInput = {
  apiKey: string;
  productId: string;
  rating: number;
  title?: string;
  text: string;
  authorName?: string;
  authorEmail?: string;
};

export type SubmitReviewResponse = {
  success: boolean;
  review: {
    id: string;
    status: string;
  };
};

export type CreateNudgeInput = {
  storeId: string;
  productId: string;
  customerName?: string;
  customerEmail: string;
  orderRef?: string;
};

export type ReviewNudge = {
  id: string;
  storeId: string;
  productId: string;
  customerName: string | null;
  customerEmail: string;
  orderRef: string | null;
  status: string;
  sendAfter: string | null;
  sentAt: string | null;
  completedAt: string | null;
  resendCount: number;
  lastResendAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NudgeAnalytics = {
  total: number;
  pending: number;
  sent: number;
  completed: number;
  totalResends: number;
  completionRate: number;
};

export type ReviewInfraClientOptions = {
  apiBaseUrl: string;
  apiKey?: string;
  bearerToken?: string;
};

export class ReviewInfraClient {
  private apiBaseUrl: string;
  private apiKey?: string;
  private bearerToken?: string;

  constructor(options: ReviewInfraClientOptions) {
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, '');
    this.apiKey = options.apiKey;
    this.bearerToken = options.bearerToken;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  setBearerToken(token: string) {
    this.bearerToken = token;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.apiKey) {
      headers.set('x-api-key', this.apiKey);
    }
    if (this.bearerToken) {
      headers.set('authorization', `Bearer ${this.bearerToken}`);
    }

    const res = await fetch(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers,
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json?.error || 'Request failed');
    }

    return json as T;
  }

  async getReviews(input: {
    productId: string;
    page?: number;
    limit?: number;
    sort?: ReviewSort;
    rating?: number;
  }) {
    const params = new URLSearchParams();
    if (input.page) params.set('page', String(input.page));
    if (input.limit) params.set('limit', String(input.limit));
    if (input.sort) params.set('sort', input.sort);
    if (input.rating) params.set('rating', String(input.rating));

    const query = params.toString();
    return this.request<ReviewsResponse>(`/reviews/${encodeURIComponent(input.productId)}${query ? `?${query}` : ''}`);
  }

  async getAdminReviews(input: {
    productId: string;
    page?: number;
    limit?: number;
    sort?: ReviewSort;
    rating?: number;
  }) {
    const params = new URLSearchParams();
    if (input.page) params.set('page', String(input.page));
    if (input.limit) params.set('limit', String(input.limit));
    if (input.sort) params.set('sort', input.sort);
    if (input.rating) params.set('rating', String(input.rating));

    const query = params.toString();
    return this.request<AdminReviewsResponse>(`/reviews/admin/list/${encodeURIComponent(input.productId)}${query ? `?${query}` : ''}`);
  }

  async submitReview(input: SubmitReviewInput) {
    return this.request<SubmitReviewResponse>('/public-reviews/submit', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async createNudge(input: CreateNudgeInput) {
    return this.request<ReviewNudge>('/review-nudges', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async listNudges(storeId: string) {
    return this.request<ReviewNudge[]>(`/review-nudges?storeId=${encodeURIComponent(storeId)}`);
  }

  async getNudgeAnalytics(storeId: string) {
    return this.request<NudgeAnalytics>(`/review-nudges/analytics?storeId=${encodeURIComponent(storeId)}`);
  }

  async sendNudge(nudgeId: string) {
    return this.request<{ success: boolean; nudge: ReviewNudge; submitUrl: string }>('/review-nudges/send', {
      method: 'POST',
      body: JSON.stringify({ nudgeId }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: { id: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string) {
    return this.request<{ token: string; user: { id: string; email: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async me() {
    return this.request<{ id: string; email: string }>('/auth/me');
  }

  async createStore(name: string) {
    return this.request('/stores', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async listStores() {
    return this.request('/stores');
  }
}
