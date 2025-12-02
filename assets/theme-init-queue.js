/**
 * Theme Initialization Queue System
 * Manages script dependencies and ensures proper execution order
 * Prevents "$ is not defined" and "library is not defined" errors
 */

(function(window) {
  'use strict';

  // Create the initialization queue
  window.ThemeInitQueue = window.ThemeInitQueue || {
    _queue: [],
    _initialized: false,
    _processing: false,
    _jQueryReady: false,
    _cartJSReady: false,
    _aosReady: false,

    /**
     * Add a function to the initialization queue
     * @param {Function} callback - Function to execute
     * @param {Object} options - Configuration options
     */
    add: function(callback, options) {
      options = options || {};

      var queueItem = {
        callback: callback,
        requires: options.requires || [], // ['jquery', 'cartjs', 'aos']
        priority: options.priority || 10, // Lower number = higher priority
        name: options.name || 'anonymous'
      };

      this._queue.push(queueItem);

      // Try to process immediately if dependencies are met
      this._process();
    },

    /**
     * Mark a library as ready
     * @param {String} library - Library name ('jquery', 'cartjs', 'aos', etc.)
     */
    markReady: function(library) {
      library = library.toLowerCase();

      switch(library) {
        case 'jquery':
          this._jQueryReady = true;
          break;
        case 'cartjs':
          this._cartJSReady = true;
          break;
        case 'aos':
          this._aosReady = true;
          break;
      }

      // Process queue when a new library becomes available
      this._process();
    },

    /**
     * Check if dependencies are met
     * @param {Array} requires - Array of required libraries
     */
    _dependenciesMet: function(requires) {
      if (!requires || requires.length === 0) {
        return true;
      }

      for (var i = 0; i < requires.length; i++) {
        var dep = requires[i].toLowerCase();

        switch(dep) {
          case 'jquery':
            if (!this._jQueryReady || typeof window.jQuery === 'undefined') {
              return false;
            }
            break;
          case 'cartjs':
            if (!this._cartJSReady || typeof window.CartJS === 'undefined') {
              return false;
            }
            break;
          case 'aos':
            if (!this._aosReady || typeof window.AOS === 'undefined') {
              return false;
            }
            break;
        }
      }

      return true;
    },

    /**
     * Process the queue and execute ready functions
     */
    _process: function() {
      if (this._queue.length === 0) {
        return;
      }

      // Prevent recursive processing
      if (this._processing) {
        return;
      }

      this._processing = true;

      // Sort by priority
      this._queue.sort(function(a, b) {
        return a.priority - b.priority;
      });

      // Process items whose dependencies are met
      var remaining = [];

      for (var i = 0; i < this._queue.length; i++) {
        var item = this._queue[i];

        if (this._dependenciesMet(item.requires)) {
          try {
            item.callback();
          } catch (e) {
            console.error('ThemeInitQueue: Error executing ' + item.name, e);
          }
        } else {
          remaining.push(item);
        }
      }

      this._queue = remaining;
      this._processing = false;

      // If new items were added during processing, process them
      if (this._queue.length > 0 && remaining.length < this._queue.length) {
        var self = this;
        setTimeout(function() {
          self._process();
        }, 0);
      }
    },

    /**
     * Execute when DOM is ready
     * @param {Function} callback - Function to execute
     */
    domReady: function(callback) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
      } else {
        callback();
      }
    },

    /**
     * Execute when window is loaded
     * @param {Function} callback - Function to execute
     */
    windowLoad: function(callback) {
      if (document.readyState === 'complete') {
        callback();
      } else {
        window.addEventListener('load', callback);
      }
    }
  };

  // Auto-detect jQuery when it loads
  var checkJQuery = function() {
    if (typeof window.jQuery !== 'undefined') {
      window.ThemeInitQueue.markReady('jquery');
      return true;
    }
    return false;
  };

  // Check immediately
  if (!checkJQuery()) {
    // Poll for jQuery (in case it's loaded via defer)
    var jQueryInterval = setInterval(function() {
      if (checkJQuery()) {
        clearInterval(jQueryInterval);
      }
    }, 50);

    // Stop polling after 10 seconds
    setTimeout(function() {
      clearInterval(jQueryInterval);
    }, 10000);
  }

})(window);
