'use strict';

import moment from 'moment';
import buisiness from 'moment-business';
import notifier from './WebhookNotifier';
import TodayStateBuilder from './TodayStateBuilder';

class SleepingObserver {
  constructor(store) {
    this.store = store;
    this.today = TodayStateBuilder.create();
    this.timer = null;
  }

  _proc() {
    const m = moment();

    if (this.today.created_at.date !== m.date) {
      this.today = TodayStateBuilder.create();
    }

    if (!buisiness.isWeekDay(m)) {
      return; // holiday
    }

    if (!this.store.getValue()) {
      return; // out of bed
    }

    [this.today.pm, this.today.am].some(obj => {
      if (obj.alreadyNotified) {
        return true; // already notified
      }

      if (m.isBetween(obj.deadline, obj.deadline.clone().add(15, 'minutes'))) {
        notifier.send(obj.alreadyNotified);
        obj.isNotified = true;
        return true;
      }

      return false; // continue
    });
  }

  start() {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      this._proc();
    }, 5000);
  }

  stop() {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }
}

export default SleepingObserver;
