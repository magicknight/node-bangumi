/**
 * Bangumi API client library for node.js.
 * @module Bangumi
 * @version 1.0.0
 */

var	VERSION = '1.0.0';
var protocols = {
  http: require('http'),
  https: require('https'),
};
var querystring = require('querystring');
var utils = require('./utils');
var PromiseProvider = require('./promise_provider');


/**
 * @class Bangumi
 * @param [options] {object}
 * @param [options.app_id] {string} app id used for identify source
 * @param [options.access_token] {string} access token used for identify user
 */

function Bangumi(options){
  if (!(this instanceof Bangumi)) return new Bangumi(options);
  var defaults = {
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Connection': 'close',
      'User-Agent': 'node-bangumi/' + VERSION
    },

    callback_url: null,
    rest_base : 'api.bgm.tv',
    cookie_options: {},
    cookie_secret: null
  };
  this.options = utils.merge(defaults, options);
}

Bangumi.VERSION = VERSION;
module.exports = Bangumi;

/**
 * Set custom promise provider, default using nodejs ES6 promise provider
 * @param provider {function} Custom promise provider
 */
Bangumi.prototype.setPromiseProvider = function(provider) {
  PromiseProvider.set(provider);
};


/**
 * A general GET request method for Bangumi API
 * @method get
 * @param url {string} base GET request path
 * @param params {object} parameters used for GET query string
 * @param callback {function} callback function
 */
Bangumi.prototype._get = function(url, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = {};
  }


  if ( typeof callback !== 'function' ) {
    throw 'FAIL: INVALID CALLBACK.';
  }

  if (url.charAt(0) !== '/')        {
    throw 'FAIL: INVALID URL.';
  }

  if (this.options.hasOwnProperty('app_id')) params = utils.merge({source:this.options.app_id}, params);


  var protocolName = this.options.protocol || 'https';


  var options = {
    host: this.options.rest_base,
    path: encodeURI(url + (querystring.stringify(params) ? '?' : '') + querystring.stringify(params)),
    method: 'GET',
    headers: this.options.headers
  };

  if (this.options.hasOwnProperty('access_token')) options.headers['Authorization'] = 'Bearer ' + this.options.access_token;

  var req = protocols[protocolName].request(options, function(res){
    var data = '';
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('end', function () {
      try {
        var json = JSON.parse(data);
        if (json.hasOwnProperty('error')) callback(json, {});
        else callback(null, json);
      } catch(err) {
        callback(err, {});
      }
    });

    res.on('error', function(err) {
      callback(err, {});
    });
  });

  req.end();

  return this;
};

/**
 * Proxy function for _get
 * @param url
 * @param params
 * @param callback
 * @returns {*}
 */
Bangumi.prototype.get = function(url, params, callback) {
  var self = this;
  return utils.promiseOrCallback(callback, function(cb){
    self._get(url, params, cb);
  });
};
/**
 * A general POST reqeust method for Bangumi API
 * @method post
 * @param url {string} base POST request path
 * @param params {object} parameters used for POST body
 * @param callback {function} callback function
 */
Bangumi.prototype._post = function(url, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = {};
  }

  if ( typeof callback !== 'function' ) {
    throw 'FAIL: INVALID CALLBACK.';
  }

  if (url.charAt(0) !== '/')        {
    throw 'FAIL: INVALID URL.';
  }

  var protocolName = this.options.protocol || 'https';

  var post_data =  querystring.stringify(params);

  var headers = utils.merge({'Content-Length': post_data.length}, this.options.headers);

  var options = {
    host: this.options.rest_base,
    path: encodeURI(url),
    method: 'POST',
    headers: headers
  };

  if (this.options.hasOwnProperty('access_token')) options.headers['Authorization'] = 'Bearer ' + this.options.access_token;
  if (this.options.hasOwnProperty('app_id')) options.path += '?' + querystring.stringify({source: this.options.app_id});

  var req = protocols[protocolName].request(options, function(res){
    var data = '';
    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('end', function () {
      try {
        var json = JSON.parse(data);
        if (json.hasOwnProperty('error')) callback(json, {});
        else callback(null, json);
      } catch(err) {
        callback(err, {});
      }
    });

    res.on('error', function(err) {
      callback(err, {});
    });
  });

  req.write(post_data);
  req.end();

  return this;
};

Bangumi.prototype.post = function(url, params, callback) {
  var self = this;
  return utils.promiseOrCallback(callback, function(cb){
    self._post(url, params, cb);
  });
};


/**
 * API Methods
 */


/**
 * A GET method that gets current weekly shows' seclude
 * @method calendar
 * @param callback {function} callback function
 */
Bangumi.prototype.calendar = function(callback) {
  var url = '/calendar';
  this.get(url, callback);
  return this;
};

/**
 * A GET method that gets target user's profile
 * @method user
 * @param username {string|number} username or uid of target username
 * @param callback {function} callback function
 */
Bangumi.prototype.user = function(username, callback){
  var url = '/user/' + username;
  return this.get(url, callback);
};

/**
 * A GET method that gets a details of a subject by id
 * @method subject
 * @param subject_id {number} id of target subject
 * @param params {object}
 * @param [params.responseGroup] {string} accept [small|medium|large]
 * @param callback {function} callback function
 */
Bangumi.prototype.subject = function(subject_id, params, callback){
  var url = '/subject/' + subject_id;
  return this.get(url, params, callback);
};

/**
 * A GET method that gets a list of episodes of a subject by subject id
 * @method ep
 * @param subject_id {number} id of target subject
 * @param callback {function} callback function
 */

Bangumi.prototype.ep = function(subject_id, callback){
  var url = '/subject/' + subject_id + '/ep';
  return this.get(url, callback);
};

/**
 * A GET method that gets details of user's collection by user id
 * @method collectionByUser
 * @param username {string} username or uid of target username
 * @param params {object}
 * @param [params.cat] {string} accept [watching]
 * @param callback {function} callback function
 */
Bangumi.prototype.collectionByUser = function(username, params, callback){
  var url = '/user/' + username + '/collection';
  return this.get(url, params, callback);
};


/**
 * A GET method that searches and returns a list of subjects by keywords
 * @method search
 * @param keywords {string} query string for search
 * @param params {object}
 * @param [params.responseGroup] {string} accept [small|medium|large]
 * @param [params.type] {number} accept [1|2|3|4|6] (1.book 2.anime 3.music 4.game 5.live action)
 * @param [params.start] {number} result start index, used for paging
 * @param [params.max_results] {number} the number of entries returns, max 20
 * @param callback {function} callback function
 */
Bangumi.prototype.search = function(keywords, params, callback){
  var url =  '/search/subject/' + keywords;
  return this.get(url, params, callback);
};



/**
 * A GET method that get current user's collection details on specific subject by subject id
 * @method collectionBySubject
 * @param subject_id {number} id of target subject
 * @param params {object}
 * @param params.auth {string} authentication string used for validation of user identity
 * @param callback {function} callback function
 */
Bangumi.prototype.collectionBySubject = function(subject_id, params, callback){
  var url =  '/collection/' + subject_id;
  return this.get(url, params, callback);
};


/**
 * A GET method that get lists of episodes that user already watched, sorted by subject id
 * @method progress
 * @param username {string} username or uid of target username
 * @param params {object}
 * @param params.auth {string} authentication string used for validation of user identity
 * @param callback {function} callback function
 */
Bangumi.prototype.progress = function(username, params, callback){
  var url = '/user/' + username + '/progress';
  return this.get(url, params, callback);
};

/**
 * A POST method that login user with username and password, and returns auth string
 * @method auth
 * @param params {object}
 * @param params.username {string} username or uid of target username
 * @param params.password {string} password for target user
 * @param callback {function} callback function
 */

Bangumi.prototype.auth = function(params, callback){
  console.warn('auth() will be deprecated in the near future');
  var url = '/auth';
  return this.post(url, params, callback);
};


/**
 * A POST method that updates user's status on specific subject by subject id
 * @method createCollection
 * @param subject_id {number} id of target subject
 * @param params {object}
 * @param params.status {string} accept [wish|collect|do|on_hold|dropped]
 * @param [params.comment] {string} comment on target subject status update
 * @param [params.tags] {string} tags on target subject status update, separated by comma
 * @param [params.rating] {string} star rating on target subject, accept [0~10]
 * @param callback {function} callback function
 */
Bangumi.prototype.createCollection = function(subject_id, params, callback){
  var url = '/collection/' + subject_id + '/create';
  return this.post(url, params, callback);
};

/**
 * A POST method that updates user's status on specific episode by episode id
 * @method updateEp
 * @param ep_id {number} id of target episode
 * @param status {string} accept [wish|collect|do|on_hold|dropped]
 * @param params {object}
 * @param [params.ep_id] {string} a list of episode ids for batch processing, separated by comma
 * @param callback {function} callback function
 */
Bangumi.prototype.updateEp = function(ep_id, status, params, callback){
  var url = '/ep/' + ep_id + '/status/' + status;
  return this.post(url, params, callback);
};


/**
 * A POST method that marks episode 1 to target number as watched
 * @method updateEps
 * @param subject_id {number} id of target subject
 * @param params {object}
 * @param params.watched_eps {string} the number of episodes that user currently have watched
 * @param callback {function} callback function
 */
Bangumi.prototype.updateEps = function(subject_id, params, callback){
  var url = '/subject/' + subject_id + '/update/watched_eps';
  return this.post(url, params, callback);
};