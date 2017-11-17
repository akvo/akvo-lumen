const leafletUtfgrid = (L) => {
  L.ajax = function (url, success, error) {
    // the following is from JavaScript: The Definitive Guide
    // and https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/Using_XMLHttpRequest_in_IE6
    if (window.XMLHttpRequest === undefined) {
      window.XMLHttpRequest = function () {
        /* global ActiveXObject:true */
        try {
          return new ActiveXObject('Microsoft.XMLHTTP');
        } catch (e) {
          throw new Error('XMLHttpRequest is not supported');
        }
      };
    }
    let response,
      request = new XMLHttpRequest();
    request.open('GET', url);
    request.onreadystatechange = function () {
      /* jshint evil: true */
      if (request.readyState === 4) {
        if (request.status === 200) {
          if (window.JSON) {
            response = JSON.parse(request.responseText);
          } else {
            response = eval(`(${request.responseText})`);
          }
          success(response);
        } else if (request.status !== 0 && error !== undefined) {
          error(request.status);
        }
      }
    };
    request.ontimeout = function () { error('timeout'); };
    request.send();
    return request;
  };
  L.UtfGrid = (L.Layer || L.Class).extend({
    includes: L.Evented,
    options: {
      subdomains: 'abc',

      minZoom: 0,
      maxZoom: 18,
      tileSize: 256,

      resolution: 4,

      useJsonP: true,
      pointerCursor: true,

      maxRequests: 4,
      requestTimeout: 60000,
    },

    // The thing the mouse is currently on
    _mouseOn: null,

    initialize(url, options) {
      L.Util.setOptions(this, options);

      // The requests
      this._requests = {};
      this._request_queue = [];
      this._requests_in_process = [];

      this._url = url;
      this._cache = {};

      // Find a unique id in window we can use for our callbacks
      // Required for jsonP
      let i = 0;
      while (window[`lu${i}`]) {
        i++;
      }
      this._windowKey = `lu${i}`;
      window[this._windowKey] = {};

      const subdomains = this.options.subdomains;
      if (typeof this.options.subdomains === 'string') {
        this.options.subdomains = subdomains.split('');
      }
    },

    onAdd(map) {
      this._map = map;
      this._container = this._map._container;

      this._update();

      const zoom = Math.round(this._map.getZoom());

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
        return;
      }

      map.on('click', this._click, this);
      map.on('mousemove', this._move, this);
      map.on('moveend', this._update, this);
    },

    onRemove() {
      const map = this._map;
      map.off('click', this._click, this);
      map.off('mousemove', this._move, this);
      map.off('moveend', this._update, this);
      if (this.options.pointerCursor) {
        this._container.style.cursor = '';
      }
    },

    setUrl(url, noRedraw) {
      this._url = url;

      if (!noRedraw) {
        this.redraw();
      }

      return this;
    },

    redraw() {
      // Clear cache to force all tiles to reload
      this._request_queue = [];
      for (const req_key in this._requests) {
        if (this._requests.hasOwnProperty(req_key)) {
          this._abort_request(req_key);
        }
      }
      this._cache = {};
      this._update();
    },

    _click(e) {
      this.fire('click', this._objectForEvent(e));
    },
    _move(e) {
      const on = this._objectForEvent(e);

      if (on.data !== this._mouseOn) {
        if (this._mouseOn) {
          this.fire('mouseout', { latlng: e.latlng, data: this._mouseOn });
          if (this.options.pointerCursor) {
            this._container.style.cursor = '';
          }
        }
        if (on.data) {
          this.fire('mouseover', on);
          if (this.options.pointerCursor) {
            this._container.style.cursor = 'pointer';
          }
        }

        this._mouseOn = on.data;
      } else if (on.data) {
        this.fire('mousemove', on);
      }
    },

    _objectForEvent(e) {
      let map = this._map,
        point = map.project(e.latlng),
        tileSize = this.options.tileSize,
        resolution = this.options.resolution,
        x = Math.floor(point.x / tileSize),
        y = Math.floor(point.y / tileSize),
        gridX = Math.floor((point.x - (x * tileSize)) / resolution),
        gridY = Math.floor((point.y - (y * tileSize)) / resolution),
        max = map.options.crs.scale(map.getZoom()) / tileSize;

      x = (x + max) % max;
      y = (y + max) % max;

      const data = this._cache[`${map.getZoom()}_${x}_${y}`];
      let result = null;
      if (data && data.grid) {
        let idx = this._utfDecode(data.grid[gridY].charCodeAt(gridX)),
          key = data.keys[idx];

        if (data.data.hasOwnProperty(key)) {
          result = data.data[key];
        }
      }

      return L.extend({ latlng: e.latlng, data: result }, e);
    },

    // Load up all required json grid files
    // TODO: Load from center etc
    _update() {
      let bounds = this._map.getPixelBounds(),
        zoom = Math.round(this._map.getZoom()),
        tileSize = this.options.tileSize;

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
        return;
      }

      let nwTilePoint = new L.Point(
          Math.floor(bounds.min.x / tileSize),
          Math.floor(bounds.min.y / tileSize)),
        seTilePoint = new L.Point(
          Math.floor(bounds.max.x / tileSize),
          Math.floor(bounds.max.y / tileSize)),
        max = this._map.options.crs.scale(zoom) / tileSize;

      // Load all required ones
      const visible_tiles = [];
      for (let x = nwTilePoint.x; x <= seTilePoint.x; x++) {
        for (let y = nwTilePoint.y; y <= seTilePoint.y; y++) {
          let xw = (x + max) % max,
            yw = (y + max) % max;
          const key = `${zoom}_${xw}_${yw}`;
          visible_tiles.push(key);

          if (!this._cache.hasOwnProperty(key)) {
            this._cache[key] = null;

            if (this.options.useJsonP) {
              this._loadTileP(zoom, xw, yw);
            } else {
              this._loadTile(zoom, xw, yw);
            }
          }
        }
      }
      // If we still have requests for tiles that have now gone out of sight, attempt to abort them.
      for (const req_key in this._requests) {
        if (visible_tiles.indexOf(req_key) < 0) {
          this._abort_request(req_key);
        }
      }
    },

    _loadTileP(zoom, x, y) {
      let head = document.getElementsByTagName('head')[0],
        key = `${zoom}_${x}_${y}`,
        functionName = `lu_${key}`,
        wk = this._windowKey,
        self = this;

      const url = L.Util.template(this._url, L.Util.extend({
        s: L.TileLayer.prototype._getSubdomain.call(this, { x, y }),
        z: zoom,
        x,
        y,
        cb: `${wk}.${functionName}`,
      }, this.options));

      const script = document.createElement('script');
      script.setAttribute('type', 'text/javascript');
      script.setAttribute('src', url);

      window[wk][functionName] = function (data) {
        self._cache[key] = data;
        delete window[wk][functionName];
        if (script.parentElement === head) {
          head.removeChild(script);
        }
        self._finish_request(key);
      };

      this._queue_request(key, url, () => {
        head.appendChild(script);
        return {
          abort() {
            head.removeChild(script);
          },
        };
      });
    },

    _loadTile(zoom, x, y) {
      const url = L.Util.template(this._url, L.Util.extend({
        s: L.TileLayer.prototype._getSubdomain.call(this, { x, y }),
        z: zoom,
        x,
        y,
      }, this.options));

      const key = `${zoom}_${x}_${y}`;
      this._queue_request(key, url, this._ajaxRequestFactory(key, url));
    },

    _ajaxRequestFactory(key, url) {
      const successCallback = this._successCallbackFactory(key);
      const errorCallback = this._errorCallbackFactory(url);
      return function () {
        const request = L.ajax(url, successCallback, errorCallback);
        request.timeout = this.options.requestTimeout;
        return request;
      }.bind(this);
    },

    _successCallbackFactory(key) {
      return function (data) {
        this._cache[key] = data;
        this._finish_request(key);
      }.bind(this);
    },

    _errorCallbackFactory(tileurl) {
      return function (statuscode) {
        this.fire('tileerror', {
          url: tileurl,
          code: statuscode,
        });
      }.bind(this);
    },

    _queue_request(key, url, callback) {
      this._requests[key] = {
        callback,
        timeout: null,
        handler: null,
        url,
      };
      this._request_queue.push(key);
      this._process_queued_requests();
    },

    _finish_request(key) {
      // Remove from requests in process
      let pos = this._requests_in_process.indexOf(key);
      if (pos >= 0) {
        this._requests_in_process.splice(pos, 1);
      }
      // Remove from request queue
      pos = this._request_queue.indexOf(key);
      if (pos >= 0) {
        this._request_queue.splice(pos, 1);
      }
      // Remove the request entry
      if (this._requests[key]) {
        if (this._requests[key].timeout) {
          window.clearTimeout(this._requests[key].timeout);
        }
        delete this._requests[key];
      }
      // Recurse
      this._process_queued_requests();
      // Fire 'load' event if all tiles have been loaded
      if (this._requests_in_process.length === 0) {
        this.fire('load');
      }
    },

    _abort_request(key) {
      // Abort the request if possible
      if (this._requests[key] && this._requests[key].handler) {
        if (typeof this._requests[key].handler.abort === 'function') {
          this._requests[key].handler.abort();
        }
      }
      // Ensure we don't keep a false copy of the data in the cache
      if (this._cache[key] === null) {
        delete this._cache[key];
      }
      // And remove the request
      this._finish_request(key);
    },

    _process_queued_requests() {
      while (this._request_queue.length > 0 && (this.options.maxRequests === 0 ||
             this._requests_in_process.length < this.options.maxRequests)) {
        this._process_request(this._request_queue.pop());
      }
    },

    _process_request(key) {
      this._requests_in_process.push(key);
      // The callback might call _finish_request, so don't assume _requests[key] still exists.
      const handler = this._requests[key].callback();
      if (this._requests[key]) {
        this._requests[key].handler = handler;
        if (handler.timeout === undefined) {
          const timeoutCallback = this._timeoutCallbackFactory(key);
          this._requests[key].timeout = window.setTimeout(timeoutCallback, this.options.requestTimeout);
        }
      }
    },

    _timeoutCallbackFactory(key) {
      const tileurl = this._requests[key].url;
      return function () {
        this.fire('tileerror', { url: tileurl, code: 'timeout' });
        this._abort_request(key);
      }.bind(this);
    },

    _utfDecode(c) {
      if (c >= 93) {
        c--;
      }
      if (c >= 35) {
        c--;
      }
      return c - 32;
    },
  });

  L.utfGrid = function (url, options) {
    return new L.UtfGrid(url, options);
  };

  return L;
};

export default leafletUtfgrid;
