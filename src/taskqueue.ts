
import fastq from 'fastq';

/**
 * A queue that takes in and runs asynchronous functions (tasks) in series.
 */
export class TaskQueue { 

  #queue: fastq.queueAsPromised<() => Promise<any>>;

  constructor() {
    this.#queue = fastq.promise(task => task(), 1); 
  }
  
  /**
   * Runs a task function in the queue.
   * 
   * @returns a promise that resolves to the same value as that which is
   *          returned by the task function.
   */
  async run<O>(task: () => Promise<O>): Promise<O> {
    return this.#queue.push(task);
  }
  
}