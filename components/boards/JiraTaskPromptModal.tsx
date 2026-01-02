"use client";

import { memo } from "react";
import { Link2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface JiraTaskPromptModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const JiraTaskPromptModal = memo(function JiraTaskPromptModal({
  open,
  onClose,
  onConfirm,
}: JiraTaskPromptModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
            <Link2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="font-bold">Jira&apos;dan Task Ekle</span>
        </div>
      }
      className="sm:border-purple-600/30 dark:sm:border-purple-500/30"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Bu board&apos;a Jira&apos;daki task&apos;larınızdan eklemek ister misiniz?
        </p>
        <div className="flex items-center justify-end gap-2 border-t-2 border-border pt-3">
          <Button variant="secondary" size="md" onClick={onClose}>
            Hayır
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            className="!border-purple-600 !bg-purple-600 hover:!border-purple-700 hover:!bg-purple-700 dark:!border-purple-500 dark:!bg-purple-600 dark:hover:!border-purple-400 dark:hover:!bg-purple-500"
          >
            Evet
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default JiraTaskPromptModal;

