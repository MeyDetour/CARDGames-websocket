import fs from "fs";
import path from "path";
import EventExecutionCounter from "./EventExecutionCounter.js"; 
const LOG_DIR = "./logs";

export default class EventFileLogger {
  static create(event, roomId) {
    const order = EventExecutionCounter.next();

    const safeName = event.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    const filename = `${order}-EVENT-${safeName}-id-${event.id}.log`;
    const filepath = path.join(LOG_DIR+"/events", filename);

    // header
    fs.writeFileSync(
      filepath,
      [
        `EVENT EXECUTION`,
        `================`,
        `Room ID     : ${roomId}`,
        `Order       : ${order}`,
        `Event ID    : ${event.id}`,
        `Event Name  : ${event.name}`,
        `Timestamp   : ${new Date().toISOString()}`,
        ``,
      ].join("\n"),
      "utf-8"
    );

    return {
      order,
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
