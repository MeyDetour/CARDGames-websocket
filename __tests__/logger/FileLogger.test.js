import FileLogger from '../../core/logger/FileLogger';
describe('FileLogger', () => {
  it('should log to file', () => {
    // Ajoutez vos assertions ici
    expect(FileLogger.gridOldNewToText).toBeDefined();
    expect(FileLogger.logGridOldNew).toBeDefined();
    expect(FileLogger.gridKeyValueToText).toBeDefined();
    expect(FileLogger.logGridFromObject).toBeDefined();
  });
});