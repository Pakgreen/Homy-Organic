"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminBannerPage() {
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    axios
      .get("/api/banner")
      .then((res) => {
        if (res.data?.text) setText(res.data.text);
        if (typeof res.data?.enabled === "boolean") setEnabled(res.data.enabled);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const save = async () => {
    setIsSaving(true);
    try {
      await axios.put("/api/banner", { text, enabled });
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Top Banner</h1>
      <p className="text-sm text-gray-600 mb-4">
        Edit the small announcement text shown at the top of the site.
      </p>

      <div className="space-y-3 max-w-xl">
         <div className="flex items-center space-x-2">
           <input
             type="checkbox"
             checked={enabled}
             onChange={(e) => setEnabled(e.target.checked)}
             className="h-4 w-4 text-black focus:ring-0 border-gray-300 rounded"
           />
           <label className="text-sm font-medium">Show Top Banner</label>
         </div>
         <textarea
           value={text}
           onChange={(e) => setText(e.target.value)}
           className="w-full border border-gray-200 rounded p-3 min-h-20"
         />

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={isSaving}
            className="px-4 py-2 bg-black cursor-pointer text-white rounded"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border rounded cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
