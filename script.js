const canvas = document.querySelector(".myCanvas");
const ctx = canvas.getContext("2d");
const width = (canvas.width = window.innerWidth);
const height = (canvas.height = window.innerHeight);
ctx.translate(width / 2, height / 2);

var simLength = 1440 * 4;
const G = 6.67430e-11

var timestep = 60
var scale = 0.02e-3

const selectionRadius = 10;

const mu = G * 9.45996e24;
const R = 14951e3 / 2;
var time = 0;

var deltaTi = 0;
const deltaTime = [60, 600, 3600, 86400];
const deltaTimeText = ["1MIN", "10MIN", "1HR", "1DAY"];

var deltaVi = 0;
const deltaV = [1, 10, 100, 1000];
const deltaVtext = ["1m/s", "10m/s", "100m/s", "1km/s"];

//Graphical element settings
const elementWidth = 64;
const elementHeight = 16;
const elementSpacing = 16;
const manoeuvreSize = 5;
const selectionSize = 8;
const targetSize = 16;

var moons = [new Orbit(0.02, 416490e3, 0, 0, 0, 0, 0, 332e3 / 2, G * 1.06e20, "Delta", "rgb(200 200 200)")];

var tracks = [];
let vectors = kep_2_cart(0, R + 600e3, 0, 0, 0, time, 0, 0);
tracks.push(new Track(vectors[0][0], vectors[0][1], vectors[1][0], vectors[1][1], "1st Squadron", -1, "orange", 0, [], [], []));

//Selected object
var selectedObject = null;

//Reference frame
var refFrame = null;

var targetObject = null;

//Pan offset
var panOff = new Point(0, 0);

//Calculate tracks
let trackPoints = [];

//Add UI Elements
var elements = [];
//addBasicElements();
addManoeuvreElements();

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
        let mVec = kep_2_cart(element.e, element.a, element.i, element.O, element.w, time, element.t0, element.M0);
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
            tracks[i].vectors[j] = new Point(vx, vy);

            var d = Math.hypot(x, y);

            var xAcc = -x / d;
            var yAcc = -y / d;

            var a = mu / (d**2);

            vx += xAcc * a * timestep;
            vy += yAcc * a * timestep;

            moons.forEach(function(moon) {
                var mVec = kep_2_cart(moon.e, moon.a, moon.i, moon.O, moon.w, time + j * timestep, moon.t0, moon.M0);

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
        let mVec = kep_2_cart(moon.e, moon.a, moon.i, moon.O, moon.w, time, moon.t0, moon.M0);

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
            mVec = kep_2_cart(moon.e, moon.a, moon.i, moon.O, moon.w, time + j * timestep, moon.t0, moon.M0);
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

            ctx.arc(x, y, manoeuvreSize, degToRad(0), degToRad(360), false);
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
        let r = selectedObject.size * scale + selectionSize;
        ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = "red";
        let l = Math.floor(deltaTime[deltaTi] / timestep);
        let x0 = selectedObject.points[l].x;
        let y0 = selectedObject.points[l].y;
        let x1 = selectedObject.points[l + 1].x;
        let y1 = selectedObject.points[l + 1].y;
        let xv = x1 - x0;
        let yv = y1 - y0;
        let d = Math.hypot(xv, yv);
        let xh = xv / d;
        let yh = yv / d;
        let c = math.cross([xh, yh, 0], [0, 0, 1]);

        x = panOff.x + (x0 - rPoint.x) * scale - c[0] * selectionSize;
        y = panOff.y + (y0 - rPoint.y) * scale - c[1] * selectionSize;
        ctx.moveTo(x, y);
        x += c[0] * selectionSize * 2;
        y += c[1] * selectionSize * 2;
        ctx.lineTo(x, y);
        ctx.stroke();

        //Display selected item info
        ctx.fillStyle = "white";
        ctx.font = "16px Consolas";
        ctx.fillText("Track " + selectedObject.name, -(width / 2) + 10, -(height / 2) + 20 + 16 * 3);
    }
    else if(selectedObject instanceof Orbit){
        let mVec = kep_2_cart(selectedObject.e, selectedObject.a, selectedObject.i, selectedObject.O, selectedObject.w, time, selectedObject.t0, selectedObject.M0);

        let x = panOff.x + (mVec[0][0] - rPoint.x) * scale;
        let y = panOff.y + (mVec[0][1] - rPoint.y) * scale;
        let r = selectedObject.R * scale + selectionSize;
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
        ctx.arc(x, y, selectionSize + 2, degToRad(0), degToRad(360), false);
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
        let r = R * scale + selectionSize;
        ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.stroke();
        
        ctx.fillStyle = "white";
        ctx.font = "16px Consolas";
        ctx.fillText("Planet " + selectedObject, -(width / 2) + 10, -(height / 2) + 20 + 16 * 3);
    }

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    
    //Add target
    if(targetObject instanceof Track){
        let x = panOff.x + (targetObject.x - rPoint.x) * scale;
        let y = panOff.y + (targetObject.y - rPoint.y) * scale;
        let r0 = targetObject.size * scale + selectionSize;
        let r1 = targetObject.size * scale + targetSize;
        //ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.moveTo(x + r0, y);
        ctx.lineTo(x + r1, y);
        ctx.moveTo(x - r0, y);
        ctx.lineTo(x - r1, y);
        ctx.moveTo(x, y + r0);
        ctx.lineTo(x, y + r1);
        ctx.moveTo(x, y - r0);
        ctx.lineTo(x, y - r1);
        ctx.stroke();
    }
    else if(targetObject instanceof Orbit){
        let mVec = kep_2_cart(targetObject.e, targetObject.a, targetObject.i, targetObject.O, targetObject.w, time, targetObject.t0, targetObject.M0);

        let x = panOff.x + (mVec[0][0] - rPoint.x) * scale;
        let y = panOff.y + (mVec[0][1] - rPoint.y) * scale;
        let r0 = targetObject.R * scale + selectionSize;
        let r1 = targetObject.R * scale + targetSize;
        //ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.moveTo(x + r0, y);
        ctx.lineTo(x + r1, y);
        ctx.moveTo(x - r0, y);
        ctx.lineTo(x - r1, y);
        ctx.moveTo(x, y + r0);
        ctx.lineTo(x, y + r1);
        ctx.moveTo(x, y - r0);
        ctx.lineTo(x, y - r1);
        ctx.stroke();
    }
    else if(targetObject instanceof Manoeuvre){
        let l = Math.floor(targetObject.t / timestep);
        let point = getPoint(refFrame, l);
        let x = panOff.x + (targetObject.track.points[l].x - point.x) * scale;
        let y = panOff.y + (targetObject.track.points[l].y - point.y) * scale;
        let r0 = 2 + selectionSize;
        let r1 = 2 + targetSize;
        //ctx.arc(x, y, 10, degToRad(0), degToRad(360), false);
        ctx.moveTo(x + r0, y);
        ctx.lineTo(x + r1, y);
        ctx.moveTo(x - r0, y);
        ctx.lineTo(x - r1, y);
        ctx.moveTo(x, y + r0);
        ctx.lineTo(x, y + r1);
        ctx.moveTo(x, y - r0);
        ctx.lineTo(x, y - r1);
        ctx.stroke();
    }
    else if(typeof targetObject == 'string'){
        let x = panOff.x - rPoint.x * scale;
        let y = panOff.y - rPoint.y * scale;
        let r0 = R * scale + selectionSize;
        let r1 = R * scale + targetSize;
        //ctx.arc(x, y, r, degToRad(0), degToRad(360), false);
        ctx.moveTo(x + r0, y);
        ctx.lineTo(x + r1, y);
        ctx.moveTo(x - r0, y);
        ctx.lineTo(x - r1, y);
        ctx.moveTo(x, y + r0);
        ctx.lineTo(x, y + r1);
        ctx.moveTo(x, y - r0);
        ctx.lineTo(x, y - r1);
        ctx.stroke();
    }

    //Render point of closest approach.    
    if(targetObject instanceof Track || targetObject instanceof Orbit || targetObject instanceof Manoeuvre || typeof targetObject == 'string'){
        let min = Number.MAX_VALUE;
        let idMin = -1;
        
        for(let i = 0; i < simLength; i++){
            if(selectedObject instanceof Track){
                var pointA = selectedObject.points[i];        
            }
            else if(selectedObject instanceof Manoeuvre){
                var pointA = selectedObject.track.points[i]; 
            }
            else if(selectedObject instanceof Orbit){
                let mVec = kep_2_cart(selectedObject.e, selectedObject.a, selectedObject.i, selectedObject.O, selectedObject.w, time + i * timestep, selectedObject.t0, selectedObject.M0);
                var pointA = new Point(mVec[0][0], mVec[0][1]);
            }
            else{
                var pointA = new Point(0, 0);
            };
    
            if(targetObject instanceof Track){
                var pointB = targetObject.points[i];        
            }
            else if(targetObject instanceof Manoeuvre){
                var pointB = targetObject.track.points[i]; 
            }
            else if(targetObject instanceof Orbit){
                let mVec = kep_2_cart(targetObject.e, targetObject.a, targetObject.i, targetObject.O, targetObject.w, time + i * timestep, targetObject.t0, targetObject.M0);
                var pointB = new Point(mVec[0][0], mVec[0][1]);
            }
            else{
                var pointB = new Point(0, 0);
            };
    
            let dx = pointA.x - pointB.x;
            let dy = pointA.y - pointB.y;
            let d = Math.hypot(dx, dy);
    
            if(d < min){
                min = d;
                idMin = i;
                var pointAMin = pointA;
                var pointBMin = pointB;
            };
        };

        let point = getPoint(refFrame, idMin);

        ctx.strokeStyle = "rgb(255 0 0 / 80%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(panOff.x + pointAMin.x * scale - point.x * scale, panOff.y + pointAMin.y * scale - point.y * scale);
        ctx.lineTo(panOff.x + pointBMin.x * scale - point.x * scale, panOff.y + pointBMin.y * scale - point.y * scale);
        ctx.stroke();

        ctx.fillStyle = "red";
        ctx.font = "16px Consolas";
        ctx.fillText("Closest approach: T+" + displayTime(idMin * timestep), panOff.x + pointAMin.x * scale - point.x * scale + 10, panOff.y + pointAMin.y * scale - point.y * scale);
        ctx.fillText(Math.floor(min / 1000) + " Km", panOff.x + pointAMin.x * scale - point.x * scale + 10, panOff.y + pointAMin.y * scale - point.y * scale + 16);
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

function getPoint(obj, i){
    if(obj instanceof Track){
        return obj.points[i];
    }
    else if(obj instanceof Orbit){
        var mVec = kep_2_cart(obj.e, obj.a, obj.i, obj.O, obj.w, time + i * timestep, obj.t0, obj.M0);
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
    var rvy = (Xdot * (Math.cos(w) * Math.sin(O) + Math.sin(w) * Math.cos(i) * Math.cos(O)) +
        Ydot *(Math.cos(w) * Math.cos(i) * Math.cos(O) - Math.sin(w) * Math.sin(O)));
    var rvz = (Xdot * (Math.sin(w) * Math.sin(i)) + Ydot * (Math.cos(w) * Math.sin(i)));

    return[[rx, ry, rz], [rvx, rvy, rvz]];
};

function orbitalPeriod(a){
    return 2 * Math.PI * Math.sqrt((a**3)/mu);
};