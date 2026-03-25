// logger.mjs
import CG from "console-grid";

export const Logger = (namespace = "", { level = "debug" } = {}) => {
  const ns = namespace ? `[${namespace}]` : "";

  const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };
  const threshold = LEVELS[level] ?? LEVELS.debug;

  // Détection environnement
  const isBrowser =
    typeof window !== "undefined" && typeof window.document !== "undefined";
  const isNode =
    !isBrowser &&
    typeof process !== "undefined" &&
    !!process.versions &&
    !!process.versions.node;

  // ANSI codes pour Node/terminals
  const ANSI = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
  };

  const CSS = {
    debug: "color:cyan",
    info: "color:green",
    warn: "color:orange",
    error: "color:red",
    fatal: "color:purple;font-weight:bold",
  };

  const now = () => new Date().toISOString();

  function formatText(level, msg) {
    const time = now();
    const body = typeof msg === "string" ? msg : JSON.stringify(msg);
    return `${level.toUpperCase()} ${ns} ${body}`;
  }

  function sendToConsole(level, msg) {
    if (LEVELS[level] < threshold) return;

    // si c'est un objet non-JSONable proprement, on laisse console gérer l'objet.
    if (typeof msg !== "string") {
      if (isBrowser) {
        console.log(`%c${now()} ${level.toUpperCase()} ${ns}`, CSS[level], msg);
        return;
      } else {
        // Node: print formatted prefix then object
        console.log(
          `${
            ANSI[
              level === "debug"
                ? "cyan"
                : level === "info"
                  ? "green"
                  : level === "warn"
                    ? "yellow"
                    : level === "error"
                      ? "red"
                      : "magenta"
            ]
          }${formatText(level, "")}${ANSI.reset}`,
        );
        console.dir(msg, { depth: null, colors: true });
        return;
      }
    }

    // message string
    if (isBrowser) {
      console.log(`%c${formatText(level, msg)}`, CSS[level]);
    } else if (isNode) {
      const colorCode =
        level === "debug"
          ? ANSI.cyan
          : level === "info"
            ? ANSI.green
            : level === "warn"
              ? ANSI.yellow
              : level === "error"
                ? ANSI.red
                : ANSI.magenta;
      console.log(`${colorCode}${formatText(level, msg)}${ANSI.reset}`);
    } else {
      // fallback
      console.log(formatText(level, msg));
    }
  }

  return {
    debug: (m) => sendToConsole("debug", m),
    info: (m) => sendToConsole("info", m),
    warn: (m) => sendToConsole("warn", m),
    error: (m) => sendToConsole("error", m),
    fatal: (m) => sendToConsole("fatal", m),
    child: (childNs) =>
      Logger(namespace ? `${namespace}:${childNs}` : childNs, { level }),
    setLevel: (lvl) => {
      if (LEVELS[lvl]) {
        /* closure tweak not exposed here; recreate logger to change threshold */
      }
    },
  };
};

export class LoggerClass {
  /*
    * Pretty print an object with indentation and newlines for better readability.
    @params obj: The object to pretty print.
    @params indent: The current indentation level (used for recursive calls).
  */
  static pretty(obj, indent = 0) {
    const pad = " ".repeat(indent);
    if (Array.isArray(obj)) {
      return (
        "[\n" +
        obj.map((v) => pad + "  " + this.pretty(v, indent + 2)).join(",\n") +
        "\n" +
        pad +
        "]"
      );
    }

    if (typeof obj === "object" && obj !== null) {
      return (
        "{\n" +
        Object.entries(obj)
          .map(([k, v]) => pad + "  " + k + ": " + this.pretty(v, indent + 2))
          .join(",\n") +
        "\n" +
        pad +
        "}"
      );
    }

    return JSON.stringify(obj);
  }

  static objectToString(player) {
    //   const caller = new Error().stack.split("\n")[2].trim(); console.log(`[${caller}]`);

    console.log(this.pretty(player));
  }
  static logFileLocalisation() {
    const caller = new Error().stack.split("\n")[2].trim();
    console.log(`[${caller}]`);
  }

  static getCallerLocation() {
    const caller = new Error().stack.split("\n");
    caller.splice(0, 1);
    caller.splice(0, 1);
    return caller;
  }

  static getKeyOfObject(object, name = "") {
    let keys = Object.keys(object);
    return `Keys of object ${name ? "for " + name : ""}  :>> ` + keys;
  }

  static logGridOldNew(oldObj, newObj, fileLogger) {
    if (!fileLogger) {
      const msg = "fileLogger is null in logGridOldNew";
      console.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg,    LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()));
      } catch (e) {}
      return;
    }
    // FILE
    fileLogger.section("------ GRID DIFF OLD / NEW ----");
    fileLogger.log(this.gridOldNewToText(oldObj, newObj));
  }

  static gridOldNewToText(obj1, obj2) {
    const oldLines = LoggerClass.pretty(obj1).split("\n");
    const newLines = LoggerClass.pretty(obj2).split("\n");
    const max = Math.max(oldLines.length, newLines.length);

    const oldWidth = Math.max(...oldLines.map((l) => l.length), 3);
    const newWidth = Math.max(...newLines.map((l) => l.length), 3);

    const pad = (str, len) => str.padEnd(len, " ");

    const lines = [];

    lines.push(`${pad("OLD", oldWidth)} | ${pad("NEW", newWidth)}`);
    lines.push(`${"-".repeat(oldWidth)}-+-${"-".repeat(newWidth)}`);

    for (let i = 0; i < max; i++) {
      lines.push(
        `${pad(oldLines[i] ?? "", oldWidth)} | ${pad(
          newLines[i] ?? "",
          newWidth,
        )}`,
      );
    }
    lines.push(`${"-".repeat(oldWidth)}-+-${"-".repeat(newWidth)}`);

    return lines.join("\n");
  }
  static logConsoleGridOldNew(obj1, ob2) {
    //    const caller = new Error().stack.split("\n")[2].trim(); console.log(`[${caller}]`);

    const oldLines = LoggerClass.pretty(obj1).split("\n");
    const newLines = LoggerClass.pretty(ob2).split("\n");
    const max = Math.max(oldLines.length, newLines.length);

    const rows = [];

    for (let i = 0; i < max; i++) {
      rows.push([
        i === 0 ? 1 : "", // 1 seulement sur la première ligne
        oldLines[i] ?? "",
        newLines[i] ?? "",
      ]);
    }

    CG({
      columns: ["", "old", "new"],
      rows,
    });
  }

  //  --- ------ 🔄 GIVEELEMENTTO PARAMS ---- ---
  //-------+--------------------+--------------+--------------------------+---------------+--------+-----------+--------+--------+-------
  //Sender | Sender List Object | Destinataire | Destinataire List Object | Give Elements | Socket | Game Data | Params | Logs   | Index
  //-------+--------------------+--------------+--------------------------+---------------+--------+-----------+--------+--------+-------
  //object | object             | object       | object                   | object        | object | object    | object | object | object
  //-------+--------------------+--------------+--------------------------+---------------+--------+-----------+--------+--------+-------

  static logGridFromObject(data, title, fileLogger) {
    if (!fileLogger) return;

    if (title) fileLogger.section(`------ ${title} ----`);
    fileLogger.log(this.gridKeyValueToText(data));
  }

  //-------+--------------------+--------------+--------------------------+---------------+--------+-----------+--------+--------+-------
  //Sender | Sender List Object | Destinataire | Destinataire List Object | Give Elements | Socket | Game Data | Params | Logs   | Index
  //-------+--------------------+--------------+--------------------------+---------------+--------+-----------+--------+--------+-------
  //object | object             | object       | object                   | object        | object | object    | object | object | object
  //-------+--------------------+--------------+--------------------------+---------------+--------+-----------+--------+--------+-------

  static gridKeyValueToText(obj) {
    const keys = Object.keys(obj);

    // transformer chaque valeur en tableau de lignes
    const valuesLines = keys.map((k) => {
      const v = obj[k];
      if (v === null || v === undefined) return [""]; // cellule vide
      if (typeof v === "object") return LoggerClass.pretty(v).split("\n");
      return [String(v)];
    });

    // largeur max de chaque colonne (header + toutes les lignes)
    const widths = keys.map((k, i) => {
      const maxValueWidth = Math.max(...valuesLines[i].map((l) => l.length));
      return Math.max(k.length, maxValueWidth, 3);
    });

    const pad = (s, w) => s.padEnd(w, " ");

    // header
    const header = keys.map((k, i) => pad(k, widths[i])).join(" | ");
    const sep = widths.map((w) => "-".repeat(w)).join("-+-");

    // nombre de lignes max
    const maxLines = Math.max(...valuesLines.map((v) => v.length));

    const lines = [];
    for (let i = 0; i < maxLines; i++) {
      const row = valuesLines.map((vLines, j) =>
        pad(vLines[i] ?? "", widths[j]),
      );
      lines.push(row.join(" | "));
    }

    return [sep, header, sep, ...lines, sep].join("\n");
  }
}
