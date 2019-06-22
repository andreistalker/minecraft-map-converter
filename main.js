/*
TO DO:

- ADD COMMAND BLOCKS
- BLOCK SELECTION
- IMAGES TO VERTICAL SCHEMATICS
- MAPS TO SCHEMATICS
- MAPS TO IMAGES
- MAPS TO COMMAND BLOCKS
- SCHEMATICS TO IMAGES
- SCHEMATICS TO MAPS
*/


var blocksList = {
				"grass_block": 1, "birch_planks": 2, "redstone_block": 4, "ice": 5, "iron_block": 6, "oak_leaves": 7, "white_wool": 8, "dirt": 10, "cobblestone": 11,
				"water": 12, "oak_planks": 13, "quartz_block": 14, "orange_wool": 15, "magenta_wool": 16, "light_blue_wool": 17, "yellow_wool": 18, "lime_wool": 19,
				"pink_wool": 20, "gray_wool": 21, "light_gray_wool": 22, "cyan_wool": 23, "purple_wool": 24, "blue_wool": 25, "brown_wool": 26, "green_wool": 27,
				"red_wool": 28, "black_wool": 29, "gold_block": 30, "diamond_block": 31, "lapis_block": 32, "emerald_block": 33, "netherrack": 35};
				
var colors = {
	grass_block: "#7fb238",
	birch_planks: "#f7e9a3",
	redstone_block: "#f00",
	ice: "#a0a0ff",
	iron_block: "#a7a7a7",
	oak_leaves: "#007c00",
	white_wool: "#ffffff",
	dirt: "#976d4d",
	cobblestone: "#707070",
	water: "#4040ff",
	oak_planks: "#8f7748",
	quartz_block: "#fffcf5",
	orange_wool: "#d87f33",
	magenta_wool: "#b24cd8",
	light_blue_wool: "#6699d8",
	yellow_wool: "#e5e533",
	lime_wool: "#7fcc19",
	pink_wool: "#f27fa5",
	gray_wool: "#4c4c4c",
	light_gray_wool: "#999999",
	cyan_wool: "#4c7f99",
	purple_wool: "#7f3fb2",
	blue_wool: "#334cb2",
	brown_wool: "#664c33",
	green_wool: "#667f33",
	red_wool: "#993333",
	black_wool: "#191919",
	gold_block: "#faee4d",
	diamond_block: "#5cdbd5",
	lapis_block: "#4a80ff",
	emerald_block: "#00d93a",
	netherrack: "#700200"
}

const readline = require('readline-sync');
const jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const color = require('nearest-color').from(colors);
const imgsize = require('image-size');
const rgbHex = require('rgb-hex');
const nbt = require('nbt');
const pako = require('pako');
const nbtt = require('node-nbt');
const TAG = require('node-nbt').TAG;

var blocks = [];
var convertTo = "";
var fpath = "";

start();

function start() {
	convertTo = readline.question("To what do you want to convert? (Commands (NOT YET IMPLEMENTED) / Schematic / Map / Materials): ").toLowerCase();
	if(convertTo != "commands" && convertTo != "schematic" && convertTo != "map" && convertTo != "materials") {
		clearConsole();
		console.log("ERROR: Invalid conversion.\n");
		start();
	} else {
		
		//We first check if the image exists and if the extension is valid. After that we get it's dimensions and if it's bigger than 128x128 we will resize.
		
		fpath = readline.question("File path: ");
		if(fs.existsSync(fpath)) {
			var ext = path.extname(fpath);
			
			if(ext != ".png" && ext != ".jpeg" && ext != ".jpg") {
				clearConsole();
				console.log("ERROR: Invalid image extension. Valid extensions: PNG/JPEG");
				start();
			}
			
			var dimensions = imgsize(fpath);
			
			if(dimensions.width == 128 && dimensions.height == 128) {
				//We will analyze each pixel and convert it to the minecraft block. Then will add it to the conversion type.
				jimp.read(fpath).then(image => {
					for(var i = 0; i<=127; i++) {
						var col = [];
						for(var j = 0; j<=127; j++) {
							//We first get the pixel, then we convert it to RGBA, then RGBA to HEX, then we analyze it and choose the closest minecraft block to it.
							col.push(color(rgbaToCSS(jimp.intToRGBA(image.getPixelColor(i, j)))).name);
						}
							blocks.push(col);	
					}
						
					createBlocksArray();
				})
				.catch(err => {
					clearConsole();
					console.log("ERROR: " + err);
				});
			} else {
				var wantResize = readline.question("Image is not 128x128 pixels. Do you want to resize? (Y/N)").toLowerCase();
				if(wantResize == "y") {
					jimp.read(fpath).then(image => {
						image.resize(128, 128);
						
						for(var i = 0; i<=127; i++) {
							var col = [];
							for(var j = 0; j<=127; j++) {
								//We first get the pixel, then we convert it to RGBA, then RGBA to HEX, then we analyze it and choose the closest minecraft block to it.
								col.push(color(rgbaToCSS(jimp.intToRGBA(image.getPixelColor(i, j)))).name);
							}
								blocks.push(col);	
						}
						createBlocksArray();
						
					})
					.catch(err => {
						clearConsole();
						console.log("ERROR: " + err);
					});
					
				} else {
					clearConsole();
					console.log("ERROR: File has not been resized. Please use a 128x128 image or resize it.");
					start();
				}
			}
			
		} else {
			clearConsole();
			console.log("ERROR: Invalid File Path.\n");
			start();
		}
	}
}

function createBlocksArray() {
	var blocksNeeded = {};
	
	for(var i = 0; i<128; i++) {
		for(var j = 0; j<128; j++) {
			if(typeof blocksNeeded[blocks[i][j]] == "undefined") {
				blocksNeeded[blocks[i][j]] = 1;
			} else {
				blocksNeeded[blocks[i][j]]++;
			}
		}
	}
	
	if(convertTo == "materials") {
		howManyBlocks(blocksNeeded);
	} else if(convertTo == "schematic") {
		toSchematics(blocksNeeded);
	} else if(convertTo == "map") {
		convertToMap();
	} else {
		clearConsole();
		console.log("ERROR: Conversion method not yet implemented.\n");
		start();
	}
}

function toSchematics(blocksNeeded) {
	var palette = [];
	var newBlocks = [];
	var size = [128, 256, 128];
	var entities = [];
	
	for(var i = 0; i < Object.keys(blocksNeeded).length; i++) {
		var toPush = {"Name": "minecraft:" + Object.keys(blocksNeeded)[i]};
		palette.push(toPush);
	}
	
	for(var i = 0; i<128; i++) {
		for(var j = 0; j<128; j++) {
			var blockid = 0;
			
			for(var k = 0; k<palette.length; k++) {
				if(palette[k].Name.substr(10, palette[k].Name.length) == blocks[i][j]) {
					blockid = k;
					break;
				}
			}
			
			newBlocks.push({"pos": [i, 0, j],
							"state": blockid
			});
		}
	}
	
	
	var jsonstring = "{\"name\":\"\",\"value\":{\"blocks\":{\"type\":\"list\",\"value\":{\"type\":\"compound\",\"value\":[";
    newBlocks.forEach(function(r) {
        jsonstring += "{\"pos\":{\"type\":\"list\",\"value\":{\"type\":\"int\",\"value\":[" + r["pos"][0] + "," + r["pos"][1] + "," + r["pos"][2] + "]}},\"state\":{\"type\":\"int\",\"value\":" + r["state"] + "}},";
    });
	jsonstring = jsonstring.slice(0, -1);
	jsonstring += "]}},\"entities\":{\"type\":\"list\",\"value\":{\"type\":\"compound\",\"value\":[]}},\"palette\":{\"type\":\"list\",\"value\":{\"type\":\"compound\",\"value\":[";
    palette.forEach(function(r) {
            jsonstring += "{\"Name\":{\"type\":\"string\",\"value\":\"" + r["Name"] + "\"}},";
    });	
	jsonstring = jsonstring.slice(0, -1) + "]}},\"size\":{\"type\":\"list\",\"value\":{\"type\":\"int\",\"value\":[" + 128 + "," + 100 + "," + 129 + "]}},\"author\":{\"type\":\"string\",\"value\":\"andreistalker\"},\"DataVersion\":{\"type\":\"int\",\"value\":1.14}}}";
		
	var nbtnew = nbt.writeUncompressed(JSON.parse(jsonstring));
	var gzipped = pako.gzip(nbtnew);
	
	fs.writeFile(path.basename(fpath, path.extname(fpath)) + "-schematic.nbt", gzipped, function(err) {
		if(err) throw err;
		clearConsole();
		console.log("Schematic saved to file!");
	});		
}

function convertToMap() {
	var data = [];
	for(var i = 0; i<128; i++) {
		for(var j = 0; j<128; j++) {
			var coloring = blocksList[blocks[i][j]] * 4;
			
			if(coloring > 127)
				coloring = coloring - 256;
			
			data[i + j * 128] = "0x" + coloring.toString(16).toUpperCase();
		}
	}
	
	var mapfile = {
		type: TAG.COMPOUND,
		name: '',
		val: [
			{
				name: 'data',
				type: TAG.COMPOUND,
				val: [
					{
						name: 'scale',
						type: TAG.BYTE,
						val: 0
					},
					{
						name: 'dimension',
						type: TAG.BYTE,
						val: 0
					},
					{
						name: 'trackingPosition',
						type: TAG.BYTE,
						val: 0
					},
					{
						name: 'locked',
						type: TAG.BYTE,
						val: 1
					}, 
					{
						name: 'height',
						type: TAG.SHORT,
						val: 128
					},
					{
						name: 'width',
						type: TAG.SHORT,
						val: 128
					}, 
					{
						name: 'xCenter',
						type: TAG.INT,
						val: 0
					},
					{
						name: 'zCenter',
						type: TAG.INT,
						val: 0
					},
					{
						name: 'colors',
						type: TAG.BYTEARRAY,
						val: Buffer.from(data)
					}
				]
			}
		]
	};
	
	
	var nbtdata = nbtt.NbtWriter.writeTag(mapfile);
	
	var gzipped = pako.gzip(nbtdata);
	
	fs.writeFile("map_0.dat", gzipped, function(err) {
		if(err) throw err;
		clearConsole();
		console.log("Map saved to file!");
	});
}

function howManyBlocks(blocksNeeded) {
	var blocksNeededString = "";
	
	blocksNeeded = sortBlocks(blocksNeeded);
	
	Object.entries(blocksNeeded).forEach(([key, value]) => {
		var stacks = Math.floor(value/64);
		var remainder = value%64;
		
		if(stacks == 0)
			var next = "";
		else if(remainder == 0)
			var next = " - " + stacks + " stacks - ";
		else
			var next = " - " + stacks + " stacks and " + remainder + " - "
		
		var chests = stacks/53;
		
		chests = Math.round(chests * 100) / 100;
		
		if(chests)
			blocksNeededString = blocksNeededString + "\n" + key + " - " + value + next + chests + " double chests";
		else
			blocksNeededString = blocksNeededString + "\n" + key + " - " + value + next;
	});
	
	fs.writeFile('materials-' + path.basename(fpath, path.extname(fpath)) + '.txt', blocksNeededString, function(err){
		if(err) throw err;
		console.log("Saved to file!");
	});
	
	clearConsole();
	console.log(blocksNeededString);
	console.log();
}

function sortBlocks(blocksNeeded) {
	var sorting = [];
	
	Object.entries(blocksNeeded).forEach(([key, value]) => {
		sorting.push([key, value]);
	});
	
	sorting.sort(function(a, b){
		return b[1]-a[1];
	});
	
	blocksNeeded = {};
	
	for(var i = 0; i<sorting.length; i++) {
		blocksNeeded[sorting[i][0]] = sorting[i][1];
	}
	
	return blocksNeeded;
}

function rgbaToCSS(color) {
	return "#" + rgbHex(color.r, color.g, color.b);
}

function clearConsole() {
	var lines = process.stdout.getWindowSize()[1];
		for(var i = 0; i < lines; i++) {
			console.log('\r\n');
		}
}

//CREDITS TO https://github.com/rebane2001/mapartcraft -- I've his/her code for the schematic generation function.