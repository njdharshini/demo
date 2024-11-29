const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
    workspace:{
        type:String
    },
    Organization_name: {
        type: String,
        trim: true,
    },
    labels: [{
        type: String,
    }],
});

module.exports = mongoose.model('Organization', OrganizationSchema);
