import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize EmailJS with the public key
(window as any).emailjs?.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "ZDDzSAEactyGo0Xs5");

createRoot(document.getElementById("root")!).render(<App />);
