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
    if(selectedObject instanceof Track || selectedObject instanceof Orbit || typeof selectedObject == 'string'){
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