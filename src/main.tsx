
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initGoogleAnalytics, recordTrafficSource } from "./lib/analytics";

// Initialize analytics & capture UTM traffic
initGoogleAnalytics();
recordTrafficSource();

createRoot(document.getElementById("root")!).render(<App />);
  