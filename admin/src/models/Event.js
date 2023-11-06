export class Event {
  #eventRawStatus;

  constructor (eventSnapshot) {
    Object.assign(this, eventSnapshot.data())
    this.event_start_datetime = eventSnapshot.get('event_start_datetime')?.toMillis()
    this.event_deadline_datetime = eventSnapshot.get('event_deadline_datetime')?.toMillis()

    this.#eventRawStatus = eventSnapshot.get('event_status')
    Object.defineProperty(this, 'event_status', {
      get: () => {
        const now = new Date().getTime()
        if (this.event_start_datetime < now) {
          return 'finished'
        } else if (this.event_deadline_datetime < now) {
          return 'order_closed'
        } else {
          return this.#eventRawStatus
        }
      },
    })
  }

  get url () {
    return `https://${process.env.VUE_APP_EVENT_HOST}/community/${this.community_account}/events/${this.event_id}`
  }
}
