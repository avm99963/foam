/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var OAuthXhr = {
  create: function(xhr, responsetype, agent) {
    xhr.responseType = responsetype;
    return {
      __proto__: this,
      xhr: xhr,
      agent: agent
    };
  },

  set responseType(type) {
    this.xhr.responseType = type;
  },
  get responseType() {
    return this.xhr.responseType;
  },

  asend: function(ret, method, url, payload) {
    var self = this;
    var finished = false;
    var attempts = 0;
    awhile(
      function() { return !finished; },
      aseq(
        function(ret) {
          self.xhr.open(method, url);
          self.xhr.setRequestHeader('Authorization', 'Bearer ' + self.agent.accessToken);
          // TODO: This should be added by a decorator, or via a parameter.
          self.xhr.setRequestHeader("Content-Type", "application/json");
          self.xhr.asend(ret, payload);
        },
        function(ret) {
          if (self.xhr.status == 401 || self.xhr.status == 403) {
            if (attempts >= 2) {
              finished = true;
              ret();
              return;
            }
            attempts++;
            self.agent.refresh(ret);
            return;
          }
          finished = true;
          ret(self.xhr.response, self.xhr.status);
        }))(ret);
  }
};

FOAModel({
  name: 'OAuthXhrFactory',
  label: 'OAuthXhrFactory',

  properties: [
    {
      name: 'authAgent',
      type: 'AuthAgent',
      required: true
    },
    {
      model_: 'StringProperty',
      name: 'responseType'
    }
  ],

  methods: {
    make: function() {
      return OAuthXhr.create(new XMLHttpRequest(), this.responseType, this.authAgent);
    }
  }
});

FOAModel({
  name: 'OAuth2',
  label: 'OAuth 2.0',

  properties: [
    {
      name: 'accessToken',
      help: 'Token used to authenticate requests.'
    },
    {
      name: 'clientId',
      required: true
    },
    {
      name: 'clientSecret',
      required: true
    },
    {
      model_: 'StringArrayProperty',
      name: 'scopes',
      required: true
    },
    {
      model_: 'URLProperty',
      name: 'endpoint',
      defaultValue: "https://accounts.google.com/o/oauth2/"
    }
  ],

  methods: {
    init: function() {
      this.SUPER();
      this.refresh_ = amerged(this.refreshNow_.bind(this));
    },

    refreshNow_: function(){},

    refresh: function(ret, opt_forceInteractive) {
      return this.refresh_(ret, opt_forceInteractive);
    }
  }
});

FOAModel({
  name: 'OAuth2WebClient',
  help: 'Strategy for OAuth2 when running as a web page.',

  extendsModel: 'OAuth2',

  methods: {
    refreshNow_: function(ret, opt_forceInteractive) {
      var self = this;
      var w;
      var cb = wrapJsonpCallback(function(code) {
        self.accessToken = code;
        try {
          ret(code);
        } finally {
          w && w.close();
        }
      }, true /* nonce */);

      var path = location.pathname;
      var returnPath = location.origin +
        location.pathname.substring(0, location.pathname.lastIndexOf('/')) + '/oauth.html';

      var queryparams = [
        '?response_type=token',
        'client_id=' + encodeURIComponent(this.clientId),
        'redirect_uri=' + encodeURIComponent(returnPath),
        'scope=' + encodeURIComponent(this.scopes.join(' ')),
        'state=' + cb.id,
        'approval_prompt=' + (opt_forceInteractive ? 'force' : 'auto')
      ];

      w = window.open(this.endpoint + "auth" + queryparams.join('&'));
    }
  }
});

FOAModel({
  name: 'OAuth2ChromeApp',
  help: 'Strategy for OAuth2 when running as a Chrome App',

  extendsModel: 'OAuth2',

  properties: [
    {
      name: 'refreshToken',
      help: 'Token used to generate new access tokens.'
    },
    {
      name: 'authCode',
      help: 'Authorization code used to generate a new refresh token.'
    }
  ],

  methods: {
    auth: function(ret) {
      var queryparams = [
        '?response_type=code',
        'client_id=' + encodeURIComponent(this.clientId),
        'redirect_uri=urn:ietf:wg:oauth:2.0:oob',
        'scope=' + encodeURIComponent(this.scopes.join(' '))
      ];

      var self = this;
      chrome.app.window.create(
        'empty.html', { width: 800, height: 600 },
        function(w) {
          var success = false;

          w.onClosed.addListener(function() {
            if ( ! success ) ret(false);
          });

          var window = w.contentWindow;
          var document = w.contentWindow.document;

          window.addEventListener('load', function() {
            var webview = document.createElement('webview');
            webview.style.width = '100%';
            webview.style.height = '100%';
            document.body.appendChild(webview);

            webview.addEventListener('contentload', function() {
              webview.executeScript({ code: 'window.document.title;' }, function(title) {
                if ( title[0] && title[0].startsWith('Success code=') ) {
                  self.authCode = title[0].substring(title[0].indexOf('=') + 1);
                  success = true;
                  w.close();
                  self.updateRefreshToken(ret);
                }
              });
            });

            webview.src = self.endpoint + "auth" + queryparams.join('&');
          });
        });
    },
    updateRefreshToken: function(ret) {
      var postdata = [
        'code=' + encodeURIComponent(this.authCode),
        'client_id=' + encodeURIComponent(this.clientId),
        'client_secret=' + encodeURIComponent(this.clientSecret),
        'grant_type=authorization_code',
        'redirect_uri=urn:ietf:wg:oauth:2.0:oob'
      ];

      var xhr = new XMLHttpRequest();
      xhr.open("POST", this.endpoint + "token");
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.responseType = "json";
      var self = this;
      aseq(
        function(ret) {
          xhr.asend(ret, postdata.join('&'));
        },
        function(ret) {
          if ( xhr.status === 200 ) {
            self.accessToken = xhr.response.access_token;
            self.refreshToken = xhr.response.refresh_token;
          }

          ret && ret(xhr.status === 200 && self.accessToken);
        })(ret);
    },

    updateAccessToken: function(ret) {
      var postdata = [
        'refresh_token=' + encodeURIComponent(this.refreshToken),
        'client_id=' + encodeURIComponent(this.clientId),
        'client_secret=' + encodeURIComponent(this.clientSecret),
        'grant_type=refresh_token'
      ];

      var xhr = new XMLHttpRequest();
      xhr.open("POST", this.endpoint + "token")
      xhr.responseType = "json";
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      var self = this;
      aseq(
        function(ret) {
          xhr.asend(ret, postdata.join('&'));
        },
        function(ret) {
          if ( xhr.status === 200 ) self.accessToken = xhr.response.access_token;

          ret && ret(xhr.status === 200 && self.accessToken)
        })(ret);
    },

    refreshNow_: function(ret, opt_forceInteractive) {
      if ( opt_forceInteractive ) {
        this.auth(ret);
        return;
      }

      aseq(
        (function(ret) {
          this.updateAccessToken(ret)
        }).bind(this),
        (function(ret, result) {
          if ( ! result ) {
            this.auth(ret);
            return;
          }

          ret && ret(result);
        }).bind(this)
      )(ret);
    }
  }
});


// TODO: Register model for model, or fix the facade.
if ( window.chrome && window.chrome.runtime && window.chrome.runtime.id ) {
  var EasyOAuth2 = OAuth2ChromeApp;
} else {
  EasyOAuth2 = OAuth2WebClient;
}
