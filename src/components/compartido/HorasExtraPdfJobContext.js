import { createContext, useContext } from "react";

export const HorasExtraPdfJobContext = createContext(null);

export function useHorasExtraPdfJob() {
  const context = useContext(HorasExtraPdfJobContext);
  if (!context) {
    throw new Error("useHorasExtraPdfJob must be used within HorasExtraPdfJobProvider");
  }
  return context;
}

