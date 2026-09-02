// Root server entrypoint for hosting platforms (Render, Railway, Heroku)
const path = require('path');

// Set active working directory to the project folder
process.chdir(path.join(__dirname, 'Ninad 150096725180'));

// Execute the main modular server
require('./Ninad 150096725180/server.js');
