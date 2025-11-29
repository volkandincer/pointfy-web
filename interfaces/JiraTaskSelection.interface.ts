import type { JiraBoard, JiraTask } from "./Jira.interface";

export interface JiraTaskSelectionState {
  selectedBoardId: number | null;
  selectedTask: JiraTask | null;
  loadingBoards: boolean;
  loadingIssues: boolean;
  error: string | null;
}

export interface JiraTaskSelectorProps {
  onTaskSelect: (task: JiraTask) => void;
  onCancel: () => void;
  jiraBaseUrl?: string | null;
}

export interface JiraBoardWithIssues extends JiraBoard {
  issues?: JiraTask[];
}

