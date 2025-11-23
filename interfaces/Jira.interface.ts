export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      id: string;
      name: string;
      statusCategory: {
        id: number;
        key: string;
        colorName: string;
      };
    };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress?: string;
      avatarUrls: {
        "16x16": string;
        "24x24": string;
        "32x32": string;
        "48x48": string;
      };
    };
    priority?: {
      id: string;
      name: string;
      iconUrl: string;
    };
    issuetype: {
      id: string;
      name: string;
      iconUrl: string;
    };
    project: {
      id: string;
      key: string;
      name: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
  };
}

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraTask {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: string;
  statusColor: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
  priority?: string;
  type: string;
  project: {
    key: string;
    name: string;
  };
  created: string;
  updated: string;
  resolved?: string;
  url: string;
  boardId?: number;
  sprint?: {
    id: number;
    name: string;
    state: string;
  };
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string; // scrum, kanban
  location: {
    projectId: number;
    projectKey: string;
    projectName: string;
    displayName: string;
  };
  filterId?: number;
}

export interface JiraBoardResponse {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: JiraBoard[];
}

export interface JiraSprint {
  id: number;
  name: string;
  state: string; // active, closed, future
  startDate?: string;
  endDate?: string;
  goal?: string;
}
