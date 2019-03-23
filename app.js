//Initialize express
const express = require('express');
const app = express();

//Initialize fs
const fs = require('fs');

//Initialize brain.js
const brain = require('brain.js');

//Set the port to 3000
const port = 3000;

//Define r, g, b
var r;
var g;
var b;

//Define first write
var firstWrite = true;

//Have we trained yet
var trainedYet = false;

// provide optional config object (or undefined). Defaults shown.
const config = {
	binaryThresh: 0.5,
    hiddenLayers: [3],
    activation: 'sigmoid',
    leakyReluAlpha: 0.01
};

//Create the nerual network
var net = new brain.NeuralNetwork(config);

//Runs when a clint goes to /
app.get('/', (req, res) => {
	//Get the contents of index.html
	var text = fs.readFileSync('index.html').toString();

	//Send the contents of index.html to the client
	res.write(text);

	//Pick a random number from 0 to 255 for the red, green, and blue colors
	r = random(255);
	g = random(255);
	b = random(255);

	if (!trainedYet) {
		//Pick 0 or 255 for the text color
		var textColor = random(1) * 255;
	}else {
		var textColor = predict(r, g, b);
	}

	//Convert from the textColor in text to a number if we have trained the nerual network at least once
	if (textColor == "dark" && trainedYet == true) {
		textColor = 1;
	}else if (trainedYet == true) { 
		textColor = 0;
	}

	//Log the textColor
	console.log("\nText color is: " + textColor.toString());

	//Send the colors to the client
	res.write('<script id="remove" type="text/javascript">r = ' + r + ';g = ' + g + ';b = ' + b + ';textColor=' + textColor + ';hasColors = true;document.getElementById("remove").outerHTML = "";</script>');

	//End the connection
	res.end();

	//Log the color values
	console.log("Red is: " + r);
	console.log("Green is: " + g);
	console.log("Blue is: " + b);
});

//Runs when a clint goes to /
app.get('/thankYou', (req, res) => {
	//Get the contents of thankYou.html
	var text = fs.readFileSync('thankYou.html').toString();

	//Send the contents of thankYou.html to the client
	res.write(text);

	//End the connection
	res.end();

	//If the nerual network did good then set good to true otherwise set good to false
	if (req.query.yes != undefined) {
		var good = true;
	}else {
		var good = false;
	}

	//Train the nerual network
	train(r, g, b, req.query.textColor, good);
});

//Runs when a clint goes to /
/*app.get('/thankYou.html', (req, res) => {
	//Get the contents of thankYou.html
	var text = fs.readFileSync('tshankYou.html').toString();

	//Send the contents of thankYou.html to the client
	res.write(text);

	//End the connection
	res.end();

	//Set the r, g, b values
	var r = req.query.r;
	var g = req.query.g;
	var b = req.query.b;

	//Log the color values
	console.log("59 Red is: " + r);
	console.log("60 Green is: " + g);
	console.log("61 Blue is: " + b);
});*/

function train(tr, tg, tb, textColor, good) {
	var r = tr / 255;
	var g = tg / 255;
	var b = tb / 255;

	//Flip the values
	if (textColor == 0) {
		textColor = 1;
	}else {
		textColor = 0;
	}

	//If the nerual network disnt guess right and the text color is black then fix it and if the text color is white and the nerual network is wrong than fix it
	if (!good && textColor == 0) {
		textColor = 1;
	}else if (!good) {
		textColor = 0;
	}

	//Add a comma if this isnt our first write
	if (!firstWrite) {
		//Add a comma
		var tempData = ",\n";

		//Add our comma to our dataset
		fs.appendFileSync('./dataSet.json', tempData);
	}else {
		//Set firstWrite to false
		firstWrite = false;
	}

	//Make our JSON to add to the dataset
	const jsonToAdd = {input: {r, g, b}, output: {dark: textColor}};

	//Make the JSON a string and add the nding square bracket
	var data = JSON.stringify(jsonToAdd);

	//Add our json data to our dataset
	fs.appendFileSync('./dataSet.json', data);

	//Get the contents of dataSet.json in a string
	var dataSet = JSON.parse("[" + fs.readFileSync('dataSet.json').toString() + "]");

	//Train the nerual network
	net.train(dataSet);
}

function predict(tr, tg, tb) {
	var r = tr / 255;
	var g = tg / 255;
	var b = tb / 255;
	var rgb = r + r + g + g + b + b;
	const result = brain.likely(rgb, net)
	//var output = net.run({r: r, g: g, b: b})
	return result;
}

function random(input) {
	return Math.floor(Math.random() * (input + 1));
}

//Start listening on port 3000
app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`);
});