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
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-white shadow-xl shadow-purple-500/50 backdrop-blur-sm transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-2xl hover:shadow-purple-500/60 hover:scale-105 active:scale-95"
        aria-label="Not ekle"
      >
        <svg
          className="h-5 w-5 transition-transform group-hover:rotate-90"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden font-semibold sm:inline-block">Not Ekle</span>
        <span className="sm:hidden font-semibold">Not</span>
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

