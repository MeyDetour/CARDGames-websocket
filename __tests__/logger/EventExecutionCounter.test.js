import EventExecutionCounter from '../../core/logger/EventExecutionCounter';
describe('EventExecutionCounter', () => {
  it('should count executions', () => {
    // Ajoutez vos assertions ici
    expect(EventExecutionCounter.count).toBeDefined();
  });
});