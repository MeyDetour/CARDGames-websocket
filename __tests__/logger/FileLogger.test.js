import LoggerClass from '../../core/logger/LoggerClass';
describe('LoggerClass', () => {
  it('should log to file', () => {
    // Ajoutez vos assertions ici
    expect(LoggerClass.gridOldNewToText).toBeDefined();
    expect(LoggerClass.logGridOldNew).toBeDefined();
    expect(LoggerClass.gridKeyValueToText).toBeDefined();
    expect(LoggerClass.logGridFromObject).toBeDefined();
  });
});