/*
* Serve JSON to our AngularJS client
*/
var express = require('express');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var mongoose = require('mongoose');
var router = express.Router();

// Config
var conf = require('../config.js');
// Models
var User = require('../models/user');
var Group = require('../models/group');
var Complaint = require('../models/complaint');

var complaint = new Object();

complaint.createComplaint = function(req, res) {
     console.log('here\nhere\nhere\nhere\n');
    var newComplaint = new Complaint();
        newComplaint.group = req.body.group;
        newComplaint.title = req.body.title;
        newComplaint.message = req.body.message;
        newComplaint.dateCreated = new Date();
        newComplaint.urgency = req.body.urgency;

        console.log(req.body);

        newComplaint.save((err, complaint) => {
            if (err) {
                res.status(500).json({
                    error: err,
                    message: 'Error: Complaint creation failed'
                });
            }
            else {
                 Group.findOne({_id: req.body.group}).exec(function(err,group){
                    group.complaints.push(complaint._id);
                    group.save((err, group) => {
                        if (err) {
                            res.status(500).json({
                                error: err,
                                message: 'Error: Complaint creation failed'
                            });
                        }
                        else {
                            res.status(200).json({
                                message: 'Complaint submitted!',
                                complaintID: newComplaint._id,
                            })
                        }
                    });

                 });
            }


        });
}


module.exports = complaint;
