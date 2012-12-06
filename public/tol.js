(function($, win) {
  // This is a client for the TraderOnline API.  It handles authentication and provides a basic wrapper for jQuery.ajax().
  win.TOL = {
    // The API domain to hit.
    url: 'https://apis.traderonline.com',

    // The version of the API to use.
    version: '1',

    // Storage for the access token.
    accessToken: null,

    // The client credentials for authentication.
    client: {
      id: null,
      secret: null
    },

    // Get an access token using the set credentials.  Credentials may be set globally, or passed in in the options.  Calls the success
    // callback given.  Any jQuery options may be passed in as well.  NOTE: You shouldn't need to call this method directly - if you don't have
    // a valid token, it will be called automatically.
    getAccessToken: function(_opts) {
      var opts = $.extend({}, this, _opts || {});
      var self = this;

      if (!opts.url || !opts.version || !opts.client.id || !opts.client.secret || !opts.success) {
        throw 'Missing required fields for getting an access token.';
      }

      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: opts.url + '/v' + opts.version + '/token',

        data: {
          grant_type: 'client_credentials',
          client_id: opts.client.id,
          client_secret: opts.client.secret,
        },

        success: function(data, status, jqxhr) {
          if (!data.access_token && opts.error) {
            opts.error(jqxhr, status, data);
          }

          self.accessToken = data.access_token;
          opts.success();
        },

        error: opts.error
      });
    },

    // Make a request to the API at the given path.  If the access token is invalid, an attempt will be made to fetch a valid one using the
    // provided credentials.  On success, the given success callback will be called with the Javascript object from the API as the result.  Any
    // jQuery.ajax options may be passed in as well.
    request: function(_opts) {
      var self = this;
      var opts = $.extend({
        dataType: 'json',
        dataFilter: function(data, type) {
          if (data.trim() === '') {
              return null;
          }

          return data;
        }
      }, this, _opts || {});

      if (!opts.url || !opts.version || !opts.path || !opts.success) {
        throw 'Missing required parameters';
      }

      if (opts.type && opts.type != 'GET') {
        if (!opts.contentType) {
          opts.contentType = 'application/json';
        }

        if (opts.contentType === 'application/json' && opts.data && typeof opts.data === 'object') {
          opts.data = JSON.stringify(opts.data);
        }
      }

      opts.url = opts.url + '/v' + opts.version + '/' + opts.path;
      opts.headers = opts.headers || {};

      var error = opts.error;

      opts.error = function(jqxhr, status, err) {
        // The oauth failures we are interested in will be 401 error codes.
        if (jqxhr.status != 401) {
          if (error) {
            error(jqxhr, status, err);
          }

          return false;
        }

        delete opts.error;
        self.getAccessToken($.extend({}, opts, {
          success: function() {
            opts.headers['Authorization'] = 'Bearer ' + self.accessToken;
            $.ajax(opts);
          }
        }));
      };

      if (opts.accessToken) {
        opts.headers['Authorization'] = 'Bearer ' + opts.accessToken;
        $.ajax(opts);
      } else {
        this.getAccessToken($.extend({}, _opts, {
          dataType: 'json',
          success: function() {
            opts.headers['Authorization'] = 'Bearer ' + self.accessToken;
            $.ajax(opts);
          }
        }));
      }
    }
  };
})(jQuery, window);
