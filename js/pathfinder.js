var endpoints = {
	start:	{},
	goal:	{}
},
astar = function(map,start,goal,heuristic,cutCorners) {
	endpoints.start = start;
	endpoints.goal = goal;
	/*map[start.x][start.y].vacant = 'start';
	map[goal.x][goal.y].vacant = 'goal';*/
	var listOpen = [];
	var listClosed = [];
	var listPath = [];
	var nodeGoal = createTerminalNode(map, heuristic, 'goal', null);
	var nodeStart = createTerminalNode(map, heuristic, 'start', nodeGoal);
	addNodeToList(nodeStart, listOpen);
	
	var n;
	while (!isListEmpty(listOpen)) {
		n = returnNodeWithLowestFScore(listOpen);
		addNodeToList(n, listClosed);
		removeNodeFromList(n, listOpen);
		if (areNodesEqual(n, nodeGoal)) {
			pathTo(n, listPath);
			listPath.reverse();
			return listPath;
		}
		n.makeChildNodes(map, heuristic, cutCorners, nodeGoal);
		cullUnwantedNodes(n.childNodes, listOpen);
		cullUnwantedNodes(n.childNodes, listClosed);
		removeMatchingNodes(n.childNodes, listOpen);
		removeMatchingNodes(n.childNodes, listClosed);
		addListToList(n.childNodes, listOpen);
	}
	return null;
},

pathTo = function(n,listPath) {
	listPath.push(new NodeCoordinate(n.x,n.y));
	if (n.parentNode == null)
		return;
	pathTo(n.parentNode,listPath);
},

addListToList = function(listA, listB) {
	for (x in listA)
		listB.push(listA[x]);
},

removeMatchingNodes = function(listToCheck, listToClean) {
	var listToCheckLength = listToCheck.length;
	for (var i = 0; i < listToCheckLength; i++) {
		for (var j = 0; j < listToClean.length; j++) {
			if (listToClean[j].x == listToCheck[i].x && listToClean[j].y == listToCheck[i].y)
				listToClean.splice(j, 1);
		}
	}
},

cullUnwantedNodes = function(listToCull, listToCompare) {
	var listToCompareLength = listToCompare.length;
	for (var i = 0; i < listToCompareLength; i++) {
		for (var j = 0; j < listToCull.length; j++) {
			if (listToCull[j].x == listToCompare[i].x && listToCull[j].y == listToCompare[i].y) {
				if (listToCull[j].f >= listToCompare[i].f)
					listToCull.splice(j, 1);
			}
		}
	}
},

areNodesEqual = function(nodeA, nodeB) {
	if (nodeA.x == nodeB.x && nodeA.y == nodeB.y)
		return true;
	else
		return false;
},

returnNodeWithLowestFScore = function(list) {
	var lowestNode = list[0];
	for (x in list){
		lowestNode = (list[x].f < lowestNode.f) ? list[x] : lowestNode;
	}
	return lowestNode;
},

isListEmpty = function(list) {
	return (list.length < 1) ? true : false;
},

removeNodeFromList = function(node, list) {
	var listLength = list.length;
	for (var i = 0; i < listLength; i++) {
		if (node.x == list[i].x && node.y == list[i].y) {
			list.splice(i, 1);
			break;
		}
	}
},

addNodeToList = function(node, list) {
	list.push(node);
},

createTerminalNode = function(map, heuristic, nodeType, nodeGoal) {
	var row,col,
		mapRows = map.length,
		mapCols = map[0].length;
	for (row = 0; row < mapRows; row++) {
		for (col = 0; col < mapCols; col++) {
			if(
				endpoints[nodeType].x === row && endpoints[nodeType].y === col
			){
			//if(map[row][col].vacant == nodeType){
				return new Node(row, col, map, heuristic, null, nodeGoal);
			}
		}
	}
	return null;
},

returnHScore = function(node, heuristic, nodeGoal) {
	var y = Math.abs(node.x - nodeGoal.x);
	var x = Math.abs(node.y - nodeGoal.y);
	switch (heuristic) {
		case 'manhattan':
			return (y + x) * 10;
		case 'diagonal':
			return (x > y) ? (y * 14) + 10 * (x - y) : (x * 14) + 10 * (y - x);
		case 'euclidean':
			return Math.sqrt((x * x) + (y * y));
		default:
			return (y + x) * 10;
	}
},

NodeCoordinate = function(row, col) {
	this.x = row;
	this.y = col;
},

Node = function(row, col, map, heuristic, parentNode, nodeGoal) {
	var mapLength = map.length;
	var mapRowLength = map[0].length;
	this.x = row;
	this.y = col;
	this.northAmbit = (row == 0) ? 0 : row - 1;
	this.southAmbit = (row == mapLength - 1) ? mapLength - 1 : row + 1;
	this.westAmbit = (col == 0) ? 0 : col - 1;
	this.eastAmbit = (col == mapRowLength - 1) ? mapRowLength - 1 : col + 1;
	this.parentNode = parentNode;
	this.childNodes = [];

	if (parentNode != null) {
		if (row == parentNode.x || col == parentNode.y)
			this.g = parentNode.g + 10;
		else
			this.g = parentNode.g + 14;
		this.h = returnHScore(this, heuristic, nodeGoal);
	}
	else {
		this.g = 0;
		if (map[row][col].vacant == 'start')
			this.h = returnHScore(this, heuristic, nodeGoal);
		else
			this.h = 0;
	}
	this.f = this.g + this.h;
	
	this.makeChildNodes = function (map, heuristic, cutCorners, nodeGoal){
		for (var i = this.northAmbit; i <= this.southAmbit; i++){
			for (var j = this.westAmbit; j <= this.eastAmbit; j++){
				if (i != this.x || j != this.y){
					if(	//map[i][j].vacant !== false
						map[i][j].vacant !== false
					&&	map[i][j].vacant !== 'item'
					||	(
							i === nodeGoal.x
						&&	j === nodeGoal.y
						&&	map[i][j].vacant === 'item'
					)
					){
						if(cutCorners == true){
							this.childNodes.push(new Node(i, j, map, heuristic, this, nodeGoal));
						}else{
							if(i == this.x || j == this.y){
								this.childNodes.push(new Node(i, j, map, heuristic, this, nodeGoal));
							}
						}
					}
				}
			}
		}
	}
};

if(typeof window === 'undefined'){
	module.exports = astar;
}