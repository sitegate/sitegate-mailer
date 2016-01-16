'use strict'
const joi = require('joi')
const debug = require('debug')('sitegate-mailer')
const i18n = require('i18next')
const Q = require('q')
const emailTemplates = Q.denodeify(require('email-templates'))
const path = require('path')
const templatesDir = path.join(__dirname, '../templates')

module.exports = function(ms, opts) {
  let smtpTransport = ms.plugins['smtp-transport']

  ms.method({
    name: 'sendEmail',
    config: {
      validate: {
        templateName: joi.string().required(),
        to: joi.string().required(),
      },
    },
    handler(params, cb) {
      emailTemplates(templatesDir)
        .then(function(template) {
          params.locals = params.locals || {};
          params.locals.t = i18n.t;
          params.locals.app = opts.app;

          return Q.nfcall(template, params.templateName, params.locals);
        })
        .then(function(html, text) {
          let mailOptions = {
            to: params.to,
            from: opts.from,
            subject: params.subject ||
              i18n.t('email.subject.' + params.templateName),
            html: html,
            text: text,
          };

          return Q.nfcall(smtpTransport.sendMail.bind(smtpTransport), mailOptions);
        })
        .then(info => cb(null, info.response))
        .catch(function(err) {
          debug('Error during sending email to ' + params.to);
          debug(err);
          cb(err, null);
        });
    },
  })
}

module.exports.attributes = {
  name: 'send-email',
  dependencies: 'smtp-transport',
}
