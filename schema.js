const _ = require('underscore');
const async = require('async');

const SCHEMA = {
    comments: function(table){
        table.increments();
        table.integer('createdAt').index();
        table.string('postId').index();
        table.text('commentData', 'MEDIUMTEXT');
    }
}

module.exports = function(options,
                          callbackIn){
    async.eachSeries(_.keys(SCHEMA), function(tableName, callback){
        options.knex.schema.hasTable(tableName)
            .then(function(exists) {
                if( exists ){
                    callback();
                    return null;
                }
                return options.knex.schema.createTable(tableName,
                                                SCHEMA[tableName])
                    .then(function(){ return callback(); })
                    .error(callback)
            })
            .error(callback);
    }, callbackIn);
}