"use client";

import { memo, useState, useRef, useEffect } from "react";

interface JqlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const JQL_KEYWORDS = [
  "AND", "OR", "NOT", "IN", "NOT IN",
  "IS", "IS NOT", "WAS", "WAS IN", "WAS NOT", "WAS NOT IN",
  "CHANGED", "FROM", "TO", "ON", "AFTER", "BEFORE", "BY",
  "DURING", "BY", "FROM", "TO"
];

const JQL_FIELDS = [
  "assignee", "reporter", "watcher", "project", "status", "priority",
  "issuetype", "summary", "description", "comment", "text", "created",
  "updated", "resolved", "due", "votes", "watches", "workratio",
  "timespent", "timeoriginalestimate", "timeestimate", "aggregatetimespent",
  "aggregatetimeoriginalestimate", "aggregatetimeestimate"
];

const JQL_FUNCTIONS = [
  "currentUser()", "membersOf()", "now()", "startOfDay()", "startOfWeek()",
  "startOfMonth()", "startOfYear()", "endOfDay()", "endOfWeek()",
  "endOfMonth()", "endOfYear()"
];

const ALL_SUGGESTIONS = [
  ...JQL_KEYWORDS.map(k => ({ type: "keyword", value: k })),
  ...JQL_FIELDS.map(f => ({ type: "field", value: f })),
  ...JQL_FUNCTIONS.map(f => ({ type: "function", value: f })),
];

const JqlInput = memo(function JqlInput({
  value,
  onChange,
  onSearch,
  placeholder = "örn: assignee = currentUser() AND status != Done",
  disabled = false,
}: JqlInputProps) {
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Array<{ type: string; value: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get word at cursor position
  const getCurrentWord = (text: string, cursorPos: number): string => {
    const beforeCursor = text.substring(0, cursorPos);
    const match = beforeCursor.match(/(\w+)$/);
    return match ? match[1] : "";
  };

  // Filter suggestions based on current word
  const updateSuggestions = (text: string, cursorPos: number) => {
    const currentWord = getCurrentWord(text, cursorPos);
    if (currentWord.length < 2) {
      setShowSuggestions(false);
      return;
    }

    const filtered = ALL_SUGGESTIONS.filter(s =>
      s.value.toLowerCase().startsWith(currentWord.toLowerCase())
    ).slice(0, 10);

    if (filtered.length > 0) {
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    updateSuggestions(newValue, e.target.selectionStart);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex].value);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSearch();
    }
  };

  const insertSuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;
    const beforeCursor = text.substring(0, start);
    const afterCursor = text.substring(end);
    const match = beforeCursor.match(/(\w+)$/);
    const wordStart = match ? start - match[1].length : start;

    const newValue =
      text.substring(0, wordStart) + suggestion + " " + afterCursor;
    onChange(newValue);
    setShowSuggestions(false);

    // Set cursor position after inserted suggestion
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = wordStart + suggestion.length + 1;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          if (value) {
            updateSuggestions(value, e.target.selectionStart);
          }
        }}
        placeholder={placeholder}
        rows={4}
        disabled={disabled}
        className="w-full rounded-md border-2 border-input bg-input px-4 py-3 text-sm text-card-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono leading-relaxed"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border-2 border-border bg-card shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}`}
              type="button"
              onClick={() => insertSuggestion(suggestion.value)}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "text-card-foreground hover:bg-accent"
              }`}
            >
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                  suggestion.type === "keyword"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    : suggestion.type === "field"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }`}
              >
                {suggestion.type === "keyword"
                  ? "KW"
                  : suggestion.type === "field"
                  ? "FLD"
                  : "FN"}
              </span>
              <span className="font-mono">{suggestion.value}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>JQL sorgunuzu girin. Auto-complete için yazmaya başlayın.</span>
        <span className="font-medium">Cmd/Ctrl + Enter ile ara</span>
      </div>
    </div>
  );
});

export default JqlInput;

