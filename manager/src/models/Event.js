export class Event {
  #eventRawStatus;

  constructor (eventSnapshot) {
    Object.assign(this, eventSnapshot.data())
    this.event_start_datetime = eventSnapshot.get('event_start_datetime')?.toMillis()
    this.event_end_datetime = eventSnapshot.get('event_end_datetime')?.toMillis()
    this.event_deadline_datetime = eventSnapshot.get('event_deadline_datetime')?.toMillis()

    this.#eventRawStatus = eventSnapshot.get('event_status')

  /**
   * event_status を時間によって更新する getter
   *
   * user, manager にも同等のコードが存在するので注意
   * TODO TypeScript にで共通化する
   */
    Object.defineProperty(this, 'event_status', {
      get: () => {
        // event_status が string だった仕様の時もあったので、その対応
        const rawStatus = (typeof this.#eventRawStatus === 'string') ? { value: this.#eventRawStatus } : this.#eventRawStatus
        if (rawStatus.value === 'accepting_order') {
          const now = new Date().getTime()
          if (this.event_end_datetime < now) {
            return { value: 'finished' }
          } else if (this.event_deadline_datetime < now) {
            return { value: 'order_closed' }
          }
        }
        return rawStatus
      },
      set: (value) => {
        this.#eventRawStatus = value
      },
    })
  }

  get url () {
    return `https://${process.env.VUE_APP_EVENT_HOST}/c/${this.community_account}/e/${this.event_id}`
  }
}
