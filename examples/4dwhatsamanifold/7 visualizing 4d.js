
let sq3 = Math.sqrt(3);

if(userParams === undefined){
    var userParams = {};
}
userParams.mode= "orthographic";
userParams.orthographic4Vec=[1/sq3,1/sq3,1/sq3];

let R4Embedding = null, R4Rotation = null, inwardsLineControl = null;

const zeroWColor = new THREE.Color(coordinateLine4ZeroColor);
const oneWColor = new THREE.Color(coordinateLine4Color);
const negativeWColor = new THREE.Color(coordinateLine4NegativeColor);

function colorMap(wCoordinate){
 let fourDRampAmt = Math.min(1, wCoordinate) //ramp from 0-1 then hold steady at 1
 let fourDAbsRampAmt = Math.min(1, Math.abs(wCoordinate)) //ramp from 0-1 then hold steady at 1
 /*
  //a color map that (A) goes from dark to light as you go from 0-1, and (B) cycles hue
 let lightness = Math.min(0.5, wCoordinate);
 return new THREE.Color().setHSL(wCoordinate, 0.5, fourDRampAmt/2);
 */

 if(wCoordinate > 0){
   //This should be coordinateline4color. w=+1
   return zeroWColor.clone().lerp(oneWColor.clone(), fourDAbsRampAmt); 
 }else{
    //this is coordinateLine4NegativeColor. w=-1
   return zeroWColor.clone().lerp(negativeWColor.clone(), fourDAbsRampAmt); 
 }
}



function perspectiveEmbedding(i,t,x,y,z,w){
    return [0.5*x/(w+0.5), 0.5*y/(w+0.5), 0.5*z/(w+0.5)];
}
function orthographicEmbedding(i,t,x,y,z,w){
    let wProjection = EXP.Math.multiplyScalar(w,EXP.Math.clone(userParams.orthographic4Vec));
    return EXP.Math.vectorAdd([x,y,z],wProjection);
}

function rotation4DZW(offsetW=0){
        //center of rotation is [0,0,0,offsetW]. use 0.0 when orthographic projecting, 0.5 when not

    return function(i,t,x,y,z,w){
        w = w-offsetW

        let newZ = z*Math.cos(t*Math.PI/6) + -w*Math.sin(t*Math.PI/6)
        let newW = z*Math.sin(t*Math.PI/6) + w*Math.cos(t*Math.PI/6)
       return [x,y,newZ,newW+offsetW]
    }
}

function rotation3D(axis1,axis2){
    //if [axis1,axis2] = [0,1], this is a 2D rotation along the x and y axes.
    return function(i,t, ...coords){

        let rotationFactor = (t*Math.PI/2);
        let newCoord1 = coords[axis1]*Math.cos(rotationFactor) + -coords[axis2]*Math.sin(rotationFactor)
        let newCoord2 = coords[axis1]*Math.sin(rotationFactor) + coords[axis2]*Math.cos(rotationFactor);

        coords[axis1] = newCoord1
        coords[axis2] = newCoord2;

       return coords
    }
    
}

function rotationAll3DAxesSequentially(){
    //cycle through rotation in the XY, YZ, and XZ plane
        //NOTE: this technically teleports from pi/2 rotation to 0 rotation. 
        //Everything I'm using this on is mirror-symmetric, so it doesn't show, but note that that's what's happening.

    let XYRotation = rotation3D(0,1);
    let YZRotation = rotation3D(1,2);
    let XZRotation = rotation3D(0,2);

    return function(i,t, ...coords){
        //NOTE: this technically teleports from pi/2 rotation to 0 rotation. 
        //Everything I'm using this on is mirror-symmetric, so it doesn't show, but note that that's what's happening.
        let numSecondsPerHalfRotation = 2;
        let animationFactor = t/numSecondsPerHalfRotation % 3;

        //first show an XY rotation, then YZ, then XZ, in sequence
        if(animationFactor < 1){
            return XYRotation(i,t,...coords);
        }else if(animationFactor < 2){
            return YZRotation(i,t,...coords);
        }else{ //animationFactor < 3
            return XZRotation(i,t,...coords);
        }
    }
}


function R4EmbeddingFunc(i,t,x,y,z,w){
    if(w == 0)w = 0.001;
    if(userParams.mode == "perspective") return perspectiveEmbedding(i,t,x,y,z,w);
    //else if(userParams.mode == "orthographic") 
    return orthographicEmbedding(i,t,x,y,z,w)
}

function setup4DEmbedding(){
    R4Embedding = new EXP.Transformation({'expr': R4EmbeddingFunc});
    R4Rotation = new EXP.Transformation({'expr': (i,t,x,y,z,w) => [x,y,z,w]});

    R4OrthoVector = new EXP.Transformation({'expr': (i,t) => [1/sq3,1/sq3,1/sq3]}); //Transformation to control the projection of the w axis
    
    let R4OrthoVecActivator = new EXP.Array({data: [[0]]});
    R4OrthoVecActivator.add(R4OrthoVector).add(new EXP.FlatArrayOutput({array: userParams.orthographic4Vec}));
    objects.push(R4OrthoVecActivator);
}

function setup4DPolychora(){

    let hypercube = makeHypercube(R4Embedding,R4Rotation);
    hypercube.objectParent.position.x = 2

    let sq5 = Math.sqrt(5), sq29 = Math.sqrt(2/9), sq23 = Math.sqrt(2/3);
    let fivecell = new Polychoron(
        [//points
            //[0,0,0,0], [0,0,0,1], [0,0,1,0], [0,1,0,0], [1,0,0,0],

            //[1,1,1,-1/sq5], [1,-1,-1,-1/sq5], [-1,1,-1,-1/sq5], [-1,-1,1,-1/sq5], [0,0,0,sq5-1/sq5]
            [sq5*Math.sqrt(8/9),-sq5/3,0,0], [-sq5*sq29,-sq5/3,-sq5*sq23,0], [-sq5*sq29,-sq5/3,sq5*sq23,0], [0,sq5,0,0], [0,0,0,1] //has base on XZ plane, almost all w=0

        ],
        [ //lines
            [0,1], [0,2], [0,3], [0,4],
            [1,2],[1,3],[1,4],
            [2,3],[2,4],
            [3,4],
        ],
    R4Embedding,R4Rotation);
    fivecell.objectParent.position.x = -3;

    
    //VERY COOL! but also a bit laggy
    /*
    let torus3 = makeTorus3(R4Embedding, R4Rotation);
    objects.push(torus3);
    */

    objects.push(hypercube);
    objects.push(fivecell);
}

let inwardsPerspectiveLines = [];
function setup4DAxes(){
    //the fourth dimension!
    wAxis = new EXP.Area({bounds: [[0,1]], numItems: 2});
    positiveWOutput = new EXP.VectorOutput({width:5, color: coordinateLine4Color, opacity:1});
    let negativeWOutput = new EXP.VectorOutput({width:5, color: coordinateLine4NegativeColor, opacity:1});

    wAxisControl = new EXP.Transformation({expr: (i,t,x,y,z,w) => [x,y,z,w]});

    wAxis
    .add(new EXP.Transformation({expr: (i,t,x) => [0,0,0,x*Math.sqrt(3)]}))
    .add(wAxisControl)
    .add(R4Rotation.makeLink())
    .add(R4Embedding.makeLink())
    .add(positiveWOutput);
    wAxis
    .add(new EXP.Transformation({expr: (i,t,x) => [0,0,0,-x*Math.sqrt(3)]}))
    .add(wAxisControl.makeLink())
    .add(R4Rotation.makeLink())
    .add(R4Embedding.makeLink())
    .add(negativeWOutput);
    
    let colorForW1 = colorMap(1);
    let colorForW0 = colorMap(0);
    let colorForWNeg1 = colorMap(-1);


    //inwards-pointing ys for the perspective
    inwardsLineControl = new EXP.Transformation({expr: (i,t,x,y,z) => [x/Math.abs(x),y/Math.abs(y),z]});
    for(let m=0;m<8;m++){
        //let i = [1,1,-1,-1][m];
        //let j = [1,-1,1,-1][m];
        //let k = [1,-1,-1,1][m]; //tetrahedron

        let epsilon = 0.0001;

        let i = [1,1,-1,-1][m];
        let j = [1,-1,1,-1][m];
        let k = [epsilon,epsilon,epsilon,epsilon][m];

        let line = new EXP.Array({data: [[i,j,k-epsilon],[i/3,j/3,k/3]]});
        let vecOut = new EXP.VectorOutput({width:50, color: coordinateLine4Color, opacity:1});
        line
        .add(inwardsLineControl.makeLink())
        .add(vecOut);
        objects.push(line);

        inwardsPerspectiveLines.push(line);

        //horrible color hack time
        line.activate(0);

        vecOut._setColorForVertex(0, colorForW0);
        vecOut._setColorForVertex(1, colorForW1);
    }


    //HORRIBLE HACK ALERT
    //when the first time activate() is called, it sets the colors and vertex arrays.
    //meaning we need to activate it once first before messing with color data.
    wAxis.activate(0);

    positiveWOutput._setColorForVertex(0, colorForW0);
    positiveWOutput._setColorForVertex(1, colorForW1);

    negativeWOutput._setColorForVertex(0, colorForW0);
    negativeWOutput._setColorForVertex(1, colorForWNeg1);

    objects.push(wAxis);
}

function setup4D(){
    setup4DEmbedding();
    setup4DAxes();
    setup4DPolychora();
}

async function animateTo4DPerspective(){
    //change the R4 embedding to perspective and visually show the 3D icon for perspective

    presentation.TransitionTo(R4Embedding, {'expr': perspectiveEmbedding}, 1000);

    await EXP.delay(250);
    presentation.TransitionTo(inwardsLineControl,{expr: (i,t,x,y,z) => [x,y,z]}, 750);

}
async function animateTo4DOrtho(){
    //change the R4 embedding to perspective and hide the 3D icon for perspective
    presentation.TransitionTo(R4Embedding, {'expr': orthographicEmbedding});
    presentation.TransitionTo(inwardsLineControl,{expr: (i,t,x,y,z) => [x/Math.abs(x),y/Math.abs(y),z]});
}


let hypercubeControl = new EXP.Transformation({'expr':(i,t,x,y,z,w) => [0,0,0,0]});

async function animate4D(){


    let hypercube = makeHypercube(R4Embedding, [hypercubeControl, R4Rotation]);
    objects.push(hypercube);

    //fade away the point and its arrows
    pointCoordinateArrows.getDeepestChildren().forEach((output) => {
        presentation.TransitionTo(output, {opacity:0}, 1000);
    });
    [manifold4PointOutput,wAxisCoordinateArrowOutput].forEach((output) => {
        presentation.TransitionTo(output, {opacity:0}, 1000);
    });
    
    try{
        let threeDCoords = document.getElementById("coords");
        presentation.TransitionTo(threeDCoords.style, {'opacity':0}, 0);
    }catch(e){}

    await presentation.nextSlide();
    //The fabled hypercube... begins to appear!

    //move axes and hypercube away from one another
    [xAxis,yAxis,zAxis,wAxis].concat(inwardsPerspectiveLines).forEach((item, axisNumber) => {
        item.getDeepestChildren().forEach((output) => {
            presentation.TransitionTo(output.mesh.position, {x:-1.1}, 1000);
        });
    });
    hypercube.objectParent.position.x = 1.1;

    presentation.TransitionTo(hypercubeControl, {'expr':(i,t,x,y,z,w) => [x,0,0,0]},1000);
    await presentation.nextSlide();


    presentation.TransitionTo(hypercubeControl, {'expr':(i,t,x,y,z,w) => [x,y,0,0]},1000);
    await presentation.nextSlide();


    presentation.TransitionTo(hypercubeControl, {'expr':(i,t,x,y,z,w) => [x,y,z,0]},1000);
    await presentation.nextSlide();


    presentation.TransitionTo(hypercubeControl, {'expr':(i,t,x,y,z,w) => [x,y,z,w]},1000);
    await presentation.nextSlide();

    await animate4DEmbeddings();
    await animate4DRotations();

}

async function animate4DRotations(){

    //reset camera and stop rotating
    presentation.TransitionTo(three.camera.position, {'x':0,'y':0.5,'z':3}, 1000);
    presentation.TransitionTo(controls, {'autoRotateSpeed':0, autoRotate: false}, 250);

    await animateTo4DOrtho();
    await presentation.nextSlide();

    //3D rotation
    // "We're used to things rotating in 3D"


    presentation.TransitionTo(R4Embedding, {'expr':(i,t,x,y,z,w) => [x,y,z,0]},1000);
    presentation.TransitionTo(R3Rotation, {'expr': rotationAll3DAxesSequentially()});
    await presentation.nextSlide();

    //"those rotations don't change in 4D"
    await animateTo4DOrtho();
    await presentation.nextSlide();

    //thing #1: ortho rotation!

    presentation.TransitionTo(R4Rotation, {'expr': rotation4DZW(0.5)});
    await presentation.nextSlide();

    //perspective OH NO EVERYTHING GOES WRONG because we animate through w=0
    await animateTo4DPerspective();
    await presentation.nextSlide();

    //if we add 1 to w, we're fine
    presentation.TransitionTo(R4Rotation, {'expr': rotation4DZW(0.5)});
    await presentation.nextSlide();
}


async function animate4DEmbeddings(){
    //called by 5.5 once we get to 4D.

    //first, show that we can choose different embeddings
    //presentation.TransitionTo(R4OrthoVector,{expr: (i,t,x,y,z) => [1/sq3,1/sq3,1/sq3]}, 1000);
    //presentation.TransitionTo(window, {'pointPath':(i,t,x) => [Math.cos(t/2),Math.sin(t/2),Math.cos(t/2*1.23),1]},1000);
    //await presentation.nextSlide();

    //flash the name "orthographic embedding"
    presentation.TransitionTo(R4OrthoVector,{expr: (i,t,x,y,z) => [1/sq3,1/sq3,1/sq3]}, 1000);

    await presentation.nextSlide();

    //"We can vary the vector we're using to display the w-axis, the 4th dimension, and that changes what our visualization looks like.
    presentation.TransitionTo(R4OrthoVector,{expr: (i,t,x,y,z) => [Math.cos(t)/1.7,Math.sin(t)/1.7,0.5]}, 1000);
    await presentation.nextSlide();

    //"but there's another way to do it: It's perspective!"
    await animateTo4DPerspective();
    await presentation.nextSlide();

    //back to ortho
    await animateTo4DOrtho();
    presentation.TransitionTo(R4OrthoVector,{expr: (i,t,x,y,z) => [1/sq3,1/sq3,1/sq3]}, 1000);
}

async function animate4DStandalone(){



    //no 3-> 4 animation
    if(!presentation.initialized){
        await presentation.begin();
    }


    [xAxis, yAxis, zAxis].forEach((axis) => axis.getDeepestChildren().forEach((output) => {
        presentation.TransitionTo(output, {"color": new THREE.Color(output.color).offsetHSL(0,0,0.15)},250);
    }));

    await presentation.nextSlide();
    await animateTo4DPerspective();

    await presentation.nextSlide();
    await animateTo4DOrtho();


    await presentation.nextSlide();

    //hyper-rotation!
    presentation.TransitionTo(R4Rotation, {'expr': rotation4DZW(0.5)});
}

