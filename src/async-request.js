/**
 * Constructs AJAX request
 * @param {Object} options
 * @return {Object} XHR
 *
 **/
class AsyncRequest {
  constructor(options) {
    const { method, url, headers, responseType, rawResponse } = options;
    this.method = method;
    this.url = url;
    this.headers = headers || null;
    this.responseType = responseType;
    this.rawResponse = rawResponse;
    this.progressHandlers = [];
    this.successHandlers = [];
    this.failureHandlers = [];
    this.request = new XMLHttpRequest();
    this.inject = null;
  }


  /**
   * Internal helper method for type checking
   * @param {String} typeName
   * @param {Any} predicate
   *
   **/
  isType(typeName, predicate) {
    if(typeof predicate === typeName) {
      return true;
    } else {
      throw new Error(`Expected type ${typeName}, instead got ${typeof predicate}`);
    }
  }


  /**
   * Injects function in every callback (for instance Redux's dispatch)
   * @param {Function} injector
   *
   **/
  inject(fn) {
    if(isType("function", fn)) {
      this.inject = fn;
    }
  }


  /**
   * Adds callback or callbacks to {handlersName} if type === "function"
   * @param {String} handlersName
   * @param {Array} callbacks
   *
   **/
  
  addToHandlers(handlersName, callbacks) {
    const { isType } = this;
    
    if(callbacks.length === 1) {
      if(isType("function", callbacks[0])) {
        this[handlersName].push(callbacks[0]);
      }
    }

    if(callbacks.length > 1) {
      callbacks.forEach(cb => {
        if(isType("function", cb)) {
          this[handlersName].push(cb);
        }
      });
    }


  }

  /**
   * Adds callback to progress handlers
   * @param {Function} callback
   *
   **/
  progress(callback) {
    this.addToHandlers("progressHandlers", Array.from(arguments));
    return this;
  }


  /**
   * Adds callback to success handlers
   * @param {Function} callback
   *
   **/
  success(callback) {
    this.addToHandlers("successHandlers", Array.from(arguments));
    return this;
  }


  /**
   * Adds callback to failure handlers
   * @param {Function} callback
   *
   **/
  failure(callback) {
    this.addToHandlers("failureHandlers", Array.from(arguments));
    return this;
  }


  /**
   * Sets headers to request object
   **/
  setHeaders() {
    for(let header in headers) {
      this.request.setRequestHeader(header, headers[header]);
    }
    this.setFormHeaders();
  }

  /**
   * Check if is "POST" or "PUT"  method to set application multipart header
   *
   **/
  setFormHeader() {
    if(this.method === "POST" || this.method === "PUT") {
      let contentType = (
        headers["Content-Type"] || "application/x-www-form-urlencoded"
      );
      this.request.setRequestHeader("Content-Type", contentType);
    }
  }


  /**
   * Formats response based on rawResponse and responseType options
   * @param {Event} res
   * @return {Text | JSON | DOM} 
   *
   **/
  formatResponse(res) {
    let resContent = res.target.responseText;

    if(this.rawResponse) {
      return resContent;
    }

    if(this.responseType === "json") {
      return JSON.parse(resContent);
    }


    if(this.responseType === "xml") {
      let parser = new DOMParser();
      return parser.parseFromString(resContent, "text/xml");
    }
  }

  /**
   * Generic function for handler setup
   * @param {String} eventName
   * @param {String} handlersName
   *
   **/
  setEventHandlers(eventName, handlersName) {
    let value;

    return () => {
      if(this[handlersName].length) {
        this.request.addEventListener(eventName, (res) => {
          this[handlersName].forEach(handler => {
            let response = this.formatResponse(res);
            value = handler(value || res, this.inject);
          });
        });
      }
    }
  }


  /**
   * Calls all methods in progressHandlers on progress event
   *
   **/  
  setProgressHandlers() {
    this.setEventHandlers("progress", "progressHandlers")();
  }


  /**
   * Calls all methods in successHandlers on success event
   *
   **/
  setSuccessHandlers() {
    this.setEventHandlers("load", "successHandlers")();
  }


  /**
   * Calls all methods in falureHandlers on error event
   *
   **/
  setFailureHandlers() {
    this.setEventHandlers("error", "failureHandlers")();
  }


  /**
   * Set event listeners for XHR events 
   *
   **/
  setupListeners() {
    this.setProgressHandlers();
    this.setSuccessHandlers();
    this.setFailureHandlers();
  }


  /**
   * Initiates XHR request
   **/
  send() {
    this.setHeaders();
    this.setupListeners();
    this.request.send();
  }

}

/**
 * Demo usage -> 
 *
 **/

/*
const req = new AsyncRequest({
  method: "GET",
  url: "http:someurl.com",
  headers: {

  },
  responseType: "json",
  rawResponse: true,
  sequentially: true
});


req
  .inject(dispatch)
  .progress(fnOne, fnTwo)
  .success(fnThree, fnFour, fnFive)
  .failure(showError);
  .send();
*/

export default AsyncRequest;
