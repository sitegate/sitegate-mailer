'use strict';

var i18n = require('i18next');
var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates');
var TEMPLATES_DIR = './templates';

module.exports = function(ms) {
  var config = ms.config;

  return function(options, cb) {
    emailTemplates(TEMPLATES_DIR, function(err, template) {
      if (err) {
        return cb(err, null);
      }

      options.locals = options.locals || {};
      options.locals.t = i18n.t;
      options.app = config.get('app');

      template(options.templateName, options.locals, function(err, html, text) {
        if (err) {
          return cb(err, null);
        }

        var smtpTransport = nodemailer.createTransport(config.get('mailer.options'));
        var mailOptions = {
          to: options.to,
          from: config.get('mailer.from'),
          subject: options.subject || i18n.t('email.subject.' + options.templateName),
          html: html,
          text: text
        };

        smtpTransport.sendMail(mailOptions, function(err, info) {
          if (err) {
            return cb(err, null);
          }

          return cb(null, info.response);
        });
      });
    });
  };
};
