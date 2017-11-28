class Observable {

  static from(eventName, target) {
    return new Observable(observer => {
      const handler = (event) => { observer.next(event); }
      target.addEventListener(eventName, handler, false);
      return () => target.removeEventListener(eventName, handler);
    });
  }

  static of(...vals) {
    return new Observable(observer => {
      vals.forEach(value = observer.next(value));
      return () => {};
    });
  }

  constructor(subscriber) {
    this.subscriber = subscriber;
  }

  map(projection) {
    const self = this;
    return new Observable(observer => {
      const customObserver = {
        next(data) {
          return observer.next(projection(data));
        }
      }

      self.subscribe(customObserver);
    });
  }

  filter(project) {
    const self = this;
    return new Observable(observer => {
      const customObserver = {
        next(data) {
          if(projection(data)) {
            observer.next(data);
          }
        }
      };

      self.subscribe(customObserver);
    });
  }

  delay(delayTime) {
    const self = this;
    return new Observable(observer => {
      const customObserver = {
        next(data) {
          setTimeout(() => {
            observer.next(data);
          }, delayTime);
        }
      };

      self.subscribe(customObserver);
    });
  }

  takeEvery(num) {
    const self = this;
    const start = 0;
    return new Observable(observer => {
      const customObserver = {
        next(data) {
          if(start !== num) {
            start++;
          } else {
            observer.next(data);
            start = 0;
          }
        }
      };

      self.subscribe(customObserver);
    });
  }

  subscribe(observer) {
    const safeObserver = {};

    if(arguments.length === 1 && typeof observer === "function") {
      safeObserver.next = observer;
    }

    if(typeof observer === "object" && !Array.isArray(observer)) {
      safeObserver = { ...observer }
    }
    
    this.subscriber(safeObserver);
  }

}

export default Observable;
