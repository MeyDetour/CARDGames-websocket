 
import { LoggerClass } from "./logger.js";

export default class FileLogger {
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
          newWidth
        )}`
      );
    }
    lines.push(`${"-".repeat(oldWidth)}-+-${"-".repeat(newWidth)}`);

    return lines.join("\n");
  }

  static logGridOldNew(oldObj, newObj, fileLogger) {
    if (!fileLogger) {
      const msg = "fileLogger is null in logGridOldNew";
      console.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}
      return;
    }
    // FILE
    fileLogger.section("------ GRID DIFF OLD / NEW ----");
    fileLogger.log(this.gridOldNewToText(oldObj, newObj));
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
        pad(vLines[i] ?? "", widths[j])
      );
      lines.push(row.join(" | "));
    }

    return [sep, header, sep, ...lines, sep].join("\n");
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
}
