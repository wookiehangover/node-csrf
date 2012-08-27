/*!
 * Dwolla - CSRF
 * Copyright(c) 2011 Dwolla Inc.
 * MIT Licensed
 */


/**
 * Module dependencies.
 */
var _ = require('underscore');


/**
 * node-csrf:
 *
 * CSRF protection middleware; 
 *
 * Examples:
 *
 *      var csrf = require('csrf'),
 *          ips = ['127.0.0.1'];
 *
 *      app.use(csrf(ips));
 *
 * Options:
 *
 *  - `log` console log actions. Defaults to true.
 *  - `errorCode` the HTTP status code to use when denying access. Defaults to 401.
 *  - `errorMessage` the error message to use when denying access. Defaults to 'Unauthorized'.
 *
 * @param [Array] IP addresses
 * @param {Object} options
 * @api public
 */

module.exports = function csrf(ips, opts) {
	var ips = ips || false
		, opts = _.extend({
			log: true
			, errorCode: 401
			, errorMessage: 'Unauthorized'
		}, opts)
		, getClientIp = function(req) {
			var ipAddress;

			var forwardedIpsStr = req.header('x-forwarded-for'); 

			if (forwardedIpsStr) {
				var forwardedIps = forwardedIpsStr.split(',');
				ipAddress = forwardedIps[0];
			}

			if (!ipAddress) {
				ipAddress = req.connection.remoteAddress;
			}

			return ipAddress;
		}
		;
		
  return function(req, res, next){
	var ip = getClientIp(req); // Grab the client's IP address

    // generate CSRF token
    var token = req.session._csrf || (req.session._csrf = require('connect').utils.uid(24));

    // ignore GET (for now)
    if ('GET' == req.method || 'HEAD' == req.method || 'OPTIONS' == req.method) return next();

    // determine value
    var val = value(req);

    // check
    if ((val != token) && (!ips || (ips.indexOf(ip) === -1))) {
    	// Deny access
		if(opts.log) {
			console.log('Bad CSRF. Access denied to IP address: ' + ip);
		}

		res.statusCode = opts.errorCode;
		return res.end(opts.errorMessage);
    }

    // Grant access
	if(opts.log) {
		console.log('CSRF verified. Access granted to IP address: ' + ip);
    }

    next();
  }
};


/**
 * Default value function, checking the `req.body`
 * and `req.query` for the CSRF token.
 *
 * @param {IncomingMessage} req
 * @return {String}
 * @api private
 */

function value(req) {
  return (req.body && req.body._csrf)
    || (req.query && req.query._csrf)
    || (req.headers['x-csrf-token']);
}