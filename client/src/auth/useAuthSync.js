import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authChanged, profileLoaded } from '../store/store';
import { apiJson } from '../api';
import { getAuthClient } from './authClient';

/** Fetch the server's view of the signed-in host (name, library status, features). */
export function useRefreshProfile() {
  const dispatch = useDispatch();
  return useCallback(async () => {
    try {
      dispatch(profileLoaded(await apiJson('/api/me')));
    } catch {
      dispatch(profileLoaded({ libraryStatus: 'unavailable', features: {} }));
    }
  }, [dispatch]);
}

/**
 * Keeps Redux in step with the Firebase session and loads the host profile
 * whenever a different host signs in. Mounted once, in App.
 */
export default function useAuthSync() {
  const dispatch = useDispatch();
  const uid = useSelector((state) => state.user.uid);
  const refreshProfile = useRefreshProfile();

  useEffect(() => getAuthClient().onChange((user) => dispatch(authChanged(user))), [dispatch]);

  useEffect(() => {
    if (uid) refreshProfile();
  }, [uid, refreshProfile]);
}
