var config = {};

config.environment = process.env.NODE_ENV ?
                     process.env.NODE_ENV : 'development';

if( config.environment === 'development' ){
    config.knex = {
        client: 'mysql',
        connection: {
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'reddit_scrape',
            port:  8889
        }
    };
} else if( config.environment === 'production' ) {

} else {
    throw('App must be started with env flag set.')
}

module.exports = config;