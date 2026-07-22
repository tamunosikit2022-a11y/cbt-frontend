/**
 * liveIdeApi.js — thin wrapper around the simulationRoutes backend endpoints
 * for saving/loading a student's Live IDE projects (Python scripts for now;
 * circuit layouts will use the same shape once the Arduino/circuit builder
 * ships in a later phase). All execution stays client-side — this is purely
 * persistence, which is why it's cheap enough for Render's free tier.
 */
import API from "../../../utils/api";

export async function listProjects(kind) {
  const r = await API.get("/simulation/projects", { params: { kind } });
  return r.data || [];
}

export async function loadProject(id) {
  const r = await API.get(`/simulation/projects/${id}`);
  return r.data;
}

export async function saveProject({ id, kind, title, code, board_type }) {
  if (id) {
    // Update existing project
    const r = await API.put(`/simulation/projects/${id}`, { 
      title, 
      code, 
      board_type 
    });
    return r.data;
  }
  // Create new project
  const r = await API.post("/simulation/projects", { 
    kind, 
    title, 
    code, 
    board_type 
  });
  return r.data;
}

export async function deleteProject(id) {
  await API.delete(`/simulation/projects/${id}`);
}
