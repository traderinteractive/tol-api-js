# Javascript Client for the TOL API

This is a jQuery based client for the TraderOnline API.

## Requirements

The client library is based off and tested with [jQuery](http://jquery.com),
although it may work with [Zepto.js](http://zeptojs.com) or other alternatives.

## Usage

Usage of the API is fairly simple.  It will automatically handle fetching an OAuth2 token for you as long as you setup your credentials beforehand.  If the token expires, it will transparently fetch a new one in the same manner as done before.

Here is an example set of code that relies on this automatic fetching.
```js
TOL.client.id = 'yourClientId';
TOL.client.secret = 'yourClientSecret';

TOL.request({
    path: 'realms',
    success: function(data) {
        console.log(data);
    }
});
```
Posting data is fairly simple as well:
```js
TOL.request({
    path: 'videos',
    type: 'POST',
    data: {
        video: {
            realmId: 5,
            videoType: 'dealer',
            videoUrl: 'http://youtu.be/9bZkp7q19f0'
        }
    },
    success: function(data) {
        console.log(data);
    }
});
```

## Development

The included example is a simple [Node.js](http://nodejs.org) application.  You
can start it up with:

  node index.js

Alternatively, using [foreman](http://ddollar.github.com/foreman/), you can just run

  foreman start
