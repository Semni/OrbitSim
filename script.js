class Orbit{
    constructor(e, a, i, O, w, t0, M0, R, mu, name, colour){
        this.e = e;
        this.a = a;
        this.i = i;
        this.O = O;
        this.w = w;
        this.t0 = t0;
        this.M0 = M0;
        this.R = R;
        this.mu = mu;
        this.name = name;
        this.colour = colour;
    }
}

class Track{
    constructor(x, y, vx, vy, name, size, colour, mass, points, manoeuvres){
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.name = name;
        this.size = size;
        this.colour = colour;
        this.mass = mass;
        this.points = points;
        this.manoeuvres = manoeuvres;
    }
}

class Point{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}

class Manoeuvre{
    constructor(t, vp, vt, track){
        this.t = t;
        this.vp = vp;
        this.vt = vt;
        this.track = track;
    }
}

const canvas = document.querySelector(".myCanvas");
const ctx = canvas.getContext("2d");
const width = (canvas.width = window.innerWidth);
const height = (canvas.height = window.innerHeight);
ctx.translate(width / 2, height / 2);

var simLength = 1440;
const G = 6.67430e-11

var timestep = 60
var scale = 0.05e-3

const selectionRadius = 10;

const mu = G * 9.45996e24;
const R = 14951e3 / 2;

var deltaTi = 0;
const deltaTime = [60, 600, 3600, 86400];
const deltaTimeText = ["1MIN", "10MIN", "1HR", "1DAY"];

var deltaVi = 0;
const deltaV = [1, 10, 100, 1000];
const deltaVtext = ["1m/s", "10m/s", "100m/s", "1km/s"];

const elementWidth = 64;
const elementHeight = 16;
const elementSpacing = 16

var moons = [new Orbit(0.02, 416490e3, 0, 0, 0, 0, 0, 332e3 / 2, G * 1.06e20, "Delta", "rgb(200 200 200)")];

var tracks = [];
let vectors = kep_2_cart(0, R + 600e3, 0, 0, 0, 0, 0, 0);
tracks.push(new Track(vectors[0][0], vectors[0][1], vectors[1][0], vectors[1][1], "1st Squadron", -1, "orange", 0, [], []));

//Selected object
var selectedObject = null;

//Reference frame
var refFrame = null;

var targetObject = null;

//Pan offset
var panOff = new Point(0, 0);

//Calculate tracks
let trackPoints = [];

//Calculate closest approach
let trackA = null; //tracks[0];
let trackB = null; //tracks[1];
let distanceMinimum = Number.MAX_VALUE;
let idMAX = -1;

//Add UI Elements
var elements = [];
addBasicElements();

calcTrack();
//calcMinimum();
draw();

//Handle selection
canvas.addEventListener('click', function(event) {
    let stop = false;
    //Get the reference frame points
    var rPoint = getPoint(refFrame, 0)
    
    let x = event.x - width / 2;
    let y = event.y - height / 2;
    let s = R * scale + selectionRadius;


    elements.forEach(function(element) {
        if(y > element.top && y < element.top + element.height
            && x > element.left && x < element.left + element.width) {
                element.function(element);
                draw();
                stop = true;
                return;
        }
    });
    if(stop) return;

    x -= panOff.x;
    y -= panOff.y;
    selectedObject = null;

    //Select simulated objects
    tracks.forEach(function(element) {
        let s = element.size * scale + selectionRadius;
        if(Math.abs((element.x - rPoint.x) * scale - x) <= s && Math.abs((element.y - rPoint.y) * scale - y) <= s){
            selectedObject = element;
            draw();
            stop = true;
            return;
        };
        element.manoeuvres.forEach(function(mElement){
            var l = Math.floor(mElement.t / timestep);
            let point = getPoint(refFrame, l);
            if(Math.abs((element.points[l].x - point.x) * scale - x) <= s && Math.abs((element.points[l].y - point.y) * scale - y) <= s){
                selectedObject = mElement;
                draw();
                stop = true;
                return;
            };
        });
    });
    if(stop) return;

    //Select orbiting objects
    moons.forEach(function(element) {
        let s = element.R * scale + selectionRadius;
        let mVec = kep_2_cart(element.e, element.a, element.i, element.O, element.w, 0, element.t0, element.M0);
        if(Math.abs((mVec[0][0] - rPoint.x) * scale - x) <= s && Math.abs((mVec[0][1] - rPoint.y) * scale - y) <= s){
            selectedObject = element;
            draw();
            stop = true;
            return;
        }
    });
    if(stop) return;

    //Select main planet
    if(Math.abs(x + (rPoint.x * scale)) <= s && Math.abs(y + (rPoint.y * scale)) <= s){
        selectedObject = "Gynes";
        draw();
        stop = true;
        return;
    };
    if(stop) return;

    draw();
}, false);

function calcTrack(){
    for (let i = 0; i < tracks.length; i++){
        var x = tracks[i].x;
        var y = tracks[i].y;
        var vx = tracks[i].vx;
        var vy = tracks[i].vy;
        for (let j = 0; j < simLength; j++) {
            tracks[i].points[j] = new Point(x, y);

            var d = Math.hypot(x, y);

            var xAcc = -x / d;
            var yAcc = -y / d;

            var a = mu / (d**2);

            vx += xAcc * a * timestep;
            vy += yAcc * a * timestep;

            moons.forEach(function(moon) {
                var mVec = kep_2_cart(moon.e, moon.a, moon.i, moon.O, moon.w, j*timestep, moon.t0, moon.M0);

                var mx = mVec[0][0];
                var my = mVec[0][1];

                d = Math.hypot(x - mx, y - my);
                
                xAcc = (mx - x) / d;
                yAcc = (my - y) / d;

                a = moon.mu / (d**2);

                vx += xAcc * a * timestep;
                vy += yAcc * a * timestep;
            });

            for (let k = 0; k < tracks[i].manoeuvres.length; k++){
                if(Math.floor(tracks[i].manoeuvres[k].t / timestep) == j){
                    var dist = Math.hypot(vx, vy);

                    var vxn = vx / dist;
                    var vyn = vy / dist;

                    vx += vxn * tracks[i].manoeuvres[k].vp;
                    vy += vyn * tracks[i].manoeuvres[k].vp;
                }
            }

            x += vx * timestep;
            y += vy * timestep;
        }
    };
}

function calcMinimum(){
    //Calculate Point of closest approach.
    distanceMinimum = Number.MAX_VALUE;
    idMAX = -1;
    
    for (let i = 0; i < simLength; i++){
        let dx = selectedObject.points[i].x - targetObject.points[i].x;
        let dy = selectedObject.points[i].y - targetObject.points[i].y;
        let distance = Math.hypot(dx, dy);

        if(distance < distanceMinimum){
            distanceMinimum = distance;
            idMAX = i;
        }
    }
};

function draw(){
    ctx.textAlign = "left";
    ctx.fillStyle = "rgb(0 0 0)";
    ctx.fillRect(-(width / 2), -(height / 2), width, height);

    //Display time period of track
    ctx.fillStyle = "white";
    ctx.font = "16px Consolas";
    ctx.fillText("Track Time Period: " + displayTime(simLength * timestep), -(width / 2) + 10, -(height / 2) + 20);
    ctx.fillText("Scale: " + round(1e-3 / scale) + "km/px", -(width / 2) + 10, -(height / 2) + 20 + 16);

    //Get the reference frame points
    var rPoint = getPoint(refFrame, 0);

    //Draw Planet
    ctx.fillStyle = "rgb(200 200 200)";
    ctx.beginPath();
    ctx.arc(panOff.x - rPoint.x * scale, panOff.y - rPoint.y * scale, Math.max(R * scale, 3), degToRad(0), degToRad(360), false);
    ctx.fill()

    //Draw Moons
    moons.forEach(function(moon) {
        let mVec = kep_2_cart(moon.e, moon.a, moon.i, moon.O, moon.w, 0, moon.t0, moon.M0);

        //Add point
        ctx.fillStyle = moon.colour;
        ctx.beginPath();
        ctx.arc(panOff.x + (mVec[0][0] - rPoint.x) * scale, panOff.y + (mVec[0][1] - rPoint.y) * scale, Math.max(moon.R * scale, 3), degToRad(0), degToRad(360), false);
        ctx.fill()

        //Draw orbit track
        ctx.strokeStyle = "rgb(255 255 255 / 80%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        
        ctx.moveTo(panOff.x + (mVec[0][0] - rPoint.x) * scale, panOff.y + (mVec[0][1] - rPoint.y) * scale);
        for (let j = 0; j < simLength; j++) {
            mVec = kep_2_cart(moon.e, moon.a, moon.i, moon.O, moon.w, j * timestep, moon.t0, moon.M0);
            let point = getPoint(refFrame, j);
            ctx.lineTo(panOff.x + (mVec[0][0] - point.x) * scale, panOff.y + (mVec[0][1] - point.y) * scale);
        }
        ctx.stroke();
    });

    //Draw simulated track
    for (let i = 0; i < tracks.length; i++) {
        //Draw trajectory track
        ctx.strokeStyle = "rgb(255 255 255 / 80%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(panOff.x + (tracks[i].x - rPoint.x) * scale, panOff.y + (tracks[i].y - rPoint.y) * scale);
        for (let j = 0; j < simLength; j++) {
            let point = getPoint(refFrame, j);
            ctx.lineTo(panOff.x + (tracks[i].points[j].x - point.x) * scale, panOff.y + (tracks[i].points[j].y - point.y) * scale);
        }
        ctx.stroke();
        
        //Add name
        ctx.fillStyle = "white";
        ctx.font = "16px Consolas";
        ctx.fillText(tracks[i].name, panOff.x + ((tracks[i].x - rPoint.x) + tracks[i].size) * scale + 10, panOff.y + (tracks[i].y - rPoint.y) * scale);

        //Add point
        ctx.fillStyle = tracks[i].colour;
        ctx.beginPath();
        ctx.arc(panOff.x + (tracks[i].x - rPoint.x) * scale, panOff.y + (tracks[i].y - rPoint.y) * scale, Math.max(tracks[i].size * scale, 3), degToRad(0), degToRad(360), false);
        ctx.fill()

        //Add manoeuvres
        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        for (let j = 0; j < tracks[i].manoeuvres.length; j++) {
            ctx.beginPath();
            let l = Math.floor(tracks[i].manoeuvres[j].t / timestep);
            let point = getPoint(refFrame, l);
            let x = panOff.x + (tracks[i].points[l].x - point.x) * scale;
            let y = panOff.y + (tracks[i].points[l].y - point.y) * scale;

            ctx.arc(x, y, 5, degToRad(0), degToRad(360), false);
            ctx.stroke();
        }
    }

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();

    //Add selection
    if(selectedObject instanceof Track){
        let x = panOff.x + (selectedObject.x - rPoint.x) * scale;
        let y = panOff.y + (selectedObject.y - rPoint.y) * scale;
        let r = selectedObject.size * scale + 8;
        ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.stroke();

        //Display selected item info
        ctx.fillStyle = "white";
        ctx.font = "16px Consolas";
        ctx.fillText("Track " + selectedObject.name, -(width / 2) + 10, -(height / 2) + 20 + 16 * 3);
    }
    else if(selectedObject instanceof Orbit){
        let mVec = kep_2_cart(selectedObject.e, selectedObject.a, selectedObject.i, selectedObject.O, selectedObject.w, 0, selectedObject.t0, selectedObject.M0);

        let x = panOff.x + (mVec[0][0] - rPoint.x) * scale;
        let y = panOff.y + (mVec[0][1] - rPoint.y) * scale;
        let r = selectedObject.R * scale + 8;
        ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.stroke();

        //Display selected item info
        ctx.fillStyle = "white";
        ctx.font = "16px Consolas";
        ctx.fillText("Moon " + selectedObject.name, -(width / 2) + 10, -(height / 2) + 20 + 16 * 3);
    }
    else if(selectedObject instanceof Manoeuvre){
        let l = Math.floor(selectedObject.t / timestep);
        let point = getPoint(refFrame, l);
        let x = panOff.x + (selectedObject.track.points[l].x - point.x) * scale;
        let y = panOff.y + (selectedObject.track.points[l].y - point.y) * scale;
        ctx.arc(x, y, 10, degToRad(0), degToRad(360), false);
        ctx.stroke();

        //Display selected item info
        ctx.fillStyle = "white";
        ctx.font = "16px Consolas";
        ctx.fillText("Manoeuvre", -(width / 2) + 10, -(height / 2) + 20 + 16 * 3);
        ctx.fillText("Track: " + selectedObject.track.name, -(width / 2) + 10, -(height / 2) + 20 + 16 * 4);
        ctx.fillText("T+ " + displayTime(selectedObject.t), -(width / 2) + 10, -(height / 2) + 20 + 16 * 5);
        ctx.fillText("ΔV " + round(Math.hypot(selectedObject.vp, selectedObject.vt)) + "m/s", -(width / 2) + 10, -(height / 2) + 20 + 16 * 6);
        ctx.fillText("ΔVp " + selectedObject.vp + "m/s", -(width / 2) + 10, -(height / 2) + 20 + 16 * 7);
        ctx.fillText("ΔVt " + selectedObject.vt + "m/s", -(width / 2) + 10, -(height / 2) + 20 + 16 * 8);
    }
    else if(typeof selectedObject == 'string'){
        let x = panOff.x - rPoint.x * scale;
        let y = panOff.y - rPoint.y * scale;
        let r = R * scale + 8;
        ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.stroke();
        
        ctx.fillStyle = "white";
        ctx.font = "16px Consolas";
        ctx.fillText("Planet " + selectedObject, -(width / 2) + 10, -(height / 2) + 20 + 16 * 3);
    }

    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();

    //Add target
    if(targetObject instanceof Track){
        let x = panOff.x + (targetObject.x - rPoint.x) * scale;
        let y = panOff.y + (targetObject.y - rPoint.y) * scale;
        let r = targetObject.size * scale + 8;
        ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.stroke();
    }
    else if(targetObject instanceof Orbit){
        let mVec = kep_2_cart(targetObject.e, targetObject.a, targetObject.i, targetObject.O, targetObject.w, 0, targetObject.t0, targetObject.M0);

        let x = panOff.x + (mVec[0][0] - rPoint.x) * scale;
        let y = panOff.y + (mVec[0][1] - rPoint.y) * scale;
        let r = targetObject.R * scale + 8;
        ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.stroke();
    }
    else if(targetObject instanceof Manoeuvre){
        let l = Math.floor(targetObject.t / timestep);
        let point = getPoint(refFrame, l);
        let x = panOff.x + (targetObject.track.points[l].x - point.x) * scale;
        let y = panOff.y + (targetObject.track.points[l].y - point.y) * scale;
        ctx.arc(x, y, 10, degToRad(0), degToRad(360), false);
        ctx.stroke();
    }
    else if(typeof targetObject == 'string'){
        let x = panOff.x - rPoint.x * scale;
        let y = panOff.y - rPoint.y * scale;
        let r = R * scale + 8;
        ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.stroke();
    }

    if(idMAX != -1){
        //Draw point of closest approach.
        let point = getPoint(refFrame, idMAX);

        ctx.strokeStyle = "rgb(255 0 0 / 80%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(panOff.x + trackA.points[idMAX].x * scale - point.x * scale, panOff.y + trackA.points[idMAX].y * scale - point.y * scale);
        ctx.lineTo(panOff.x + trackB.points[idMAX].x * scale - point.x * scale, panOff.y + trackB.points[idMAX].y * scale - point.y * scale);
        ctx.stroke();

        let trk = trackA;
        if(trk == refFrame){
            trk = trackB;
        }
        ctx.fillStyle = "red";
        ctx.font = "16px Consolas";
        ctx.fillText("Closest approach: T+" + displayTime(idMAX * timestep), panOff.x + trk.points[idMAX].x * scale - point.x * scale + 10, panOff.y + trk.points[idMAX].y * scale - point.y * scale);
        ctx.fillText(Math.floor(distanceMinimum / 1000) + " Km", panOff.x + trk.points[idMAX].x * scale - point.x * scale + 10, panOff.y + trk.points[idMAX].y * scale - point.y * scale + 16);
    };

    //Render UI elements
    elements.forEach(function(element) {
        ctx.fillStyle = "black";
        ctx.fillRect(element.left, element.top, element.width, element.height);
        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(element.left, element.top, element.width, element.height);
        ctx.fillStyle = "white";
        ctx.font = "16px Consolas";
        ctx.textAlign = "center";
        ctx.fillText(element.text, element.left + element.width / 2, element.top + 13);
    });
};

function degToRad(degrees){
    return(degrees * Math.PI) / 180;
};

function round(x){
    return Math.round(x * 100) / 100;
};

function displayTime(t){
    if(t < 3600){
        return new Date(t * 1000).toISOString().substring(14,19);
    }
    else if(t < 86400){
        return new Date(t * 1000).toISOString().substring(11,19);
    }
    else{
        let days = 0
        while(t >= 86400){
            days++;
            t -= 86400;
        }
        return days + "D " + new Date(t * 1000).toISOString().substring(11,19);
    }
};

function getPoint(obj, i){
    if(obj instanceof Track){
        return obj.points[i];
    }
    else if(obj instanceof Orbit){
        var mVec = kep_2_cart(obj.e, obj.a, obj.i, obj.O, obj.w, i * obj, obj.t0, obj.M0);
        return new Point(mVec[0][0], mVec[0][1]);
    }
    else{
        return new Point(0, 0);
    }
}

function cart2kep(r_vec, v_vec, mu, t){
    let h_bar = math.cross(r_vec,v_vec);
    let h = math.norm(h_bar);

    let r = math.norm(r_vec);
    let v = math.norm(v_vec);
    
    let E = 0.5 * (v ** 2) - mu / r;
    
    let a = -mu / (2 * E);
    
    let e = Math.sqrt(1 - (h ** 2) / (a * mu));
    
    let i = Math.acos(h_bar[2] / h);
    
    let omega_LAN = Math.atan2(h_bar[0], -h_bar[1]);
    
    //beware of division by zero here
    let lat = Math.atan2(math.divide(r_vec[2], (Math.sin(i))),
    (r_vec[0] * Math.cos(omega_LAN) + r_vec[1] * Math.sin(omega_LAN)));
    
    let p = a * (1 - e ** 2);
    let nu = Math.atan2(Math.sqrt(p / mu) * math.dot(r_vec, v_vec), p - r)
    
    let omega_AP = lat - nu;
    
    let EA = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2));
    
    let n = Math.sqrt(mu / (a ** 3));
    let T = t - (1 / n) * (EA - e * Math.sin(EA));

    return [a, e, i, omega_AP, omega_LAN, T, EA];
};

function kep_2_cart(e, a, i, O, w, t, t0, M0){
    var dt = t - t0;
    var Mt = M0 + dt * Math.sqrt(mu/(a**3));

    var E = Mt;
    var F = E - e * Math.sin(E) - Mt;
    for (let j = 0; j < 30; j++){
        E = E - F / (1 - e * Math.cos(E));
        F = E - e * Math.sin(E) - Mt;
    }
    var nu = 2 * Math.atan2(Math.sqrt(1+e) * Math.sin(E/2), Math.sqrt(1-e) * Math.cos(E/2));
    var rc = a * (1 - e * Math.cos(E));

    var X = rc * Math.cos(nu);
    var Y = rc * Math.sin(nu);

    var dot = Math.sqrt(mu*a) / rc;
    var Xdot = dot * Math.sin(E);
    var Ydot = dot * Math.sqrt( 1- e**2) * Math.cos(E);

    var rx = (X * (Math.cos(w) * Math.cos(O) - Math.sin(w) * Math.cos(i) * Math.sin(O)) -
        Y *(Math.sin(w) * Math.cos(O) + Math.cos(w) * Math.cos(i) * Math.sin(O)));
    var ry = (X * (Math.cos(w) * Math.sin(O) - Math.sin(w) * Math.cos(i) * Math.cos(O)) -
        Y *(Math.cos(w) * Math.cos(i) + Math.cos(O) * Math.sin(w) * Math.sin(O)));
    var rz = (X * (Math.sin(w) * Math.sin(i)) + Y * (Math.cos(w) * Math.sin(i)));

    var rvx = (Xdot * (Math.cos(w) * Math.cos(O) - Math.sin(w) * Math.cos(i) * Math.sin(O)) -
        Ydot *(Math.sin(w) * Math.cos(O) + Math.cos(w) * Math.cos(i) * Math.sin(O)));
    var rvy = (Xdot * (Math.cos(w) * Math.sin(O) - Math.sin(w) * Math.cos(i) * Math.cos(O)) -
        Ydot *(Math.cos(w) * Math.cos(i) + Math.cos(O) * Math.sin(w) * Math.sin(O)));
    var rvz = (Xdot * (Math.sin(w) * Math.sin(i)) + Ydot * (Math.cos(w) * Math.sin(i)));

    return[[rx, ry, rz], [rvx, rvy, rvz]];
};

function orbitalPeriod(a){
    return 2 * Math.PI * Math.sqrt((a**3)/mu);
};

function addBasicElements(){

    elements.push({
        colour: '#05EFFF',
        text: "MNVR",
        width: elementWidth,
        height: elementHeight,
        top: elementSpacing + (elementHeight + elementSpacing) * elements.length - height / 2,
        left: width / 2 - (elementWidth + elementSpacing),
        function: addManoeuvreElements
    });

    elements.push({
        colour: '#05EFFF',
        text: "SIM",
        width: elementWidth,
        height: elementHeight,
        top: elementSpacing + (elementHeight + elementSpacing) * elements.length - height / 2,
        left: width / 2 - (elementWidth + elementSpacing),
        function: addSimulationElements
    });

    elements.push({
        colour: '#05EFFF',
        text: "I/O",
        width: elementWidth,
        height: elementHeight,
        top: elementSpacing + (elementHeight + elementSpacing) * elements.length - height / 2,
        left: width / 2 - (elementWidth + elementSpacing),
        function: addIOElements
    });

    elements.push({
        colour: '#05EFFF',
        text: "MISC",
        width: elementWidth,
        height: elementHeight,
        top: elementSpacing + (elementHeight + elementSpacing) * elements.length - height / 2,
        left: width / 2 - (elementWidth + elementSpacing),
        function: addMiscElements
    });

    elements.push({
        colour: '#05EFFF',
        text: "ZOOM+",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - (elementHeight + elementSpacing) * 3,
        left: width / 2 - (elementWidth + elementSpacing),
        function: zoomIn
    });
    
    elements.push({
        colour: '#05EFFF',
        text: "ZOOM-",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - (elementHeight + elementSpacing) * 3,
        left: width / 2 - (elementWidth + elementSpacing) * 3,
        function: zoomOut
    });

    elements.push({
        colour: '#05EFFF',
        text: "UP",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - (elementHeight + elementSpacing) * 3,
        left: width / 2 - (elementWidth + elementSpacing) * 2,
        function: panUP
    });

    elements.push({
        colour: '#05EFFF',
        text: "DOWN",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - (elementHeight + elementSpacing),
        left: width / 2 - (elementWidth + elementSpacing) * 2,
        function: panDN
    });

    elements.push({
        colour: '#05EFFF',
        text: "LEFT",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - (elementHeight + elementSpacing) * 2,
        left: width / 2 - (elementWidth + elementSpacing) * 3,
        function: panL
    });
    
    elements.push({
        colour: '#05EFFF',
        text: "RIGHT",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - (elementHeight + elementSpacing) * 2,
        left: width / 2 - (elementWidth + elementSpacing),
        function: panR
    });

    elements.push({
        colour: '#05EFFF',
        text: "TGT",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - (elementHeight + elementSpacing) * 2,
        left: width / 2 - (elementWidth + elementSpacing) * 2,
        function: setTGT
    });

    elements.push({
        colour: '#05EFFF',
        text: "REFR",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - (elementHeight + elementSpacing),
        left: width / 2 - (elementWidth + elementSpacing) * 3,
        function: setRF
    });
}

function addManoeuvreElements(){
    elements = [];
    addBasicElements();

    var l0 = elements.length;
    var leftOffset = 16;
    var bottomOffset = 32;
    var hSpacing = 80;

    elements.push({
        colour: '#05EFFF',
        text: "MAN+",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoAdd
    });

    elements.push({
        colour: '#05EFFF',
        text: "MAN-",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoRemove
    });

    elements.push({
        colour: '#05EFFF',
        text: deltaTimeText[deltaTi],
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoDeltaTime
    });

    elements.push({
        colour: '#05EFFF',
        text: "T+",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoTPlus
    });

    elements.push({
        colour: '#05EFFF',
        text: "T-",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoTMinus
    });

    elements.push({
        colour: '#05EFFF',
        text: deltaVtext[deltaVi],
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoDeltaV
    });

    elements.push({
        colour: '#05EFFF',
        text: "VPRG",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoVPPlus
    });

    elements.push({
        colour: '#05EFFF',
        text: "VRTR",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoVPMinus
    });
    
    elements.push({
        colour: '#05EFFF',
        text: "VTAN+",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoVTPlus
    });

    elements.push({
        colour: '#05EFFF',
        text: "VTAN-",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoVTMinus
    });
}

function addSimulationElements(){
    elements = [];
    addBasicElements();

    var l0 = elements.length;
    var leftOffset = 16;
    var bottomOffset = 32;
    var hSpacing = 80;

    elements.push({
        colour: '#05EFFF',
        text: deltaTimeText[deltaTi],
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: manoDeltaTime
    });

    elements.push({
        colour: '#05EFFF',
        text: "TSTEP",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: setTStep
    });

    elements.push({
        colour: '#05EFFF',
        text: "SIM+",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: simTimePlus
    });

    elements.push({
        colour: '#05EFFF',
        text: "SIM-",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: leftOffset + hSpacing * (elements.length - l0) - width / 2,
        function: simTimeMinus
    });
}

function addIOElements(){
    elements = [];
    addBasicElements();

    var l0 = elements.length;
    var leftOffset = 16;
    var bottomOffset = 32;
    var hSpacing = 80;
}

function addMiscElements(){
    elements = [];
    addBasicElements();

    var l0 = elements.length;
    var leftOffset = 16;
    var bottomOffset = 32;
    var hSpacing = 80;

    elements.push({
        colour: '#05EFFF',
        text: "CLSA",
        width: elementWidth,
        height: elementHeight,
        top: height / 2 - bottomOffset,
        left: elementSpacing + hSpacing * (elements.length - l0) - width / 2,
        function: setMinimum
    });
}

//Interface Functions

function zoomIn(){
    scale *= 1.5;
    panOff.x *= 1.5;
    panOff.y *= 1.5;
};

function zoomOut(){
    scale *= 0.75;
    panOff.x *= 0.75;
    panOff.y *= 0.75;
};

function setRF(){
    if(selectedObject instanceof Track || selectedObject instanceof Orbit){
        refFrame = selectedObject;
    }
    else{
        refFrame = null;
    }
}

function setTGT()
{
    if(selectedObject instanceof Track || selectedObject instanceof Orbit){
        targetObject = selectedObject;
        selectedObject = null;
    }
    else if(selectedObject instanceof Manoeuvre){
        targetObject = selectedObject.track;
        selectedObject = null;
    }
    else{
        targetObject = null;
    }
}

function setMinimum(){
    trackB = trackA;
    if(selectedObject instanceof Track || selectedObject instanceof Orbit){
        trackA = selectedObject;
        calcMinimum();
    }
}

function panUP(){
    panOff.y += height / 4;
};

function panDN(){
    panOff.y -= height / 4;
};

function panL(){
    panOff.x += width / 4;
};

function panR(){
    panOff.x -= width / 4;
};

function manoAdd(){
    if(selectedObject instanceof Track){
        var man = new Manoeuvre(deltaTime[deltaTi], 0, 0, selectedObject);
        selectedObject.manoeuvres.push(man);
        selectedObject = man;
        calcTrack();
    }
};

function manoRemove(){
    if(selectedObject instanceof Manoeuvre){
        var index = selectedObject.track.manoeuvres.indexOf(selectedObject);
        selectedObject.track.manoeuvres.splice(index, 1);
        selectedObject = null;
        calcTrack();
    }
}

function manoDeltaTime(element){
    deltaTi++;
    if(deltaTi >= deltaTime.length){
        deltaTi = 0;
    }
    element.text = deltaTimeText[deltaTi];
}

function manoTPlus(){
    if(selectedObject instanceof Manoeuvre){
        selectedObject.t += deltaTime[deltaTi];
        if(selectedObject.t > timestep * simLength)
            selectedObject.t = timestep * simLength;
        calcTrack();
    }
}

function manoTMinus(){
    if(selectedObject instanceof Manoeuvre){
        selectedObject.t -= deltaTime[deltaTi];
        if(selectedObject.t < 0)
            selectedObject.t = 0;
        calcTrack();
    }
}

function simTimePlus(){
    simLength += deltaTime[deltaTi] / timestep;
    calcTrack();
}

function simTimeMinus(){
    simLength -= deltaTime[deltaTi] / timestep;
    if(simLength < 0)
        simLength = 0;
    calcTrack();
}

function setTStep(){
    timestep = deltaTime[deltaTi];
    calcTrack();
}

function manoDeltaV(element){
    deltaVi++;
    if(deltaVi >= deltaV.length){
        deltaVi = 0;
    }
    element.text = deltaVtext[deltaVi];
}

function manoVPPlus(){
    if(selectedObject instanceof Manoeuvre){
        selectedObject.vp += deltaV[deltaVi];
        calcTrack();
    }
}

function manoVPMinus(){
    if(selectedObject instanceof Manoeuvre){
        selectedObject.vp -= deltaV[deltaVi];
        calcTrack();
    }
}

function manoVTPlus(){
    if(selectedObject instanceof Manoeuvre){
        selectedObject.vt += deltaV[deltaVi];
        calcTrack();
    }
}

function manoVTMinus(){
    if(selectedObject instanceof Manoeuvre){
        selectedObject.vt -= deltaV[deltaVi];
        calcTrack();
    }
}