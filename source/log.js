#!/usr/local/bin/node
/**
*	@file logjs/source/main.js
*	@author Anadian
*	@copyright MIT License:
	Copyright 2017 Canosw
	Permission is hereby granted, free of charge, to any person obtaining a copy of this 
software and associated documentation files (the "Software"), to deal in the Software 
without restriction, including without limitation the rights to use, copy, modify, 
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to 
permit persons to whom the Software is furnished to do so, subject to the following 
conditions:
	The above copyright notice and this permission notice shall be included in all copies 
or substantial portions of the Software.
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

//Standard
const Utility = require('util');
const FileSystem = require('fs');
const Path = require('path');
//External
const Chalk = require('chalk');

var date = new Date();
const LogLevelsMap = new Map([
	['error',1],
	['warn',2],
	['note',3],
	['info',4],
	['debug',5]
]);

var Transports = [
	{enabled: true, type: 'file', name: date.toISOString().replace(/[-+:.]/g,'')+'.log', colour: false, level: 'debug'},
	{enabled: true, type: 'stream', name: 'stderr', colour: true, level: 'info'}
];

function appendFile_Callback(error){ 
	if(error != null) console.error('AppendFile error: ', error);
}

function Log(process_name, module_name, file_name, function_name, level_name, message){
	var _return = [0,null];
	var error_message = null;
	var date = new Date();
	if(arguments.length > 6){
		for(var i = 6; i < arguments.length; i++){
			message += ('|'+Utility.inspect(arguments[i]));
		}
	}
	for(var i = 0; i < Transports.length; i++){
		if(Transports[i].enabled === true){
			var transport_level = LogLevelsMap.get(Transports[i].level);
			var message_level = LogLevelsMap.get(level_name);
			if(message_level <= transport_level){
				if(Transports[i].type === 'file'){
					if(Transports[i].name != null){
						FileSystem.appendFile(Transports[i].name, date.toISOString()+' '+process_name+':'+module_name+':'+file_name+':'+function_name+':'+level_name+': '+message+'\n', 'utf8', appendFile_Callback);
						_return[0] = 1;
					} else{
						error_message = Utility.format('Log error: Transports[%d].name is not specified: ', i, Transports[i].name);
						console.error(error_message);
						_return[0] = 0;
						_return[1] += error_message;
					}
				} else if(Transports[i].type === 'stream'){
					var string = '';
					if(Transports[i].colour === true){
						var colour;
						switch(level_name){
							//silent
							case 'error': colour = Chalk.red; break;
							//quiet
							case 'warn': colour = Chalk.yellow; break;
							case 'note': colour = Chalk.magenta; break;
							case 'info': colour = Chalk.blue; break;
							//normal
							case 'debug': colour = Chalk.green; break;
							//verbose
							default: colour = function no_colour(){ return arguments; }; break;
						}
						string = colour(Utility.format("%s:%s:%s: %s", Chalk.bold(level_name), Chalk.dim(module_name), Chalk.underline(function_name), message));
					} else{
						string = Utility.format("%s:%s:%s: %s", level_name, module_name, function_name, message);
					}
					if(Transports[i].name === 'stdout'){
						console.log(string);
						_return[0] = 1;
					} else if(Transports[i].name === 'stderr'){
						console.error(string);
						_return[0] = 1;
					} else{
						error_message = Utility.format('Log error: Unknown stream for Transports[%d]: %s', i, Transports[i].name);
						console.error(error_message);
						_return[0] = 0;
						_return[1] += error_message;
					}
				} else{
					error_message = Utility.format('Log error: Invalid transport type for Transports[%d]: '. i, Transports.type);
					console.error(error_message);
					_return[0] = 0;
					_return[1] += error_message;
				}	
			}
		}
	}
	return _return;
}
function Log_Test(){
	Log(process.argv0, 'test', Path.basename(__filename), arguments.callee.name, 'error', 'yo');
	Log(process.argv0, 'test', Path.basename(__filename), arguments.callee.name, 'warn', 'yo');
	Log(process.argv0, 'test', Path.basename(__filename), arguments.callee.name, 'note', 'yo');
	Log(process.argv0, 'test', Path.basename(__filename), arguments.callee.name, 'info', 'yo');
	Log(process.argv0, 'test', Path.basename(__filename), arguments.callee.name, 'debug', 'yo');
}

if(require.main === module){
	Log_Test();
} else{
	exports.log = Log;
	exports.test = Log_Test;
}

