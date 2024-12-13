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
    constructor(x, y, vx, vy, name, size, colour, mass, points, vectors, manoeuvres){
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.name = name;
        this.size = size;
        this.colour = colour;
        this.mass = mass;
        this.points = points;
        this.vectors = vectors;
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