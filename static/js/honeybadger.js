// Obfuscation? Honey badger don't care!

function honeybadger_base64_encode(data) {
	//  discuss at: http://phpjs.org/functions/honeybadger_base64_encode/
	// original by: Tyler Akins (http://rumkin.com)
	// improved by: Bayron Guevara
	// improved by: Thunder.m
	// improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// improved by: Rafał Kukawski (http://kukawski.pl)
	// bugfixed by: Pellentesque Malesuada
	
	var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
	ac = 0,
	enc = '',
	tmp_arr = [];
	
	if (!data) {
		return data;
	}
	
	do { // pack three octets into four hexets
		o1 = data.charCodeAt(i++);
		o2 = data.charCodeAt(i++);
		o3 = data.charCodeAt(i++);
		
		bits = o1 << 16 | o2 << 8 | o3;
		
		h1 = bits >> 18 & 0x3f;
		h2 = bits >> 12 & 0x3f;
		h3 = bits >> 6 & 0x3f;
		h4 = bits & 0x3f;
		
		// use hexets to index into b64, and append result to encoded string
		tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
	} while (i < data.length);
	
	enc = tmp_arr.join('');
	
	var r = data.length % 3;
	
	return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
}

// We'll use these later
honeybadger_eval = eval;
honeybadger_write = document.write;

// Alter some behaviour if we're running as a standalone JS file
honeybadger_live = typeof honeybadger_reporting_url !== 'undefined';

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

// DOM changes we're interested in
honeybadger_collect_dom_objects = ['IFRAME', 'APPLET', 'OBJECT', 'SCRIPT']

// Logging function
function honeybadger_log(type, msg){
	console.log(type, msg);
	if (!honeybadger_live){
		return;
	}
	var xmlhttp = null;
	if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}
	else{// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.open("POST", honeybadger_reporting_url+"?submission_id="+honeybadger_submission_id+"&type=alert&msg="+honeybadger_base64_encode(type + '^' + msg).replace('+', '%2B'), false);
	xmlhttp.send(null);
	return xmlhttp.responseText;
}

// Let's implement some IE specific stuff for better compatibility

var ScriptEngineBuildVersion = function(){return 18315};                                                                                                                                                                     
var CollectGarbage = function(){};   

// WScript emulation

var honeybadger_files = {};
var honeybadger_registry = {};

function Shell(){
	this.ExpandEnvironmentStrings = function(path){
		return '/'
	}
	this.Run = function(path){
		honeybadger_log('ActiveX', '[RUN] ' + path)
	}
	this.RegWrite = function(key, value, type){
		honeybadger_log('ActiveX', '[REGISTRY WRITE] ' + key + ' = ' + value);
		honeybadger_registry[key] = value;
	}
}

var honeybadger_wscript_urls = [];
var honeybadger_wscript_sleep_count = 0;
function HTTPRequest(){
	this.open = function(method, url){
		honeybadger_wscript_urls.push(url);
		honeybadger_log('ActiveX', '[NET] ' + method + " " + url);
		return true;
	}
	this.send = function(){
		this.status = 200;
		return true;
	}
	this.readystate = 4;
	this.ResponseBody = '[Honeybadger dummy response body data]';
	this.responseText = '[Honeybadger dummy response body data]';
}
function ADODBstream(){
	this.open = function(){
	}
	this.Open = this.open;
	this.write = function(data){
		honeybadger_log('ActiveX', '[WRITE] ' + data);
	}
	this.Write = this.write;
	this.SaveToFile = function(filename, mode){
		honeybadger_log('ActiveX', '[WRITE] ' + filename)
	}
	this.close = function(){
	}
	this.Close = this.close;
	this.LoadFromFile = function(file){
	}
	this.saveToFile = function(path, mode){
		honeybadger_log('ActiveX', '[WRITE] ' + path);
	}
	this.CopyTo = function(path, mode){
	}
	this.ReadText = '[Honeybadger dummy ReadText data]';
}

function TextFileObject(path){
	honeybadger_log('ActiveX', '[OPEN] ' + path);
	this.path = path;
	this.filedata = 'muffin';

	this.Write = function(filedata){
		honeybadger_log('ActiveX', '[WRITE] ' + path + " ("+filedata.length + " bytes)");
		honeybadger_files[path] = filedata;
		this.filedata = filedata;
	}
	this.Close = function(){
		honeybadger_log('ActiveX', '[CLOSE] ' + path);
	}
	this.Read = function(){
		honeybadger_log('ActiveX', '[READ] ' + path);
		try{
			return honeybadger_files[this.path];
		}
		catch(err){
			return '';
		}
	}
	this.ReadLine = function(){
		return this.Read().split('\\n')[0];
	}
	this.OpenAsTextStream = function(){return this};
	this.ReadAll = this.Read;
}

function FileSystemObject(){
	this.OpenTextFile = function(filename, iomode, create, format){
		return new TextFileObject(filename);
	}
	this.GetFile = function(filepath){
		return new TextFileObject(filepath);
	}
	this.FileExists = function(filepath){
		honeybadger_log('ActiveX', '[CHECK] ' + filepath);
		return false;
	}
	this.FolderExists = function(path){
		honeybadger_log('ActiveX', '[CHECK] ' + path);
	}
}

function KasperskyKeyboardPlugin(){

}

function DOMDocument(){
	// I have one of those!
	return document;
}

function XMLDOM(){
	this.loadXML = function(xml){
		honeybadger_log('ActiveX', '[XML LOAD] ' + xml);
	}
	this.parseError = function(){
		return 0;
	}
}

function ShockwaveFlash(){
}

honeybadger_recordset = function(){
};
honeybadger_recordset.index = 0;
honeybadger_recordset.Fields = function(val){
	return this;
}
honeybadger_recordset.Fields.records = [];
honeybadger_recordset.Fields.Append = function(val){
	this.records.push(val);
}
honeybadger_recordset.Open = function(){};
honeybadger_recordset.Close = function(){};
honeybadger_recordset.AddNew = function(){
	this.Fields.records.push('');
	this.index = this.Fields.records.length - 1;
}
honeybadger_recordset.AppendChunk = function(val){
	console.log('ActiveX', val);
	this.Fields.records[this.index] = this.Fields.records[this.index] + val
}
honeybadger_recordset.GetChunk = function(val){
	return this.Fields.records[this.index]
}
honeybadger_recordset.Update = function(){}
honeybadger_recordset.MoveFirst = function(){
	this.index = 0;
}

var ADODBrecordset = function(val){
	this.callme = function(val){
		return window.hb_recordset;
	};
	this.callme.__proto__ = honeybadger_recordset
	window.hb_recordset = this.callme
	return this.callme;
}

var WindowsScriptHost = function(){};
WindowsScriptHost.prototype.toString = function(){
	return "Windows Script Host";
}
var WScript = new WindowsScriptHost();
WScript.CreateObject = function(type){
	honeybadger_log('ActiveX', '[CREATE] ' + type)
	ltype = type.toLowerCase();
	objects = {
		'wscript.shell': Shell,
		'winhttp.winhttprequest.5.1': HTTPRequest,
		'adodb.stream' : ADODBstream,
		'adodb.recordset' : ADODBrecordset,
		'scripting.filesystemobject': FileSystemObject,
		'msxml2.domdocument': DOMDocument,
		'microsoft.xmldom': XMLDOM,
		'msxml2.xmlhttp': HTTPRequest,
		'shockwaveflash.shockwaveflash': ShockwaveFlash
	}
	if (objects[ltype]){
		if (objects[type] == ActiveXObject)
			o = new ActiveXObject(ltype);
			delete(ltype);
			return o;
		o = new objects[ltype];
		delete(ltype);
		return o;
	}
	else {
		honeybadger_log('Honeybadger', 'Could not emulate ActiveX object ' + type);
		throw({ 
			description: "The value of property 'newActiveXObject' is null or undefined, not a Function object",
			message: "The value of property 'newActiveXObject' is null or undefined, not a Function object",
			name: "TypeError",
			number: -2146823281
		});
	}
}

WScript.Sleep = function(){
	honeybadger_wscript_sleep_count++;
	if (honeybadger_wscript_sleep_count == 100){
		console.log('Infinite loop detected')
		unique_urls = [];
		for (var i = 0; i < honeybadger_wscript_urls.length; i++){
			if (unique_urls.indexOf(honeybadger_wscript_urls[i]) == -1){
				unique_urls.push(honeybadger_wscript_urls[i]);
			}
		}
		for (var i = 0; i < unique_urls.length; i++){
			honeybadger_log('URL requested using WScript', unique_urls[i]);
		}
		window.close();
	}
	return
}

WScript.Echo = function(data){};
WScript.Quit = function(){};
WScript.Path = "C:\\Windows\\System32\\wscript.exe";


ActiveXObject = function(type){
	return WScript.CreateObject(type);
}

// Catch Errors
if (honeybadger_live){
	window.onerror = function(message, url, lineNumber) {
		honeybadger_log('Errors', lineNumber + ": " + message);
		return true;
	};
}

// Catch useragent checks
honeybadger_ua = window.navigator.userAgent
navigator.__defineGetter__('userAgent', function(){
	honeybadger_log('Alerts', 'Script checks the browser useragent')
    return honeybadger_ua
});

// Catch DOM manipulations
if (window.MutationObserver){

	var observer = new MutationObserver(function(mutations){
		mutations.forEach(function(mutation) {
			if (mutation.type == "childList"){
				for (i = 0; i < mutation.addedNodes.length; i++){
					if (honeybadger_collect_dom_objects.indexOf(mutation.addedNodes[i].nodeName) != -1){
						honeybadger_log("DOM changes - " +  mutation.addedNodes[i].nodeName.toLowerCase(),  mutation.addedNodes[i].outerHTML);
					}
				}
			}
		});
	});

	observer.observe(document, {
		subtree: true,
		attributes: true,
		childList: true
	});

}

honeybadger_Function = Function
Function = function (arg1, arg2){
	if (arg2 == undefined){
		honeybadger_log('Anonymous Functions', arg1);
		return honeybadger_Function(arg1);
	}
	honeybadger_log('Anonymous Functions', arg1 + ', ' + arg2);
	return honeybadger_Function(arg1, arg2);
}

Function.prototype = honeybadger_Function.prototype

// Override evals
eval = function(code){
	honeybadger_log("Eval", code);
	return Function.prototype.apply.call(
		honeybadger_eval, window, arguments
	);
}

// Override writes
document.writeln = document.write = function(code){
	honeybadger_log("Document Writes", code);
	return Function.prototype.apply.call(
		honeybadger_write, document, arguments
	);
}

// Snapshot environment variables
function snapshot(){
	var things = {};
	for (thing in window){
		things[thing] = window[thing];
	}
	delete thing
	return things
}

// Compare environment variables
function compareThings(things1, things2){

	var changes = [];
	for (thing in things2){
		if (things1[thing] == undefined && things2[thing] != null && thing != 'honeybadger_things'){
			changes.push(Array(thing, typeof(things2[thing]), things2[thing]));
		}
	}

	delete thing
	return changes
}

// Check for new strings after 5 seconds
if (honeybadger_live){
	window.setTimeout(function(){
		result = compareThings(honeybadger_things, snapshot());
		for (i in result){
			if (result[i][1] == 'string'){
				honeybadger_log('Variables', result[i][0] + ':' + honeybadger_base64_encode(result[i][2]));
			}
		}
	}, 5000);
}

// Don't want these going off!
alert = function(){}
confirm = function(){return true}
prompt = function(){return 'Honeybadger Rul3z!!!'}

honeybadger_things = snapshot();
