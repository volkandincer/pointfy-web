-- Add Jira issue fields to user_personal_tasks table
ALTER TABLE user_personal_tasks
ADD COLUMN IF NOT EXISTS jira_issue_key TEXT,
ADD COLUMN IF NOT EXISTS jira_issue_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_personal_tasks_jira_issue_key ON user_personal_tasks(jira_issue_key);

-- Add comment
COMMENT ON COLUMN user_personal_tasks.jira_issue_key IS 'Jira issue key (e.g., PROJ-123) if this task is linked to a Jira issue';
COMMENT ON COLUMN user_personal_tasks.jira_issue_url IS 'Jira issue URL if this task is linked to a Jira issue';

