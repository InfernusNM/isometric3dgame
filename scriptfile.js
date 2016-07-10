(function() {
    var canvas = document.getElementById('world'),
        context = canvas.getContext('2d');

    window.addEventListener('resize', ResizeCanvas, false);

    function ResizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    ResizeCanvas();

    var tileHeight = 30,
        tileWidth = 60,
        mapOffsetX = 0,
        mapOffsetY = 0,
        mapSeed = 50,
        mapTileArray = [],
        mapUpdateRequired = true,
        mapPosOffsetX = 19,
        mapPosOffsetY = 0,
        mapRedraw = false;

    function DrawIsoTile(x, y, style) {
        context.save();
        context.translate((x - y) / 2 * tileWidth, (x + y) / 2 * tileHeight);
        
        context.strokeStyle = style;
        context.beginPath();
        context.moveTo(tileWidth / 2, 0);
        context.lineTo(tileWidth, tileHeight / 2);
        context.lineTo(tileWidth / 2, tileHeight);
        context.lineTo(0, tileHeight / 2);
        context.closePath();
        context.stroke();
        context.fillStyle = style;
        context.fill();

        context.restore();
    }

    function DrawIsoBlock(x, y, z, style) {      
        var translateX = (x - y) / 2 * tileWidth,
            translateY = (x + y) / 2 * tileHeight - (z * tileHeight) / 2;

        var vertices = [translateX + tileWidth / 2,
        translateX,
        translateY,
        translateX + tileWidth,
        translateY + tileHeight / 2,
        translateY + tileHeight,
        translateY + (z * tileHeight) / 2 + tileHeight / 2,
        translateY + (z * tileHeight) / 2 + tileHeight];

        context.strokeStyle = "#000000";
        context.beginPath();
        context.moveTo(vertices[0], vertices[2]);
        context.lineTo(vertices[3], vertices[4]);
        context.lineTo(vertices[0], vertices[5]);
        context.lineTo(vertices[1], vertices[4]);
        context.closePath();
        context.stroke();
        context.fillStyle = style;
        context.fill();

        context.beginPath();
        context.moveTo(vertices[1], vertices[4]);
        context.lineTo(vertices[1], vertices[6]);
        context.lineTo(vertices[0], vertices[7]);
        context.lineTo(vertices[0], vertices[5])

        context.closePath();
        context.fillStyle = "#AAAAAA";
        context.fill();

        context.beginPath();
        context.moveTo(vertices[0], vertices[5])
        context.lineTo(vertices[0], vertices[7])
        context.lineTo(vertices[3], vertices[6])
        context.lineTo(vertices[3], vertices[4])
        context.closePath();
        context.fillStyle = "#CCCCCC";
        context.fill();
    }

    function DrawIsoText(x, y, z, font, text) {
        context.font = font;
        context.textAlign = "center";
        context.fillText(text, (x - y) / 2 * tileWidth, (x + y) / 2 * tileHeight - (z * tileHeight) / 2)
    }

    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); }
    }

    var mouseTileX = 0,
        mouseTileY = 0;


    function IsometricProjectPoint(x, y) {
        return {"x":((x / tileWidth) + (y / tileHeight)), "y":(-(x / tileWidth) + (y / tileHeight))};
    }

    document.addEventListener("mousemove", function(e) {

        // Calculate the position of the mouse projected into
        //mouseTileY = (-(e.pageX/tileWidth) + (e.pageY/tileHeight));
        //mouseTileX = ((e.pageX/tileWidth) + (e.pageY/tileHeight));

        var mouseTile = IsometricProjectPoint(e.pageX, e.pageY)

        mouseTileX = mouseTile.x;
        mouseTileY = mouseTile.y;

        mapRedraw = true;

    });

    document.addEventListener("keypress", function(e) {
        var key = e.which || e.keyCode;
        switch(key) {
            case 119:
                mapOffsetX--;
                mapUpdateRequired = true;
                break;
            case 115:
                mapOffsetX++;
                mapUpdateRequired = true;
                break;
            case 97:
                mapOffsetY++;
                mapUpdateRequired = true;
                break;
            case 100:
                mapOffsetY--;
                mapUpdateRequired = true;
                break;
        }
    });

    function getDistSqr(x, y, tX, tY) {
        return (x - tX)*(x - tX) + (y - tY)*(y - tY);
    }

    function pointInTile(pX, pY, ptX, ptY) {

        x = (pX - pY) / 2 * tileWidth;
        y = (pX + pY) / 2 * tileHeight;
        tX = (ptX - ptY) / 2 * tileWidth;
        tY = (ptX + ptY) / 2 * tileHeight;

        if (x < tX || x > tX + tileWidth || y < tY || y > tY + tileHeight)
            return false;

        var perpDistSqrA = getDistSqr(tX + tileWidth / 2, 0, tX + tileWidth / 2, tileHeight);

        var a = getDistSqr(x, y, tX + tileWidth / 2, tY),
            b = getDistSqr(x, y, tX + tileWidth / 2, tY + tileHeight);

        if ((a < perpDistSqrA) && (b < perpDistSqrA))
            return true;

        var c = getDistSqr(x, y, tX, tY + tileHeight / 2),
            d = getDistSqr(x, y, tX + tileWidth, tY + tileHeight / 2);

        if ((c < perpDistSqrA) && (d < perpDistSqrA))
            return true;

        return false;
    }

    function generateTileArray(width, height, seed, offsetX, offsetY) {
        var tileArray = [];

        offsetX = offsetX || 0;
        offsetY = offsetY || 0;

        noise.seed(seed);
        for (var x = 0; x < width; x++) {
            tileArray.push([]);
            for (var y = 0; y < height; y++) {
                var height = (Math.floor(200 * Math.abs(noise.perlin2((x + offsetX) / 10, (y + offsetY) / 10))) + 50)


                var heightHexString = height.toString(16);
                if (height < 70) {
                    tileArray[x].push({"color":"#0000" + heightHexString, "height":height});
                }
                else if (height > 140) {
                    var heightHex = 
                    tileArray[x].push({"color":"#" + heightHexString + heightHexString + heightHexString, "height":height});
                }
                else {
                    tileArray[x].push({"color":"#00" + heightHexString + "00", "height":height});
                }
            }
        }
        return tileArray;
    }

    var lastCalledTime = new Date().getTime();

    function Draw() {

        if (mapUpdateRequired) {
            mapTileArray = generateTileArray(20, 20, mapSeed, mapOffsetX, mapOffsetY);
            mapUpdateRequired = false;
            mapRedraw = true;
        }

        if (mapRedraw) {
            var hoveredTileFound = false;
            mapRedraw = false;
            context.clearRect(0, 0, canvas.width, canvas.height);
            for (var x = 0; x < 20; x++) {
                for (var y = 0; y < 20; y++) {
                    var rnd = Math.random();
                    if (!hoveredTileFound && pointInTile(mouseTileX, mouseTileY, x + mapPosOffsetX, y + mapPosOffsetY)) {
                        hoveredTileFound = true;
                        DrawIsoTile(x + mapPosOffsetX, y + mapPosOffsetY, "red");
                    }
                    else {
                        DrawIsoBlock(x + mapPosOffsetX, y + mapPosOffsetY, mapTileArray[x][y].height / 200, mapTileArray[x][y].color);
                    }
                }
            }
        }

        window.requestAnimationFrame(Draw);
    }
    window.requestAnimationFrame(Draw);
})();