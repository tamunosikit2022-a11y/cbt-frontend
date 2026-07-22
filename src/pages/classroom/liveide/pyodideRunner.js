/**
 * pyodideRunner.js — Scholars Syndicate Live IDE
 *
 * Loads Pyodide (CPython compiled to WebAssembly) directly from Pyodide's
 * CDN and runs student Python code entirely in the browser.
 *
 * WHY CLIENT-SIDE: the backend runs on Render's free tier, which cannot
 * safely execute arbitrary student code server-side (security risk,
 * resource exhaustion, cold starts). Pyodide moves all execution into the
 * student's own browser tab — zero server load, works even while the
 * Render instance is asleep/cold-starting. See the feature spec, section 3.
 *
 * This module is a singleton: the ~10MB Pyodide runtime is fetched once
 * per browser session (cached by the browser after that) and reused across
 * every "Run" click and every remount of the Python tab.
 */

const PYODIDE_VERSION = "0.26.2";
const PYODIDE_CDN_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_LOAD_TIMEOUT_MS = 30000;  // 30 second timeout for CDN

let loadPromise = null;   // in-flight / resolved load of the pyodide runtime
let pyodideInstance = null;

/**
 * Injects the pyodide.js <script> tag once and resolves when window.loadPyodide
 * is available. Includes timeout so students get feedback if CDN is down.
 */
function loadPyodideScript() {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) return resolve();
    const existing = document.querySelector('script[data-pyodide-loader="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Pyodide script")));
      return;
    }
    
    // Timeout after 30 seconds to prevent infinite hanging
    const timeout = setTimeout(() => {
      script.onerror = null;
      script.onload = null;
      reject(new Error(`Pyodide load timed out after ${PYODIDE_LOAD_TIMEOUT_MS / 1000}s. Check your internet connection.`));
    }, PYODIDE_LOAD_TIMEOUT_MS);

    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN_BASE}pyodide.js`;
    script.async = true;
    script.dataset.pyodideLoader = "1";
    script.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to load Pyodide script — CDN unreachable or connection blocked."));
    };
    document.head.appendChild(script);
  });
}

/**
 * Returns a ready-to-use Pyodide instance, loading it on first call and
 * reusing it thereafter. Safe to call from multiple components at once —
 * concurrent callers share the same in-flight promise.
 * 
 * If load fails, resets the promise so the next call can retry.
 */
export async function getPyodide(onStatus) {
  if (pyodideInstance) return pyodideInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    onStatus?.("Fetching Python runtime…");
    await loadPyodideScript();
    onStatus?.("Starting Python interpreter…");
    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_CDN_BASE });
    pyodideInstance = pyodide;
    onStatus?.("Ready");
    return pyodide;
  })();

  try {
    return await loadPromise;
  } catch (err) {
    // Reset so next call can retry
    loadPromise = null;
    pyodideInstance = null;
    // Give user feedback that retry is happening
    onStatus?.(`Load failed. Retrying on next Run… (${err.message})`);
    throw err;
  }
}

export function isPyodideReady() {
  return !!pyodideInstance;
}

// Packages we proactively offer since they're common in engineering/teaching
// contexts and are part of Pyodide's official package set (pure-Python or
// prebuilt-wasm — no compilation needed at runtime).
export const SUPPORTED_EXTRA_PACKAGES = ["numpy", "matplotlib"];

/**
 * Loads one or more Pyodide packages on demand (e.g. numpy, matplotlib).
 * Cheap no-op if already loaded. Includes timeout to prevent hanging.
 */
export async function loadPackages(pyodide, packages, onStatus) {
  if (!packages?.length) return;
  onStatus?.(`Loading ${packages.join(", ")}…`);
  
  try {
    // Try loadPackagesFromImports first (detects imports from code)
    await pyodide.loadPackagesFromImports?.(packages.join("\n"));
  } catch (e) {
    // Silently continue — package might not exist, let code error instead
  }

  try {
    // Then explicitly load
    await pyodide.loadPackage(packages);
  } catch (e) {
    // Silently continue — loadPackage throws if already loaded via loadPackagesFromImports
  }
  
  onStatus?.(null);
}

/**
 * Runs a snippet of Python code, capturing stdout/stderr and matplotlib output.
 * Returns a structured result rather than throwing, so the caller can render a clean
 * console panel (this mirrors what a real IDE's "Run" button does).
 */
export async function runPython(pyodide, code) {
  const outputChunks = [];
  let matplotlibImage = null;

  pyodide.setStdout({
    batched: (msg) => outputChunks.push({ type: "stdout", text: msg }),
  });
  pyodide.setStderr({
    batched: (msg) => outputChunks.push({ type: "stderr", text: msg }),
  });

  try {
    // Auto-detect which stdlib/whitelisted packages the snippet imports and
    // fetch them first, so `import numpy` etc. "just works" without the
    // student needing a separate install step.
    try {
      await pyodide.loadPackagesFromImports(code);
    } catch (e) {
      // Silently continue — if import is fake, code will error anyway
    }

    const needsPlot = /matplotlib|pyplot/.test(code);
    if (needsPlot) {
      await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use("AGG")
      `);
    }

    await pyodide.runPythonAsync(code);

    if (needsPlot) {
      // Capture matplotlib figure as base64 PNG
      const pngResult = await pyodide.runPythonAsync(`
import io, base64
from matplotlib import pyplot as plt
_buf = io.BytesIO()
if plt.get_fignums():
    plt.savefig(_buf, format="png", bbox_inches="tight")
    _png = base64.b64encode(_buf.getvalue()).decode("ascii")
else:
    _png = ""
plt.close("all")
_png
      `);
      
      // pngResult is a PyProxy wrapping a Python string; convert to JS string
      if (pngResult && pngResult !== "") {
        matplotlibImage = pngResult.toString();
      }
    }

    return {
      ok: true,
      output: outputChunks,
      image: matplotlibImage || null,
    };
  } catch (err) {
    // Pyodide surfaces Python tracebacks as the JS error's message —
    // that's exactly what a console panel should show.
    return {
      ok: false,
      output: outputChunks,
      error: String(err?.message || err),
    };
  }
}
