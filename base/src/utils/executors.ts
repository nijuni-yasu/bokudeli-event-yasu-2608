export class TaskExecutor {
  #currentRunningTasks: (() => Promise<void>)[] = []
  #taskQueue: (() => Promise<void>)[] = []

  constructor(private maxConcurrentTasks: number) {}

  get totalTaskLength() {
    return this.#taskQueue.length + this.#currentRunningTasks.length
  }

  addTask(task: () => Promise<void>) {
    this.#taskQueue.push(task)
    this.#runNextTask()
  }

  #runNextTask() {
    if (this.#currentRunningTasks.length < this.maxConcurrentTasks) {
      const task = this.#taskQueue.shift()
      if (task) {
        this.#currentRunningTasks.push(task)
        task().finally(() => {
          this.#currentRunningTasks = this.#currentRunningTasks.filter((t) => t !== task)
          window.setTimeout(() => this.#runNextTask(), 1000)
        })
      }
    }
  }
}
