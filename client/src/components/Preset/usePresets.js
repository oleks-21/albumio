import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../../api';

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Saved slideshows ("presets" in the API). A preset stores a name plus the
 * filenames of the photos it contains — not edits or ordering metadata.
 */
export default function usePresets(email) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/user-presets?email=${encodeURIComponent(email)}`);
      const data = await readJson(res);
      if (!res.ok || !Array.isArray(data)) throw new Error();
      // The sheet can hold duplicate rows for one name; show each name once.
      setPresets([...new Set(data.filter(Boolean))]);
      setError('');
    } catch {
      setError('Could not load your saved slideshows.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadPreset = useCallback(async (name) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/preset-images?preset=${encodeURIComponent(name)}`);
    } catch {
      throw new Error('Could not open that saved slideshow. Please check your connection.');
    }
    const data = await readJson(res);
    if (!res.ok || !Array.isArray(data.imageIds)) {
      throw new Error('Could not open that saved slideshow. Please try again.');
    }
    return data.imageIds;
  }, []);

  const savePreset = useCallback(async (presetName, imageIds) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/save-preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, presetName, imageIds }),
      });
    } catch {
      throw new Error('Could not save the slideshow. Please check your connection and try again.');
    }
    const data = await readJson(res);
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Could not save the slideshow. Please try again.');
    }
    await refresh();
  }, [email, refresh]);

  const deletePreset = useCallback(async (presetName) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/delete-preset`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, presetName }),
      });
    } catch {
      throw new Error('Could not delete the saved slideshow. Please check your connection and try again.');
    }
    const data = await readJson(res);
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Could not delete the saved slideshow. Please try again.');
    }
    await refresh();
  }, [email, refresh]);

  return { presets, loading, error, refresh, loadPreset, savePreset, deletePreset };
}
