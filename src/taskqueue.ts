
import fastq from 'fastq';

export class TaskQueue { 

  #queue: fastq.queueAsPromised<() => Promise<any>>;

  constructor() {
    this.#queue = fastq.promise(task => task(), 1); 
  }
  
  async run<O>(task: () => Promise<O>): Promise<O> {
    return await this.#queue.push(task);
  }
  
}