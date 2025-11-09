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
        className="fixed bottom-6 right-0 z-40 flex items-center gap-2 rounded-l-2xl border border-gray-200/70 bg-white px-5 py-3.5 shadow-lg transition hover:shadow-xl dark:border-gray-800/70 dark:bg-gray-900"
        aria-label="Not ekle"
      >
        <span className="text-xl">📝</span>
        <span className="text-base font-semibold text-gray-900 dark:text-white">
          Not Ekle
        </span>
      </button>

      <NoteModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={async (input) => {
          try {
            await addNote(input);
            showToast("Not başarıyla kaydedildi!", "success");
            setShowModal(false);
          } catch (error: any) {
            showToast(
              `Not kaydedilemedi: ${error?.message || "Bilinmeyen hata"}`,
              "error"
            );
          }
        }}
      />
    </>
  );
});

export default GlobalNoteFab;

