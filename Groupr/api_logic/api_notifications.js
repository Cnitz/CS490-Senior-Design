var express = require('express');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var mongoose = require('mongoose');
 var nodemailer = require('nodemailer');
var router = express.Router();

// Config
var conf = require('../config.js');
// Models
var User = require('../models/user');
var Meeting = require('../models/meeting');
var Group = require('../models/group');
var Task = require('../models/task');


//Email Connection
var connection = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'noreplygroupr@gmail.com',
        pass: 'ILikeToEatApples'
    },
    logger: true
};
var passUser = function(token, cb){
    console.log("Finding user with token " + token);
    User.findOne({token : token}, function(err, user) {
        cb(err, user);
    });
};
var notification = new Object();

notification.sendTestEmail = function(req, res) {
    var transporter = nodemailer.createTransport(connection);
    var mailOptions = {
      from: '"No Reply Groupr" <noreplygroupr@gmail.com>', // sender address
      to: "fische17@purdue.edu", // list of receivers
      subject: 'Hello ✔', // Subject line
      text: 'Hello world ?', // plaintext body
      html: '<b>Hello world ?</b>' // html body
    }
      transporter.sendMail(mailOptions, function(error, info){
          if(error){
              return console.log(error);
          }
          console.log('Message sent: ' + info.response);
    });
  }
notification.sendBasicEmail = function(tooEmail, subjectEmail, textEmail) {
      var transporter = nodemailer.createTransport(connection);
      var mailOptions = {
        from: '"No Reply Groupr" <noreplygroupr@gmail.com>', // sender address
        to: tooEmail, // list of receivers
        subject: subjectEmail, // Subject line
        text: textEmail
      }
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
      });
}
notification.sendGroupEmail = function(tooEmail, subjectEmail, textEmail, group) {
      var transporter = nodemailer.createTransport(connection);
      var mailOptions = {
        from: '"No Reply Groupr" <noreplygroupr@gmail.com>', // sender address
        to: tooEmail, // list of receivers
        subject: subjectEmail, // Subject line
        text: textEmail
      }
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
      });
}

module.exports = notification;
