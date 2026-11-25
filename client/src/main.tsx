import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "@/context/AuthContext";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import { Toaster } from "@/components/base/toast/toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DirectionProvider locale="en-US">
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="bottom-end" />
        </AuthProvider>
      </BrowserRouter>
    </DirectionProvider>
  </StrictMode>
);
