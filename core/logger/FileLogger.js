import fs from "fs";
import path from "path";
import { TypeManager } from "../services/helper/TypeManager.js";
const LOG_DIR = "./logs";
export default class FileLogger {
 static create(headerInfo) { 
  
     const filename = `${Math.random()}.log`;
     const filepath = path.join(LOG_DIR+"/other", filename);
 
     // header
     fs.writeFileSync(
       filepath,
       headerInfo.join("\n"),
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
