var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } ,
    description: { type: String},
    users: [{type: ObjectId, ref: 'User'}],
    calendar: { type: ObjectId, ref: 'Calendar' },
    isPublic: {type: Boolean, required: true},
    chat: [{ body: String, user: String, date: Date }],
    complaints: [{type: ObjectId, ref: 'Complaint'}],
});

module.exports = mongoose.model('Group', GroupSchema);
