import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface Node {
  _id: string;
  name: string;
  type: string;
  description: string;
  // Polymorphic discriminator properties
  level?: number | string;
  acronym?: string;
  region?: string;
  subjects?: string[];
  conductingBody?: string;
  website?: string;
  frequency?: string;
  eligibilityDescription?: string;
  streamRequirements?: string[];
  subjectRequirements?: string[];
  ageMin?: number;
  ageMax?: number;
  maxAttempts?: number;
  durationYears?: number;
  averageSalaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  growthRate?: string;
  sector?: string;
  category?: string;
  location?: {
    city: string;
    state: string;
  };
  nirfRanking?: number;
  ownership?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  _id: string;
  fromNode: string | Node;
  toNode: string | Node;
  type: string;
  metadata?: {
    minimumPercentage?: number;
    mandatorySubjects?: string[];
    feesEstimated?: number;
    description?: string;
  };
}

export interface RoadmapStep {
  node: Node;
  relationship?: Relationship;
}

export interface RoadmapPath {
  steps: RoadmapStep[];
}

export interface EligibilityRule {
  _id: string;
  sourceNode: Node;
  targetNode: Node;
  ruleType: 'ALLOW' | 'BLOCK';
  mandatorySubjects: string[];
  preferredSubjects: string[];
  entranceExamRequirements: Node[];
  minimumQualification?: Node;
  exceptions: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstituteCourseMapping {
  _id: string;
  institute: Node;
  degree: Node;
  entranceExam?: Node;
  specialization: string;
  fees?: number;
  seats?: number;
  placementStats?: {
    averageSalary?: number;
    placementRate?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ValidationIssue {
  _id?: string;
  type: 
    | 'BROKEN_RELATIONSHIP'
    | 'CIRCULAR_RELATIONSHIP'
    | 'INVALID_DEGREE_PATHWAY'
    | 'MISSING_ENTRANCE_EXAM_RELATION'
    | 'MISSING_ELIGIBILITY_RULE'
    | 'DUPLICATE_CAREER'
    | 'DUPLICATE_INSTITUTE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  details?: any;
}

export interface ValidationReport {
  summary: {
    totalIssues: number;
    brokenRelationships: number;
    circularRelationships: number;
    invalidDegreePathways: number;
    missingEntranceExams: number;
    missingEligibilityRules: number;
    duplicateCareers: number;
    duplicateInstitutes: number;
  };
  issues: ValidationIssue[];
}

export interface Suggestion {
  _id: string;
  visitorName: string;
  visitorEmail: string;
  type: 'QUALIFICATION' | 'STREAM' | 'SUBJECT_COMBINATION' | 'DEGREE' | 'OCCUPATION' | 'EXAM' | 'INSTITUTE' | 'OTHER';
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export const api = {
  // Nodes CRUD / Search
  getNodes: async (params?: { type?: string; search?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<{ nodes: Node[]; pagination: any }>('/nodes', { params });
    return response.data;
  },
  
  getNodeById: async (id: string) => {
    const response = await apiClient.get<Node>(`/nodes/${id}`);
    return response.data;
  },

  createNode: async (nodeData: any) => {
    const response = await apiClient.post<Node>('/nodes', nodeData);
    return response.data;
  },

  updateNode: async (id: string, nodeData: any) => {
    const response = await apiClient.put<Node>(`/nodes/${id}`, nodeData);
    return response.data;
  },

  deleteNode: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/nodes/${id}`);
    return response.data;
  },

  // Relationships
  getRelationships: async (params?: { fromNode?: string; toNode?: string; type?: string }) => {
    const response = await apiClient.get<Relationship[]>('/relationships', { params });
    return response.data;
  },

  // Roadmap Traversal Queries
  getBfsTree: async (nodeId: string, maxDepth?: number) => {
    const response = await apiClient.get<{ bfsTree: Record<number, Node[]> }>(`/roadmaps/bfs/${nodeId}`, {
      params: { maxDepth }
    });
    return response.data;
  },

  getShortestPath: async (fromNodeId: string, toNodeId: string) => {
    const response = await apiClient.get<{ path: RoadmapPath }>(`/roadmaps/shortest`, {
      params: { fromNodeId, toNodeId }
    });
    return response.data;
  },

  getAlternativePaths: async (fromNodeId: string, toNodeId: string, maxDepth?: number) => {
    const response = await apiClient.get<{ paths: RoadmapPath[] }>(`/roadmaps/alternatives`, {
      params: { fromNodeId, toNodeId, maxDepth }
    });
    return response.data;
  },

  getReachableCareers: async (nodeId: string, maxDepth?: number) => {
    const response = await apiClient.get<{
      totalPaths: number;
      careersReachableCount: number;
      careers: Node[];
      pathways: RoadmapPath[];
    }>(`/roadmaps/careers/${nodeId}`, {
      params: { maxDepth }
    });
    return response.data;
  },

  // Eligibility Rules CRUD
  getEligibilityRules: async () => {
    const response = await apiClient.get<EligibilityRule[]>('/eligibility-rules');
    return response.data;
  },

  createEligibilityRule: async (ruleData: any) => {
    const response = await apiClient.post<EligibilityRule>('/eligibility-rules', ruleData);
    return response.data;
  },

  deleteEligibilityRule: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/eligibility-rules/${id}`);
    return response.data;
  },

  // Institute Course Mappings CRUD
  getInstituteCourses: async (params?: { degree?: string; institute?: string; entranceExam?: string; search?: string }) => {
    const response = await apiClient.get<InstituteCourseMapping[]>('/institute-courses', { params });
    return response.data;
  },

  createInstituteCourse: async (mappingData: any) => {
    const response = await apiClient.post<InstituteCourseMapping>('/institute-courses', mappingData);
    return response.data;
  },

  updateInstituteCourse: async (id: string, mappingData: any) => {
    const response = await apiClient.put<InstituteCourseMapping>(`/institute-courses/${id}`, mappingData);
    return response.data;
  },

  deleteInstituteCourse: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/institute-courses/${id}`);
    return response.data;
  },

  getRecommendations: async (params: {
    degreeId?: string;
    careerId?: string;
    state?: string;
    ownership?: string;
    maxFees?: number;
    sortBy?: string;
  }) => {
    const response = await apiClient.get<InstituteCourseMapping[]>('/recommendations/institutes', { params });
    return response.data;
  },

  getValidationReport: async () => {
    const response = await apiClient.get<ValidationReport>('/validation/report');
    return response.data;
  },

  // Suggestions CRUD
  getSuggestions: async (params?: { status?: string; type?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<{ suggestions: Suggestion[]; pagination: any }>('/suggestions', { params });
    return response.data;
  },

  createSuggestion: async (suggestionData: {
    visitorName: string;
    visitorEmail: string;
    type: string;
    title: string;
    description: string;
  }) => {
    const response = await apiClient.post<Suggestion>('/suggestions', suggestionData);
    return response.data;
  },

  updateSuggestionStatus: async (id: string, status: 'APPROVED' | 'REJECTED', nodeData?: any) => {
    const response = await apiClient.patch<{ message: string; suggestion: Suggestion; node?: Node }>(
      `/suggestions/${id}/status`,
      { status, nodeData }
    );
    return response.data;
  },

  deleteSuggestion: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/suggestions/${id}`);
    return response.data;
  }
};
export default api;
