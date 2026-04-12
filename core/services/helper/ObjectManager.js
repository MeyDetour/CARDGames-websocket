export class ObjectManager{
 
    // === LOG DIFF DETAILLE ===
    // Compare l'état du jeu avant et après l'exécution de l'événement
    static getObjectDiff(obj1, obj2, path = "") {
      let changes = [];
      for (const key of Object.keys(obj1)) {
        const fullPath = path ? path + "." + key : key;
        if (!(key in obj2)) {
          changes.push({ type: "deleted", path: fullPath, before: obj1[key], after: undefined });
        } else if (typeof obj1[key] === "object" && obj1[key] !== null && typeof obj2[key] === "object" && obj2[key] !== null) {
          changes = changes.concat(ObjectManager.getObjectDiff(obj1[key], obj2[key], fullPath));
        } else if (obj1[key] !== obj2[key]) {
          changes.push({ type: "modified", path: fullPath, before: obj1[key], after: obj2[key] });
        }
      }
      for (const key of Object.keys(obj2)) {
        const fullPath = path ? path + "." + key : key;
        if (!(key in obj1)) {
          changes.push({ type: "added", path: fullPath, before: undefined, after: obj2[key] });
        }
      }
      return changes;
    }
}