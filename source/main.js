#!/usr/local/bin/node
/**
*	@file jsmacro/source/smain.js
*	@brief A simple, progressive macro expansions engine written in nodejs.
*	@author Anadian
*	@license MIT License:
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

//Internal
const Log = require('./log.js');
//Standard
const FileSystem = require('fs');
const Path = require('path');
const Utility = require('util');
//External
const CommandLineArgs = require('command-line-args');
const CommandLineUsage = require('command-line-usage');

const OptionDefinitions = [
	{name: 'fail', alias: 'F', type: Boolean, description: 'Abort theatrically at the first sign of something being wrong.'},
	{name: 'help', alias: 'h', type: Boolean, description: 'Display this help text.'},
	{name: 'input', alias: 'I', type: String, description: 'File to process.'},
	{name: 'log', alias: 'l', type: String, description: 'Log to the specified file instead of the default.'}
	{name: 'output', alias: 'O', type: String, description: 'File to write processed output to.'},
	{name: 'quiet', alias: 'q', type: Boolean, description: 'Only log errors.'},
	{name: 'rules', alias: 'R', type: String, description: 'File to read text-transformation rules from.'},
	{name: 'silent', alias: 's', type: Boolean, description: 'Silence all logging.'},
	{name: 'stdin', alias: 'i', type: Boolean, description: 'Read from stdin instead of the input file.'},
	{name: 'stdout', alias: 'o' type: Boolean, description: 'Print to stdout instead of the specified output file.'},
	{name: 'verbose', alias: 'v', type: Boolean, description: 'Enable more verbose logging.'}
	{name: 'version', alias: 'V', type: Boolean, description: 'Display version information and exit.'},
];

const Options = CommandLineArgs(OptionDefinitions);

function ParseRules(rules_file){
	var _return = [0,null];
	var rules_map = new Map();
	var rules_string = FileSystem.readFileSync(rules_file,'utf8');
	var rules_strings = rules_string.split('\n');
	Log.log(process.argv0,'jsmacro',Path.basename(__filename),'ParseRules','debug',Utility.format(rules_strings));
	if(rules_strings != null){
		for(var i = 0; i < rules_strings.length; i++){
			var matches = rules_strings[i].match(/^\$(\w*)=\/(.*)\/\[(\d)\]$/);
			if(matches != null){
				var number = parseInt(matches[3],10);
				if(number != NaN){
					rules_map.set(matches[1],{name: matches[1], type: 'assignment', regex: new RegExp(matches[2],'g'), subpattern: number, value: null});
				} else{
					Log.log(process.argv0,'jsmacro','main.js','ParseRules','error',Utility.format('Unrecognized number for rule #%d, \'%s\' ', i, matches[3], matches));
				}
			} else{
				matches = rules_strings[i].match(/^\/(.*)\/=\$(\w*)$/);
				if(matches != null){
					rules_map.set(matches[0],{name: matches[0], type: 'application', regex: new RegExp(matches[1],'g'), key: matches[2]});
				} else{
					Log.log(process.argv0,'jsmacro','main.js','ParseRules','error',Utility.format('Couldn\'t interperet rule on line %d: %s', i, rules_strings[i])); 
				}
			}
		}
	} else{
		Log.log(process.argv0,'jsmacro','main.js','ParseRules','error',Utility.format('Problem reading rules file \'%s\'.', rules_file));
	}
	return rules_map;
}

function ParseInput(input_file,rules_map){
	var _return = [0,null];
	var input_string = FileSystem.readFileSync(input,'utf8');
	var input_strings = input_string.split('\n');
	if(input_strings != null){
		for(var i = 0; i < input_strings.length; i++){
			var j = 0;
			var size = rules_map.size;
			var forEach_finished = false;
			rules_map.forEach(function forEach_Callback(value, key, map){
				var matches = null;
				if(j < size){
					if(value.type === 'assignment'){
						matches = input_strings[i].match(value.regex);
						if(matches != null){
							var object = map.get(key);
							object.value = matches[value.subpattern];
							map.set(key, object);
						}
					} else if(value.type === 'application'){
						match = input_strings[i].match(value.regex);
						if(match != null){
							var applied_value = map.get(value.key);
							input_strings[i].replace(value.regex,applied_value.value);
						}
					} else {
						Log.log(process.argv0,'jsmacro','main.js','ParseInput','error',Utility.format('Unkown type for rule map key \'%s\', \'%s\'.', key, value.type, value));
					}
					j++;
				} else{
					forEach_finished = true;
				}
			} //forEach_Callback
			);
			while(forEach_finished != true);
		} //for loop
		var output_string = input_strings.join('\n');
		_return = [1,output_string];
	} else{
		var error_message = Utility.format('A problem occurred while trying to read file \'%s\'', input_file);
		Log.log(process.argv0,'jsmacro','main.js','ParseInput','error',Utility.format(error_message));
		_return = [0,error_message];
	}
	return _return;
}

function main(){
	if(Options.rules != null){
		var ParseRules_return = ParseRules(Options.rules);
		if(ParseRules_return[0] === 1){
			var rules = ParseRules_return[1];
			if(Options.input != null && Options.output != null){
				var ParseInput_return = ParseInput(Options.input, rules);
				if(ParseInput_return[0] === 1){
					var output = ParseInput_return[1];
					FileSystem.writeFileSync(Options.output, output);
				} else{
					Log.log(process.argv0,'jsmacro','main.js','main','error',Utility.format('Parsing input was unsuccessful.', ParseInput_return));
				}
			} else{
				Log.log(process.argv0,'jsmacro','main.js','main','error',Utility.format('Invalid or absent value for input file or output file. Input file: \'%s\' output file: \'%s\'', Options.input, Options.output));
			}
		} else{
			Log.log(process.argv0,'jsmacro','main.js','main','error',Utility.format('Parsing rules was unsuccessful.', ParseRules_return));
		}
	} else{
		Log.log(process.argv0,'jsmacro','main.js','main','error',Utility.format('Invalid or absent value for rukes file: \'%s\'', Options.rules));
	}
}

if(require.main === module){
	main();
}
