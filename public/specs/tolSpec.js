describe('The TOL client request method', function() {
  var fixtures = {
    request: {},
    token: {
      badCredentials: {error: 'invalid_client', error_description: 'desc'},
      invalid: {invalid: 'response'},
      valid: {expires_in: 3600, access_token: 'goodtoken', token_type: 'bearer', scope: null}
    },
    result: {
      missing: {error: {message: '404'}},
      valid: {url: '/theurl/path', result: {key: 'value', key2: 'value2'}},
      expiredToken: {error: 'invalid_grant', error_description: 'desc'}
    }
  };

  var onSuccess, onError;

  beforeEach(function() {
    jasmine.Ajax.useMock();
    clearAjaxRequests();
    TOL.accessToken = null;
    onSuccess = jasmine.createSpy('onSuccess');
    onError = jasmine.createSpy('onError');

    fixtures.request.normal = {
      client: {id: 'test', secret: 'test'},
      path: 'foo',
      success: onSuccess,
      error: onError
    };

    fixtures.request.put = {
      client: {id: 'test', secret: 'test'},
      path: 'foo',
      type: 'PUT',
      data: {foo: 'bar'},
      success: onSuccess,
      error: onError
    };
  });

  describe('with a missing value', function() {
    describe('for url', function() {
      it('should throw an exception', function() {
        expect(function() {
          TOL.request({
            url: null,
            path: 'foo',
            success: onSuccess
          });
        }).toThrow('Missing required parameters');
      });
    });

    describe('for version', function() {
      it('should throw an exception', function() {
        expect(function() {
          TOL.request({
            version: null,
            path: 'foo',
            success: onSuccess
          });
        }).toThrow('Missing required parameters');
      });
    });

    describe('for path', function() {
      it('should throw an exception', function() {
        expect(function() {
          TOL.request({
            success: onSuccess
          });
        }).toThrow('Missing required parameters');
      });
    });

    describe('for success handler', function() {
      it('should throw an exception', function() {
        expect(function() {
          TOL.request({
            path: 'foo'
          });
        }).toThrow('Missing required parameters');
      });
    });

    describe('for credentials', function() {
      it('should throw an exception', function() {
        expect(function() {
          TOL.request({
            path: 'foo',
            success: onSuccess
          });
        }).toThrow('Missing required fields for getting an access token.');
      });
    });
  });

  describe('with invalid credentials', function() {
    beforeEach(function() {
      TOL.request(fixtures.request.normal);

      ajaxRequests[0].response({
        status: 400,
        responseText: JSON.stringify(fixtures.token.badCredentials)
      });
    });

    it('should call the error handler', function() {
      expect(onError).toHaveBeenCalled();
      var errorData = JSON.parse(onError.mostRecentCall.args[0].responseText);
      expect(errorData).toEqual(fixtures.token.badCredentials);
    });

    it('should not call the success handler', function() {
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe ('with valid credentials', function() {
    beforeEach(function() {
      TOL.request(fixtures.request.normal);
    });

    describe('with an invalid access_token response', function() {
      beforeEach(function() {
        ajaxRequests[0].response({
          status: 200,
          responseText: JSON.stringify(fixtures.token.invalid)
        });
      });

      it('should call the error handler', function() {
        expect(onError).toHaveBeenCalled();
        var errorData = JSON.parse(onError.mostRecentCall.args[0].responseText);
        expect(errorData).toEqual(fixtures.token.invalid);
      });

      it('should not call the success handler', function() {
        expect(onSuccess).not.toHaveBeenCalled();
      });
    });

    describe('with a valid access_token response', function() {
      beforeEach(function() {
        ajaxRequests[0].response({
          status: 200,
          responseText: JSON.stringify(fixtures.token.valid)
        });
      });

      describe('to an invalid resource', function() {
        beforeEach(function() {
          ajaxRequests[1].response({
            status: 404,
            responseText: JSON.stringify(fixtures.result.missing)
          });
        });

        it('should call the error handler', function() {
          expect(onError).toHaveBeenCalled();
          var errorData = JSON.parse(onError.mostRecentCall.args[0].responseText);
          expect(errorData).toEqual(fixtures.result.missing);
        });

        it('should not call the success handler', function() {
          expect(onSuccess).not.toHaveBeenCalled();
        });
      });

      describe('to a valid resource', function() {
        beforeEach(function() {
          ajaxRequests[1].response({
            status: 200,
            responseText: JSON.stringify(fixtures.result.valid)
          });
        });

        it('should call the success handler', function() {
          expect(onSuccess).toHaveBeenCalled();
          var data = onSuccess.mostRecentCall.args[0];
          expect(data).toEqual(fixtures.result.valid);
        });

        it('should not call the errorhandler', function() {
          expect(onError).not.toHaveBeenCalled();
        });

        describe('twice', function() {
          beforeEach(function() {
            TOL.request(fixtures.request.normal);

            ajaxRequests[2].response({
              status: 200,
              responseText: JSON.stringify(fixtures.result.valid)
            });
          });

          it('should call the success handler', function() {
            expect(onSuccess.callCount).toEqual(2);
            var data = onSuccess.mostRecentCall.args[0];
            expect(data).toEqual(fixtures.result.valid);
          });

          it('should not call the errorhandler', function() {
            expect(onError).not.toHaveBeenCalled();
          });
        });

        describe('twice with token expiring', function() {
          beforeEach(function() {
            TOL.request(fixtures.request.normal);

            ajaxRequests[2].response({
              status: 401,
              responseText: JSON.stringify(fixtures.result.expiredToken)
            });

            ajaxRequests[3].response({
              status: 200,
              responseText: JSON.stringify(fixtures.token.valid)
            });

            ajaxRequests[4].response({
              status: 200,
              responseText: JSON.stringify(fixtures.result.valid)
            });
          });

          it('should call the success handler', function() {
            expect(onSuccess.callCount).toEqual(2);
            var data = onSuccess.mostRecentCall.args[0];
            expect(data).toEqual(fixtures.result.valid);
          });

          it('should not call the errorhandler', function() {
            expect(onError).not.toHaveBeenCalled();
          });
        });
      });
    });
  });

  describe ('as a put request', function() {
    beforeEach(function() {
      TOL.request(fixtures.request.put);

      ajaxRequests[0].response({
        status: 200,
        responseText: JSON.stringify(fixtures.token.valid)
      });

      ajaxRequests[1].response({
        status: 200,
        responseText: JSON.stringify(fixtures.result.valid)
      });
    });

    it('should call the success handler', function() {
      expect(onSuccess).toHaveBeenCalled();
      var data = onSuccess.mostRecentCall.args[0];
      expect(data).toEqual(fixtures.result.valid);
    });

    it('should not call the errorhandler', function() {
      expect(onError).not.toHaveBeenCalled();
    });

    it('should make the request as json', function() {
      expect(ajaxRequests[1].requestHeaders['Content-Type']).toEqual('application/json');
    });

    it('should encode the data as json', function() {
      expect(ajaxRequests[1].params).toEqual('{"foo":"bar"}');
    });
  });
});
