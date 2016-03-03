'use strict';

var mongo   = require('mongodb').MongoClient;
var express = require('express');
var path    = require('path');
var Imgur   = require('imgurjs');
var imgur   = new Imgur({
	clientId: 'd19c43080d4fa65',
	clientSecret: 'bc2ecab586657c7f806c590a639d73214110c3e3'
});

var app = express();
require('dotenv').load();

app.use(express.static(path.join(__dirname, 'htdocs')));

app.get('/imagesearch/:KEYWORDS', function(req, res) {
	var keywords = req.params.KEYWORDS.split(' ').join(' AND ');
	var offset   = req.query.offset;
	if(offset === undefined)
		offset = 1;
		
	// record query
	mongo.connect('mongodb://localhost:27017/fccimage', function(err, db) {
		if(err) throw err;
		var collection = db.collection('query');
		
		collection.insert({
			terms: keywords,
			when : getDateTime()
		}, function(err) {
			if (err) throw err;
			db.close();
		});
	});
	
	imgur.gallery.search({
		page: offset,
		q   : keywords
	}).then(function(data) {
		var arr = data.data;
		var newArr = [];
		var obj;
		// send only img url, description and page url
		arr.forEach(function(x) {
			obj = {
				id      : x.id,
				title   : x.title,
				link    : x.link,
			}
			newArr.push(obj);
		});
		if(newArr.length === 0) {
			newArr.push('No results.');
		}
		res.send(newArr);
	}).catch(function(error) {
		if(error) throw error;
	});
	
	function getDateTime() {
	
	    var date = new Date();
	
	    var hour = date.getHours();
	    hour = (hour < 10 ? "0" : "") + hour;
	
	    var min  = date.getMinutes();
	    min = (min < 10 ? "0" : "") + min;
	
	    var sec  = date.getSeconds();
	    sec = (sec < 10 ? "0" : "") + sec;
	
	    var year = date.getFullYear();
	
	    var month = date.getMonth() + 1;
	    month = (month < 10 ? "0" : "") + month;
	
	    var day  = date.getDate();
	    day = (day < 10 ? "0" : "") + day;
	
	    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
	
	}
});

app.get('/api/latest/imagesearch', function(req, res) {
	mongo.connect('mongodb://localhost:27017/fccimage', function(err, db) {
		if(err) throw err;
		var collection = db.collection('query');
		
		collection.find({}, {
			_id  : 0,
			terms: 1,
			when : 1
		}).toArray(function(err, docs) {
			if(err) throw err;
			res.send(docs);
			db.close();
		});
	});
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});