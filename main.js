/*
TO DO:

- RESIZE IMAGE
- ADD COMMAND BLOCKS
- ADD MAPS
- BLOCK SELECTION
- MAPS TO SCHEMATICS
- MAPS TO IMAGES
- MAPS TO COMMAND BLOCKS
- SCHEMATICS TO IMAGES
- SCHEMATICS TO MAPS
*/

var blocksList = ["grass_block", "birch_planks", "redstone_block", "ice", "iron_block", "oak_leaves", "white_wool", "dirt", "cobblestone", "water", "oak_planks", "quartz_block", 
				"orange_wool", "magenta_wool", "light_blue_wool", "yellow_wool", "lime_wool", "pink_wool", "gray_wool", "light_gray_wool", "cyan_wool", "purple_wool", 
				"blue_wool", "brown_wool", "green_wool", "red_wool", "black_wool", "gold_block", "diamond_block", "lapis_block", "emerald_block", "netherrack"];
				
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

var blocks = [];

start();

function start() {
	var convertTo = readline.question("To what do you want to convert? (Commands (NOT YET IMPLEMENTED) / Schematic / Map (NOT YET IMPLEMENTED) / Materials): ").toLowerCase();
	if(convertTo != "commands" && convertTo != "schematic" && convertTo != "map" && convertTo != "materials") {
		clearConsole();
		console.log("ERROR: Invalid conversion.\n");
		start();
	} else {
		
		//We first check if the image exists and if the extension is valid. After that we get it's dimensions and if it's bigger than 128x128 we will resize.
		
		var fpath = readline.question("File path: ");
		if(fs.existsSync(fpath)) {
			var ext = path.extname(fpath);
			
			if(ext != ".png" && ext != ".jpeg") {
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
					} else {
						clearConsole();
						console.log("ERROR: Conversion method not yet implemented.\n");
						start();
					}
				})
				.catch(err => {
					clearConsole();
					console.log("ERROR: " + err);
				});
			} else {
				clearConsole();
				console.log("ERROR: Image has to be 128x128, will add resize later");
				start();
			}
			
		} else {
			clearConsole();
			console.log("ERROR: Invalid File Path.\n");
			start();
		}
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
	
	fs.writeFile("schematic.nbt", gzipped, function(err) {
		if(err) throw err;
		clearConsole();
		console.log("Schematic saved to file!");
	});		
}

function howManyBlocks(blocksNeeded) {
		fs.writeFile('materials.txt', JSON.stringify(blocksNeeded), function(err){
			if(err) throw err;
			console.log("Saved to file!");
		});
	
	clearConsole();
	console.log(blocksNeeded);
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