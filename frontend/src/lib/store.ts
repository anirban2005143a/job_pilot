import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "./types";

const userSlice = createSlice({
  name: "user",
  initialState: { data: null as User | null },
  reducers: {
    setUser: (state, action: PayloadAction<User>) => { state.data = action.payload; },
    clearUser: (state) => { state.data = null; },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export const store = configureStore({ reducer: { user: userSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;
