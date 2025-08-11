import { configureStore } from "@reduxjs/toolkit"
import { persistStore, persistReducer } from "redux-persist"
import storage from "redux-persist/lib/storage"
import { combineReducers } from "@reduxjs/toolkit"
import walletReducer from "./walletSlice"
import solanaTokenReducer from './solanaTokenSlice'
const persistConfig = {
  key: "crypto-wallet-root",
  storage,
  whitelist: ["wallet","solanaToken"], // Only persist wallet state
}

const rootReducer = combineReducers({
  wallet: walletReducer,
  solanaToken: solanaTokenReducer
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredPaths: ["solanaToken.connection"],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
