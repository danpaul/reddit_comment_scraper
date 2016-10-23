const async = require('async');
const config = require('./config');
const knex = require('knex')(config.knex);
const request = require('request');

const requestDelay = 1000;
const intervalLength = 1000 * 60 * 15; // 15 minutes
const tableName = 'comments';

const handleError = function(err){ console.log(err); }

const getRecent = function(callback){
    request('https://www.reddit.com/.json?limit=100',
            function(error, response, body){
        if( error ) { return callback(err); }
        if( response.statusCode !== 200 ){
            return callback(new Error('Received status code: ' + response.statusCode));
        }
        var data = JSON.parse(body);
        if( !data ||
            !data.data ||
            !data.data.children ||
            !data.data.children.length ){

            return callback(new Error('Received no data'));
        }
        callback(null, data.data.children);
    });
}

const getCommentsFromRecentAndSave = function(recent, callback){
    async.eachSeries(recent, function(post, callback){
        const id = post.data.id;
        const subreddit = post.data.subreddit;
        getCommentsAndSave(id, subreddit, function(err){
            if( err ){ handleError(err); }
            if( config.debug ){
                console.log('comments saved for: ', id);
            }
            setTimeout(callback, requestDelay);
        })
    }, callback);
}

const getCommentsAndSave = function(postId, subreddit, callback){
    const commentLink = 'https://www.reddit.com/r/' + subreddit + '/comments/' + postId + '/.json';
    request(commentLink, function(error, response, body){
        if( error ) { return callback(err); }
        if( response.statusCode !== 200 ){
            return callback(new Error('Received status code: ' + response.statusCode));
        }
        // var data = JSON.parse(body);
        // if( !data ){ return callback(new Error('Received no data')); }
        saveComments(postId, body, callback);
    });
}

const saveComments = function(postId, data, callback){
    // const stringData = JSON.stringify(data);
    knex.table(tableName)
        .where({postId: postId})
        .then(function(rows){
            if( rows.length ){
                return knex.table(tableName)
                    .where('postId', postId)
                    .update('commentData', data)
                    .then(function(){ return callback(); })
                    .error(callback)
            } else {
                const timeStamp = Math.round(Date.now()/1000);
                const d = {postId: postId, commentData: stringData, createdAt: timeStamp};
                return knex.table(tableName)
                    .insert(d)
                    .then(function(){ return callback(); })
                    .error(callback)
            }
        })
        .error(callback)
}

const checkFeeds = function(){
    getRecent(function(err, recent){
        if( err ){ return(handleError(err)); }
        getCommentsFromRecentAndSave(recent, function(err, recent){
            if( err ){ return(handleError(err)); }
            if( config.debug ){
                console.log('********** Saved comments cycle complete **********');
            }
        });
    });
}

require('./schema')({knex: knex}, function(err){
    if( err ){ throw(err); }
    checkFeeds();
    setInterval(checkFeeds, intervalLength);
});