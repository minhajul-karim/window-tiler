import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Claude from "./Claude.tsx";

createRoot(document.getElementById("root")!).render(<Claude />);
