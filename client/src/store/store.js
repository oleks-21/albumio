import { configureStore, createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    email: '',
    isLoggedIn: false,
  },
  reducers: {
    login: (state, action) => {
      state.email = action.payload;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.email = '';
      state.isLoggedIn = false;
    },
  },
});

export const { login, logout } = userSlice.actions;

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
  },
});

export default store;
