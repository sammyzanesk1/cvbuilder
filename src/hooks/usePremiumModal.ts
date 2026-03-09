import { create } from "zustand";

interface PremiumModalState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

//use zustand global state for subscription modal state..
const usePremiumModal = create<PremiumModalState>((set) => ({
  open: false,
  setOpen: (open: boolean) => set({ open }),
}));

export default usePremiumModal; //.2 properties in the zustand object, the state and its setter function
