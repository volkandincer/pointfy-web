"use client";

import { memo, useState } from "react";
import NoteModal from "./NoteModal";
import { useNotes } from "@/hooks/useNotes";
import { useToastContext } from "@/contexts/ToastContext";

const GlobalNoteFab = memo(function GlobalNoteFab() {
  const { addNote } = useNotes();
  const { showToast } = useToastContext();
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-indigo-600 shadow-lg shadow-gray-500/20 backdrop-blur-sm transition hover:bg-white hover:shadow-xl"
        aria-label="Not ekle"
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="3.5"
            y="3.5"
            width="17"
            height="17"
            rx="4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <NoteModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={async (input) => {
          try {
            await addNote(input);
            // Eğer custom kategori "general" olarak kaydedildiyse kullanıcıyı bilgilendir
            const validCategories = ["general", "work", "personal", "ideas", "todo", "important"];
            if (!validCategories.includes(input.category)) {
              showToast(
                "Not kaydedildi, ancak özel kategori 'Genel' olarak kaydedildi (veritabanı kısıtlaması).",
                "info",
                5000
              );
            } else {
              showToast("Not başarıyla kaydedildi!", "success");
            }
            setShowModal(false);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
            showToast(
              `Not kaydedilemedi: ${errorMessage}`,
              "error"
            );
          }
        }}
      />
    </>
  );
});

export default GlobalNoteFab;

