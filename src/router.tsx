import { createBrowserRouter, Navigate } from "react-router";
import { AppShell } from "@/components/shell/AppShell";
import { Level0Page } from "@/routes/Level0Page";
import { Level1Page } from "@/routes/Level1Page";
import { Level1ProcessPage } from "@/routes/Level1ProcessPage";
import { Level2Page } from "@/routes/Level2Page";
import { Level2ProcedurePage } from "@/routes/Level2ProcedurePage";

/** Routes — PRD 7.1. Query parameters carry panel, highlight and origin state. */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/level-0" replace /> },
      { path: "level-0", element: <Level0Page /> },
      { path: "level-1", element: <Level1Page /> },
      { path: "level-1/:processId", element: <Level1ProcessPage /> },
      { path: "level-2", element: <Level2Page /> },
      { path: "level-2/:procedureId", element: <Level2ProcedurePage /> },
      { path: "*", element: <Navigate to="/level-0" replace /> },
    ],
  },
]);
