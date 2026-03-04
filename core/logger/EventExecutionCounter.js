export default class EventExecutionCounter {
  static count = 0;

  static next() {
    this.count++;
    return String(this.count).padStart(2, "0");
  }
}
