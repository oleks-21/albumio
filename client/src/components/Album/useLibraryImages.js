import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '../../api';

/** Normalize a server/upload record into the shape the library uses. */
export const toPhoto = ({ name, url, collection }) => ({
  name,
  url,
  collection: collection || '',
  // Kept for components that still read `file.name` (e.g. preset ids).
  file: { name },
});

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Loads the signed-in user's photos and exposes the mutations the library
 * performs. Every mutation resolves only after the API confirms success and
 * throws a user-facing Error otherwise, so callers can keep UI state intact.
 */
export default function useLibraryImages(email) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const fetchImages = useCallback(async ({ quiet = false } = {}) => {
    if (!email) return;
    const id = ++requestId.current;
    if (!quiet) {
      setLoading(true);
      setError('');
    }
    try {
      const response = await fetch(`${API_BASE}/api/my-images?email=${encodeURIComponent(email)}`);
      const files = await readJson(response);
      if (id !== requestId.current) return;
      if (response.ok && Array.isArray(files)) {
        // Replace rather than merge so renamed/deleted photos never linger.
        setImages(files.map(toPhoto));
        setError('');
      } else if (!quiet) {
        setError('We couldn’t load your photos. Please try again.');
      }
    } catch {
      if (id === requestId.current && !quiet) {
        setError('We couldn’t load your photos. Please check your connection and try again.');
      }
    } finally {
      if (id === requestId.current && !quiet) setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  /** Add (or replace by name — the server overwrites same-named uploads). */
  const addImages = useCallback((records) => {
    setImages((prev) => {
      const incoming = records.map(toPhoto);
      const names = new Set(incoming.map((img) => img.name));
      return [...prev.filter((img) => !names.has(img.name)), ...incoming];
    });
  }, []);

  const deleteImage = useCallback(async (name) => {
    let response;
    try {
      response = await fetch(`${API_BASE}/api/delete-image`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
    } catch {
      throw new Error('Could not delete the photo. Please check your connection and try again.');
    }
    const result = await readJson(response);
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Could not delete the photo. Please try again.');
    }
    setImages((prev) => prev.filter((img) => img.name !== name));
  }, [email]);

  const renameImage = useCallback(async (oldName, newName) => {
    let response;
    try {
      response = await fetch(`${API_BASE}/api/rename-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName, email }),
      });
    } catch {
      throw new Error('Could not rename the photo. Please check your connection and try again.');
    }
    const result = await readJson(response);
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Could not rename the photo. Please try again.');
    }
    setImages((prev) =>
      prev.map((img) => (img.name === oldName ? { ...img, name: newName, file: { name: newName } } : img))
    );
    // The storage URL is path-based, so fetch the new one in the background.
    fetchImages({ quiet: true });
  }, [email, fetchImages]);

  const updateCollection = useCallback(async (imageName, newCollection) => {
    let response;
    try {
      response = await fetch(`${API_BASE}/api/update-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName, email, newCollection }),
      });
    } catch {
      throw new Error('Could not update the collection. Please check your connection and try again.');
    }
    const result = await readJson(response);
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Could not update the collection. Please try again.');
    }
    setImages((prev) =>
      prev.map((img) => (img.name === imageName ? { ...img, collection: newCollection } : img))
    );
  }, [email]);

  return { images, loading, error, fetchImages, addImages, deleteImage, renameImage, updateCollection };
}
