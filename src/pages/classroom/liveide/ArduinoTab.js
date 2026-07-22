import ElectronicsLab from "./ElectronicsLab";

/**
 * ArduinoTab — the "Arduino/Circuits" section of Live IDE.
 * Used to split into two separate sub-tabs (a code-only editor and a
 * separate circuit canvas). That's replaced by ElectronicsLab, a single
 * unified breadboard + code + serial monitor view — closer to how a real
 * simulator (and the actual physical workflow) works: you don't build a
 * circuit and write its code in two disconnected screens.
 *
 * `project` can be either an "arduino" (old plain-sketch) or "circuit"
 * project — ElectronicsLab's loader handles both (see loadInitialState in
 * that file), so no filtering is needed here.
 */
export default function ArduinoTab({ project, onProjectSaved }) {
  return <ElectronicsLab project={project} onProjectSaved={onProjectSaved} />;
}
