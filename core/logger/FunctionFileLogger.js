import fs from "fs";
import path from "path";
import { Logger, LoggerClass } from "./logger.js";
import Identificator from "../services/helper/Identificator.js";
import { TypeManager } from "../services/helper/TypeManager.js";

const LOG_DIR = "./logs";
const functionFileLoggerLogger = Logger("FunctionFileLogger");

export default class FunctionFileLogger {
  static create(condition) {
    if (!TypeManager.isDefined(condition)) {
      functionFileLoggerLogger.error(
        "ActionFileLogger.create called with undefined condition"
      );
      return null;
    }
    const id = Identificator.generateId();

    const safeName = condition
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    const filename = `${id}-CONDITION-${safeName}.log`;
    const filepath = path.join(LOG_DIR + "/functions", filename);

    // header
    fs.writeFileSync(
      filepath,
      [
        `CONDITION EXECUTION`,
        `================`,
        `id : ${id}`,
        `Condition  : ${condition}`,
        `Timestamp   : ${new Date().toISOString()}`,
        ``,
      ].join("\n"),
      "utf-8"
    );

    return {
      filepath,
      log: (msg = "") => {
        fs.appendFileSync(filepath, msg + "\n");
      },
      section: (title) => {
        fs.appendFileSync(filepath, `\n--- ${title.toUpperCase()} ---\n`);
      },

      error: (err, context = "") => {
        const time = new Date().toISOString();

        let location = "unknown location";
        let stack = "";

        if (err instanceof Error) {
          stack = err.stack ?? "";

          // on extrait la première vraie ligne de stack
          const lines = stack.split("\n");
          if (lines[1]) {
            location = lines[1].trim();
          }
        }

        fs.appendFileSync(
          filepath,
          [
            "",
            "!!! ERROR !!!",
            `Time      : ${time}`,
            `Message   : ${err?.message ?? err}`,
            `Type      : ${err?.name ?? typeof err}`,
            context ? `Context   : ${context}` : "",
            `Location  : ${location}`,
            "",
            "Stack:",
            stack,
            "===============================",
            "",
          ]
            .filter(Boolean)
            .join("\n")
        );
      },
    };
  }
}
