"use:strict";
var images = new Array();
var loadScreen = document.getElementById('load-screen');
var text = loadScreen.getElementsByTagName("p")[0];

function preload() {
    for (i = 0; i < preload.arguments.length; i++) {
        images[i] = new Image();
        images[i].src = preload.arguments[i];
    }
}
preload( "images/border.png",
         "images/Seal.png",
         "images/Paper.jpg",
         "resources/agatha/cube/nx.jpg",
         "resources/agatha/cube/ny.jpg",
         "resources/agatha/cube/nz.jpg",
         "resources/agatha/cube/px.jpg",
         "resources/agatha/cube/py.jpg",
         "resources/agatha/cube/pz.jpg",
         "resources/agatha/shadow_center.png",
         "resources/agatha/shadow_edge.png",
         "resources/agatha/tit.jpg",
         "resources/bartholemew/BakedColor.png",
         "resources/bartholemew/UnderSkinColor.png",
         "resources/bartholemew/BakedNormal.png",
         "resources/sebastian/sebastianMapFINAL.jpg",
         "resources/sebastian/buttMap.jpg" );

function Saint() {
    // Constructor
    this.jsonPaths=[];
    this.names=[];
    this.objects=[];
    this.lights=[];
    this.camera = new THREE.PerspectiveCamera();
    this.vars = {};
    this.addMesh = function(name,filepath){
        this.names.push(name);
        this.jsonPaths.push(filepath);
    };
    // Base functions
    this.init = function(){};
    this.makePhysics = function(){};
    this.animate = function(){};
    this.reset = function(){};
    this.hide = function(){
        for(i in this.lights) { this.lights[i].visible = false; }
        for(i in this.objects) { this.objects[i].visible = false; }
    };
    this.show = function(){
        for(i in this.lights) { this.lights[i].visible = true; }
        for(i in this.objects) { this.objects[i].visible = true; }
        camera = this.camera;
    };
    // Interaction functions
    this.onPress = function(mousePos,intersects){};
    this.onMove = function(mousePos,intersects){};
    this.onRelease = function(){};
}

// Loading handler for saints
var saintLoader = { toLoad : 0,
                    loaded : 0,
                    saints : [] };

saintLoader.checkAllLoaded = function() {
    this.loaded ++;
    text.innerHTML = "LOADING " + saintLoader.loaded + "/" + saintLoader.toLoad;
    if (this.loaded >= this.toLoad) {
       for(var i=0; i<this.saints.length; i++){
            this.saints[i].init();
            this.saints[i].makePhysics();
            this.saints[i].hide();
            this.saints[0].show();
        }

        var seal = document.getElementById('seal');
        seal.classList.add('fadeOut');
        setTimeout( function(){ loadScreen.classList.add('fadeOut');
                                loadScreen.style.pointerEvents='none';}, 1000);
        setTimeout( function(){loadScreen.style.display='none';}, 4000);
    }
};

saintLoader.add = function(saint) {
    this.toLoad += saint.names.length;
    this.saints.push(saint);
};

saintLoader.createObject = function(jsonFile,objName){
    var loader = new THREE.JSONLoader();
    var container = new THREE.Mesh();
    loader.load( jsonFile , function (geometry, materials) {
        container.geometry = geometry;
        if(materials!==undefined) { container.material = materials[0]; }
        container.name = objName;
        saintLoader.checkAllLoaded();
    });
    return container;
};

saintLoader.load = function() {
    for(var i=0; i<this.saints.length; i++){
        var saint = this.saints[i];
        for(var j=0; j<saint.names.length; j++){
            var obj = this.createObject(saint.jsonPaths[j], saint.names[j]);
            saint.objects.push(obj);
        }
    }
};

var Agatha = new Saint();
Agatha.addMesh('Platter','resources/agatha/platter.js');
Agatha.addMesh('Platter-Bottom','resources/agatha/platter_bottom.js');
Agatha.addMesh('Tit','resources/agatha/tit.js');

Agatha.init = function() {
    // CAMERA
    this.camera = new THREE.PerspectiveCamera( 50, WIDTH / HEIGHT, 1, 1000 );
    this.camera.position.y = 40;
    this.camera.position.z = 80;
    this.camera.up = new THREE.Vector3(0,0,-1);
    this.camera.lookAt(new THREE.Vector3(0,0,25));

    // LIGHTS
    var spotlight = new THREE.SpotLight( 0x332522 );
    spotlight.intensity = 0.1;
    spotlight.position.set( 0, 40, -10 );
    spotlight.angle = Math.PI;
    spotlight.target.position.set( 0, 0, 0 );
    spotlight.shadow.camera.near = 0.01;     
    spotlight.castShadow = true;
    spotlight.intensity = 2;

    var light2 = new THREE.DirectionalLight( 0xFFFFFF);
    light2.position.set( 0, 40, -10 ).normalize();
    light2.intensity = 1.2;

    var light3 = new THREE.DirectionalLight( 0x443311);
    light3.position.set( 0, 0, 3 ).normalize();

    this.lights.push(spotlight); scene.add(this.lights[0]);
    this.lights.push(light2); scene.add(this.lights[1]);
    this.lights.push(light3); scene.add(this.lights[2]);

    // OBJECTS
    var path = "resources/agatha/cube/";
    var format = '.jpg';
    var urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];
    var textureCube = new THREE.CubeTextureLoader().load(urls);
    textureCube.format = THREE.RGBFormat;
    var materialPlatter = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: textureCube } );
    this.objects[0].receiveShadow = true;
    var rotOffset = -1*Math.PI/2;
    this.objects[0].rotation.x = rotOffset;
    this.objects[0].material = materialPlatter; 
    scene.add(this.objects[0]); // Platter
    this.objects[1].material = materialPlatter; 
    this.objects[0].add(this.objects[1]); // bottom

    var titSize = 9.5;
    var pos_A = -titSize-titSize/10;
    var pos_B = titSize+titSize/10;

    this.objects[2].position.y = 0;
    this.objects[2].position.x = pos_A;
    this.objects[2].rotation.z = 3;
    this.objects[2].castShadow = true;
    this.objects.push(this.objects[2].clone());
    this.objects[3].position.x = pos_B;
    this.objects[3].geometry = this.objects[2].geometry.clone();

    this.objects[0].add(this.objects[2]);
    this.objects[0].add(this.objects[3]);

    var shadowContainer = new THREE.Object3D();

    //Shadows
    var shadowTexture1 = new THREE.TextureLoader().load( "resources/agatha/shadow_center.png" );
    materialShadow1 = new THREE.MeshLambertMaterial({  color: 0xffffff, transparent:true, opacity:0.2, map:shadowTexture1 });
    shadow1 = new THREE.Mesh(new THREE.PlaneBufferGeometry(70, 70), materialShadow1);
    shadow1.position.y=-15;
    shadow1.rotation.x = rotOffset;
    shadow1.name="Shadow_Center";
    this.objects.push(shadow1); shadowContainer.add(this.objects[4]);
    var shadowTexture2 = new THREE.TextureLoader().load( "resources/agatha/shadow_edge.png" );
    materialShadow2 = new THREE.MeshLambertMaterial({  color: 0xffffff, transparent:true, opacity:0.2, map:shadowTexture2 });
    shadow2 = new THREE.Mesh(new THREE.PlaneBufferGeometry(70, 70), materialShadow2);
    shadow2.position.y=-14.8;
    shadow2.rotation.x = rotOffset;
    shadow2.name="Shadow_Edge";
    this.objects.push(shadow2); shadowContainer.add(this.objects[5]);
    scene.add(shadowContainer);
};

Agatha.makePhysics = function() {

    var titSize = 9.5;
    var firmRatio = 0.75;
    var pos_A = -titSize-titSize/10;
    var pos_B = titSize+titSize/10;
    var nipStiff = 25;
    var platterSize = 20;
    
    var NIP = Math.pow(2,0);
    var TIT = Math.pow(2,1);
    var world = new p2.World({ gravity:[0, 0] });

    // Tit A physics
    var circleShape1 = new p2.Circle({radius:titSize*firmRatio});
    circleShape1.collisionGroup = TIT;
    circleShape1.collisionMask = TIT;
    var circleBody1 = new p2.Body({ mass:1, position:[pos_A,0] });
    circleBody1.addShape(circleShape1);
    world.addBody(circleBody1);
    circleBody1.damping = 0.4;
    circleBody1.angularDamping = 0.1;
    circleShape1.material = new p2.Material();

    var nippleShape1 = new p2.Circle({radius:titSize*0.3});
    nippleShape1.collisionGroup = NIP;
    var nippleBody1 = new p2.Body({mass:1,position:[pos_A,0]});
    nippleBody1.addShape(nippleShape1);
    nippleBody1.damping = 0.4;
    nippleBody1.angularDamping = 0.1;
    nippleBody1.material = new p2.Material();
    world.addBody(nippleBody1);

    var spring1 = new p2.LinearSpring(circleBody1, nippleBody1, {
        restLength : 0,
        stiffness : nipStiff,
        localAnchorA : [0,0],
        localAnchorB : [0,0]
    });
    world.addSpring(spring1);

    // Tit B physics
    var circleShape2 = new p2.Circle({radius:titSize*firmRatio});
    circleShape2.collisionGroup = TIT;
    circleShape2.collisionMask = TIT;
    var circleBody2 = new p2.Body({ mass:1, position:[pos_B,0] });
    circleBody2.addShape(circleShape2);
    world.addBody(circleBody2);
    circleBody2.damping = 0.4;
    circleBody2.angularDamping = 0.1;
    circleShape2.material = new p2.Material();

    var nippleShape2 = new p2.Circle({radius:titSize*0.3});
    nippleShape2.collisionGroup = NIP;
    var nippleBody2 = new p2.Body({mass:1,position:[pos_B,0]});
    nippleBody2.damping = 0.4;
    nippleBody2.angularDamping = 0.1;
    nippleBody2.material = new p2.Material();
    world.addBody(nippleBody2);

    var spring2 = new p2.LinearSpring(circleBody2, nippleBody2, {
        restLength : 0,
        stiffness : nipStiff,
        localAnchorA : [0,0],
        localAnchorB : [0,0]
    });
    world.addSpring(spring2);

    // Tit contact physics
    world.addContactMaterial(new p2.ContactMaterial(circleShape1.material, circleShape2.material, {
    frictionalStiffness:1,
    friction:0.35,
    restitution : 1,
    stiffness : 25
    }));

    // Platter edge physics
    var platterBody = new p2.Body({position:[0,0]});
    world.addBody(platterBody);

    var constraint1 = new p2.DistanceConstraint(platterBody,circleBody1);
    world.addConstraint(constraint1);
    constraint1.upperLimitEnabled = true;
    constraint1.lowerLimitEnabled = true;
    constraint1.upperLimit = platterSize-titSize*firmRatio;
    constraint1.lowerLimit = 0;
    constraint1.setStiffness(30);

    var constraint2 = new p2.DistanceConstraint(platterBody,circleBody2);
    world.addConstraint(constraint2);
    constraint2.upperLimitEnabled = true;
    constraint2.lowerLimitEnabled = true;
    constraint2.upperLimit = platterSize-titSize*firmRatio;
    constraint2.lowerLimit = 0;
    constraint2.setStiffness(30);
    

    // Variables for physics simulation
    this.vars.world = world;
    this.vars.nippleA = new THREE.Object3D();
    this.vars.nippleA.name = "Nipple A";
    scene.add(this.vars.nippleA);
    this.vars.nippleB = new THREE.Object3D(); 
    this.vars.nippleB.name = "Nipple B";
    scene.add(this.vars.nippleB);
    this.vars.titBaseGeom = this.objects[2].geometry.clone();
    this.vars.titSize = titSize;
    this.vars.platterSize = platterSize;

    // Variables for squish function
    this.vars.titPosA = new THREE.Vector2();
    this.vars.titPosB = new THREE.Vector2();
    this.vars.squishTitA = new THREE.Vector2();
    this.vars.squishTitB = new THREE.Vector2();
    this.vars.squishPlatterA = new THREE.Vector2();
    this.vars.squishPlatterB = new THREE.Vector2();
    this.vars.squishNippleA = new THREE.Vector2();
    this.vars.squishNippleB = new THREE.Vector2();
    this.vars.vertex2D = new THREE.Vector2();

    // variables for clicking
    this.vars.oldTime=Date.now();
    this.vars.mousePosOnPress = new THREE.Vector2(0,0);
    this.vars.targetRotationOnPress = new THREE.Vector2(0,0);
    this.vars.targetRotation = new THREE.Vector2(0,0);
    this.vars.grabbed = false;
};

Agatha.animate = function() {
    var time = Math.min((Date.now() - this.vars.oldTime)/1000,1/30)*2;
    this.vars.world.step(time);
    this.vars.oldTime=Date.now();

    // Rotate tits to match platter
    var platter = this.objects[0];
    var target = this.vars.targetRotation;
    var tiltSize = 0.4;
    var rotOffset = -1*Math.PI/2;
    platter.rotation.y += ( target.x - platter.rotation.y )*0.05;
    platter.rotation.y = Math.max(platter.rotation.y,-tiltSize);
    platter.rotation.y = Math.min(platter.rotation.y,tiltSize);
    platter.rotation.x += ( target.y - platter.rotation.x + rotOffset)*0.05;
    platter.rotation.x = Math.max(platter.rotation.x,-tiltSize + rotOffset);
    platter.rotation.x = Math.min(platter.rotation.x,tiltSize + rotOffset);

    // Calculate normalized gravity vector
    var accelG = [ Math.sin(platter.rotation.y), Math.cos(platter.rotation.x)];

    // Make shadow change with platter tilt
    var shadow1 = this.objects[4];
    var shadow2 = this.objects[5];
    shadow2.material.opacity = accelG[0]*accelG[0];
    shadow2.material.opacity += accelG[1]*accelG[1];
    shadow1.material.opacity = Math.max(0.4-shadow2.material.opacity/2,0);
    if (Math.abs(accelG[0])>0.01 && Math.abs(accelG[0])>0.01) {
        shadow2.rotation.z = Math.atan2(-1*accelG[0],-1*accelG[1]);
    }

    // Scale gravity and apply to world
    accelG[0] = accelG[0]*25;
    accelG[1] = accelG[1]*25;
    this.vars.world.gravity = accelG;

    // Update nipple position
    var nippleBodyA = this.vars.world.bodies[1];
    var nippleBodyB = this.vars.world.bodies[3];

    this.vars.nippleA.position.x = nippleBodyA.position[0];
    this.vars.nippleA.position.y = -1 * nippleBodyA.position[1];
    this.vars.nippleA.rotation.z = -1 * nippleBodyA.angle;
    
    this.vars.nippleB.position.x = nippleBodyB.position[0];
    this.vars.nippleB.position.y = -1 * nippleBodyB.position[1];
    this.vars.nippleB.rotation.z = -1 * nippleBodyB.angle;

    // Update tit A position
    this.objects[2].position.x = this.vars.world.bodies[0].position[0];
    this.objects[2].position.y = -1 * this.vars.world.bodies[0].position[1];
    this.objects[2].position.z = 0;
    this.objects[2].rotation.z = -1 * this.vars.world.bodies[0].angle;
    
    // Update tit B position
    this.objects[3].position.x = this.vars.world.bodies[2].position[0];
    this.objects[3].position.y = -1 * this.vars.world.bodies[2].position[1];
    this.objects[3].position.z = 0;
    this.objects[3].rotation.z = -1 * this.vars.world.bodies[0].angle + 0.7;
    var titVertsA = this.objects[2].geometry.vertices;
    this.squish();
};

Agatha.diffAngle = function(angleTo, angleFrom){
    angleTo = angleTo % ( 2 * Math.PI );
    angleFrom = angleFrom % ( 2 * Math.PI );
    var angle = Math.abs(angleTo - angleFrom) - 2 * Math.PI;
    angle = Math.min(Math.abs(angle), Math.abs(angleTo-angleFrom));
    return angle;
};

Agatha.rotate2DMatrixInv = function(vector, matrix) {
    vector.set(matrix[3] * vector.x - matrix[1] * vector.y,
               matrix[0] * vector.y - matrix[2] * vector.x);
};

Agatha.squish = function() {
    // Get vertex information
    var baseGeomVerts = this.vars.titBaseGeom.vertices;
    var titVertsA = this.objects[2].geometry.vertices;
    var titVertsB = this.objects[3].geometry.vertices;

    // Get position and rotation of tit A
    var titPosA = this.vars.titPosA;
    titPosA.set(this.objects[2].position.x, this.objects[2].position.y);
    var titRotA = this.objects[2].rotation.z;
    var rotMatA = [Math.cos(titRotA), -1 * Math.sin(titRotA),
                   Math.sin(titRotA), Math.cos(titRotA)];
    // Get position and rotation of tit B
    var titPosB = this.vars.titPosB;
    titPosB.set(this.objects[3].position.x, this.objects[3].position.y);
    var titRotB = this.objects[3].rotation.z;
    var rotMatB = [Math.cos(titRotB), -1 * Math.sin(titRotB),
                   Math.sin(titRotB), Math.cos(titRotB)];
    
    // Find deformation vectors for tit collision
    var squishTitA = this.vars.squishTitA;
    squishTitA.copy(titPosA);
    squishTitA.sub(titPosB);
    var titDifference = squishTitA.length() - this.vars.titSize*2;
    if(titDifference<0) { squishTitA.setLength(titDifference*0.5); }
    var squishTitB = this.vars.squishTitB;
    squishTitB.copy(squishTitA);
    squishTitB.multiplyScalar(-1);
    // Make vectors and angles local to tit
    this.rotate2DMatrixInv(squishTitA, rotMatA);
    this.rotate2DMatrixInv(squishTitB, rotMatB);
    var squishTitAngleA = squishTitA.angle();
    var squishTitAngleB = squishTitB.angle();

    // Get the local platter position
    var squishPlatterA = this.vars.squishPlatterA;
    squishPlatterA.copy(titPosA);
    var squishPlatterB = this.vars.squishPlatterB;
    squishPlatterB.copy(titPosB);
    this.rotate2DMatrixInv(squishPlatterA, rotMatA);
    this.rotate2DMatrixInv(squishPlatterB, rotMatB);

    // Get the local nipple deformation
    var squishNippleA = this.vars.squishNippleA;
    squishNippleA.x = this.vars.nippleA.position.x;
    squishNippleA.y = this.vars.nippleA.position.y;
    var squishNippleB = this.vars.squishNippleB;
    squishNippleB.x = this.vars.nippleB.position.x;
    squishNippleB.y = this.vars.nippleB.position.y;
    squishNippleA.sub(titPosA);
    squishNippleB.sub(titPosB);
    this.rotate2DMatrixInv(squishNippleA, rotMatA);
    this.rotate2DMatrixInv(squishNippleB, rotMatB);


    for ( var i = 0; i < baseGeomVerts.length; i ++ ) {
        // Reset vertex for squishing
        titVertsA[i].copy(baseGeomVerts[i]);
        titVertsB[i].copy(baseGeomVerts[i]);
        // Deform vertex using other tit, platter,  and nipple
        if(titDifference < 0){
            this.squishTit(titVertsA[i], squishTitA, squishTitAngleA);
            this.squishTit(titVertsB[i], squishTitB, squishTitAngleB);
        }
        this.squishPlatter(titVertsA[i], squishPlatterA);
        this.squishPlatter(titVertsB[i], squishPlatterB);
        this.squishNipple(titVertsA[i], squishNippleA);
        this.squishNipple(titVertsB[i], squishNippleB);

    }

    this.objects[2].geometry.verticesNeedUpdate = true;
    this.objects[3].geometry.verticesNeedUpdate = true;
};

Agatha.squishTit = function(vertex, amount, angle) {
    var maxHeight = 5;
    if(vertex.z > maxHeight) { return; }
    var vertex2D = this.vars.vertex2D;
    // Get world transform of vertex
    vertex2D.set(vertex.x, vertex.y);
    // Calculate which vertices will squish
    var  vertexAngle = vertex2D.angle();
    var ratio = this.diffAngle(vertexAngle, angle) / (Math.PI/2);
    ratio = 1-Math.min(ratio,1);
    if(ratio !== 0) {
        ratio *= (maxHeight-vertex.z)/maxHeight;
        // Squish vertices in world space
        vertex2D.sub(amount);
        // Apply changes to mesh
        vertex.x = ratio*vertex2D.x + (1-ratio)*vertex.x;
        vertex.y = ratio*vertex2D.y + (1-ratio)*vertex.y;
    }
};

Agatha.squishPlatter = function(vertex, titPos){
    var maxHeight = 5;
    if(vertex.z > maxHeight) { return; }
    var vertex2D = this.vars.vertex2D;
    // Get transform of vertex
    vertex2D.set(vertex.x, vertex.y);
    // Add local position
    vertex2D.add(titPos);
    var distance = vertex2D.length();
    if(distance>this.vars.platterSize){
        vertex2D.setLength(distance-this.vars.platterSize);
        // Take height into account
        var zScale = (maxHeight-vertex.z)/8;
        // Apply to mesh
        vertex.x -= vertex2D.x;
        vertex.y -= vertex2D.y;    
    }
};

Agatha.squishNipple = function(vertex, amount){
    var minHeight = 3;
    if(vertex.z < minHeight) { return; }
    var vertex2D = this.vars.vertex2D;
    // Get transform of vertex
    vertex2D.set(vertex.x, vertex.y);
    vertex2D.add(amount);
    var ratio = (vertex.z-minHeight)/minHeight;
    // Apply changes to mesh
    vertex.x = ratio*vertex2D.x + (1-ratio)*vertex.x;
    vertex.y = ratio*vertex2D.y + (1-ratio)*vertex.y;
};

Agatha.onPress = function(mousePos,intersects) {
    this.vars.mousePosOnPress = mousePos;
    this.vars.targetRotationOnPress = mousePos;
    this.vars.grabbed = true;
};

Agatha.onMove = function(mousePos,intersects) {
    if (this.vars.grabbed === true) {
        this.vars.targetRotation.copy(this.vars.targetRotationOnPress);
        this.vars.targetRotation.add(mousePos);
        this.vars.targetRotation.sub(this.vars.mousePosOnPress);
        this.vars.targetRotation.y *= -1;
        this.vars.targetRotation.clampScalar(-0.4,0.4);
    }
};

Agatha.onRelease = function() {
    this.vars.grabbed = false;
};

saintLoader.add(Agatha);

var Sebastian = new Saint();
Sebastian.addMesh('Arrow','resources/sebastian/Arrow.js');
Sebastian.addMesh('Torso','resources/sebastian/Sebastian_Torso.js');
Sebastian.addMesh('Hips','resources/sebastian/Sebastian_Hips.js');
Sebastian.addMesh('Butt','resources/sebastian/butt.js');
Sebastian.addMesh('Sebstian','resources/sebastian/Sebastian.js');

Sebastian.init = function(){
    // CAMERA
    this.camera = new THREE.PerspectiveCamera(10, WIDTH / HEIGHT, 1, 1000 );
    this.camera.position.y = 47;
    this.camera.position.z = 1.8;
    this.camera.position.x = 0;
    this.camera.up = new THREE.Vector3(0,0,-1);
    this.camera.lookAt(new THREE.Vector3(-0.4,0,2.3));
    this.cameraParent = new THREE.Object3D();
    this.cameraParent.add(this.camera);
    scene.add(this.cameraParent);

    // LIGHTS
    var spotlight = new THREE.SpotLight( 0xffffff);
    spotlight.intensity = 1.5;
    spotlight.position.set(22,40,-10);
    spotlight.exponent=0;
    spotlight.distance = 200;
    spotlight.shadow.camera.near  = 0.1;     
    spotlight.castShadow = true;
    //spotlight.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 15, 1, .1, 200 ) );
    spotlight.shadow = new THREE.DirectionalLightShadow();
    //spotlight.shadow.mapSize.width = 1024;
    //spotlight.shadow.mapSize.height = 1024;
    //spotlight.shadow.mapSize.set(2048,2048); // default is 512
    //spotlight.shadow.bias = 0
    
    this.lights.push(spotlight); scene.add(this.lights[0]);

    this.objects[0].castShadow= true;
    this.objects[0].receiveShadow = false;
    
    // Add skinned Sebastian mesh
    var name = this.objects[4].name;
    var geometry = this.objects[4].geometry;
    var material = this.objects[4].material;
    material.skinning = true;
    var skinnedMesh = new THREE.SkinnedMesh(geometry,material);
    skinnedMesh.name = name;
    this.objects[4] = skinnedMesh;
    this.objects[4].castShadow = false;
    this.objects[4].receiveShadow = true;
    scene.add(this.objects[4]); // Sebastian
    this.objects[4].geometry.dynamic = true;
    
    
    // Add collision meshes Torso and Hips as well as Butt mesh
    var transparentMat = new THREE.MeshBasicMaterial({transparent: true, 
                                                      opacity:0});
    this.objects[1].material = transparentMat;
    this.objects[2].material = transparentMat;    
    
    THREE.SceneUtils.attach(this.objects[1], scene,
                            this.objects[4].skeleton.bones[1]); // Torso
    THREE.SceneUtils.attach(this.objects[2], scene,
                            this.objects[4].skeleton.bones[2]); // Hips
    THREE.SceneUtils.attach(this.objects[3], scene,
                        this.objects[4].skeleton.bones[2]); // Butt
};

Sebastian.makePhysics = function(){
    var rotStiff = 5;
    var rotDamp = 100;
    var bodyDamp = 0.5;
    
    var world = new p2.World({ doProfiling : true, gravity : [0,0] });
    world.solver.tolerance = 0.001;

    var vars = { fixedRotation:true,  mass:1, damping:bodyDamp, position:[0,0] };
    var box1 = new p2.Body(vars);
    var box2 = new p2.Body(vars);

    vars = { fixedRotation:true, mass:0, position:[0,0] };

    var fixed = new p2.Body(vars);

    world.addBody(box1);
    world.addBody(box2);
    world.addBody(fixed);

    // Create circle
    var radius = 1;
    var circleShape1 = new p2.Circle({radius: radius});
    var circle1 = new p2.Body({ mass:1, angularDamping:0.9, position:[0, 0] });
    circle1.addShape(circleShape1);
    world.addBody(circle1);

    // Create circle
    var circleShape2 = new p2.Circle({radius: radius});
    var circle2 = new p2.Body({ mass:1, angularDamping:0.9, position:[0, 0] });
    circle2.addShape(circleShape2);
    world.addBody(circle2);

    // Disable collisions
    var CIRCLE  = 1,
        OTHER = 8;
    circleShape1 .collisionGroup = CIRCLE;
    circleShape1 .collisionMask  = OTHER;
    circleShape2 .collisionGroup = CIRCLE;
    circleShape2 .collisionMask  = OTHER;

    //RoationalJoint 1
    var rotationalSpring_A = new p2.RotationalSpring(box1, circle1, {
        stiffness : rotStiff,
        angularDamping: rotDamp
    });
    world.addSpring(rotationalSpring_A);
    var revolute_A = new p2.RevoluteConstraint(box1, circle1, {
        localPivotA: [0, 0],
        localPivotB: [0, 0],
        collideConnected:false
    });
    world.addConstraint(revolute_A);

    //RoationalJoint2
    var rotationalSpring_B = new p2.RotationalSpring(box2, circle2, {
        stiffness : rotStiff,
        angularDamping: rotDamp
    });
    world.addSpring(rotationalSpring_B);
    var revolute_B = new p2.RevoluteConstraint(box2, circle2, {
        localPivotA: [0, 0],
        localPivotB: [0, 0],
        collideConnected:false
    });
    world.addConstraint(revolute_B);

    var rotationalSpring_C = new p2.RotationalSpring(circle1, circle2, {
        stiffness : 10,
        damping: 100
    });
    world.addSpring(rotationalSpring_C);

    var linearSpring = new p2.LinearSpring(box1, box2, {
        restLength : 0,
        stiffness : 5,
        damping:20,
        localAnchorA : [0,0],
        localAnchorB : [0,0]
    });
    world.addSpring(linearSpring);

    var s2 = new p2.LinearSpring(box1, fixed, {
        restLength : 0,
        stiffness : 30,
        damping:10,
        localAnchorA : [0,0],
        localAnchorB : [0,0]
    });
    world.addSpring(s2);

    var s3 = new p2.LinearSpring(box2, fixed, {
        restLength : 0,
        stiffness : 40,
        damping:10,
        localAnchorA : [0,0],
        localAnchorB : [0,0]
    });
    world.addSpring(s3);

    this.vars.world = world;
    this.vars.oldTime = Date.now();
    this.vars.arrowCoolDown = 0;
    this.vars.arrowLive = false;
    this.vars.arrow = new THREE.Object3D();
    this.vars.arrowSteps = 16;
    this.vars.arrowDist = 30;
    this.vars.raycaster = new THREE.Raycaster();
    this.vars.raycaster.far = 2;
    this.vars.xAxis = new THREE.Vector3(1,0,0);
    this.vars.yAxis = new THREE.Vector3(0,1,0);
    this.vars.boneRot1 = this.objects[4].skeleton.bones[1].rotation.clone();
    this.vars.boneMatrix2 = this.objects[4].skeleton.bones[2].matrixWorld.clone();
    //Empty variables to cut down on creation of temporary variables
    this.vars.vector = new THREE.Vector3();
};

// Rotate an object around an arbitrary axis in world space       
Sebastian.rotateAroundWorldAxis = function(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    object.matrix.multiply(rotWorldMatrix);                // pre-multiply 
    object.rotation.setFromRotationMatrix(object.matrix,'XYZ');
};

Sebastian.animate = function(){

    frameMS = Math.min((Date.now() - this.vars.oldTime)/1000, 1/30);
    this.vars.world.step(frameMS);
    this.vars.oldTime=Date.now();

    var c1 = this.vars.world.bodies[3];
    var c2 = this.vars.world.bodies[4];
    var bone1 = this.objects[4].skeleton.bones[1];
    var bone2 = this.objects[4].skeleton.bones[2];
    var pushVector = this.vars.vector;

    pushVector.set(c1.position[0]*-1,c1.position[1]*-1,0);
    bone1.matrix.makeRotationFromEuler(this.vars.boneRot1);
    this.rotateAroundWorldAxis(bone1, this.vars.xAxis, pushVector.y*100);
    this.rotateAroundWorldAxis(bone1, this.vars.yAxis, pushVector.x*100);
    bone1.rotation.z+=c1.angle*-50;

    pushVector.set(c2.position[0]*-1,c2.position[1]*-1,0);
    bone2.matrix.getInverse(bone2.parent.matrixWorld);
    bone2.matrix.multiplyMatrices(bone2.matrix,this.vars.boneMatrix2);
    this.rotateAroundWorldAxis(bone2, this.vars.xAxis, pushVector.y*100);
    this.rotateAroundWorldAxis(bone2, this.vars.yAxis, pushVector.x*100);
    bone2.rotation.z += c2.angle*-50;
    this.objects[4].geometry.verticesNeedUpdate = true;
    this.objects[4].geometry.normalsNeedUpdate = true;

    if(this.vars.arrowCoolDown>0){
        this.vars.arrowCoolDown -=1;
        if(this.vars.arrowLive){
            var direction = this.vars.vector;
            direction.set(0, 0, 100);
            this.vars.arrow.localToWorld(direction);
            var origin = this.vars.arrow.position.clone();

            direction = direction.sub(origin).normalize();
            this.vars.raycaster.far = 2 * (frameMS/(1/60));
            this.vars.raycaster.set(origin,direction);

            var rayMask = [this.objects[1],this.objects[2]];
            var dist = this.vars.arrowDist/this.vars.arrowSteps;
            dist *= frameMS/(1/60);

            hitArray = this.vars.raycaster.intersectObjects(rayMask);

            if (hitArray.length>0){
                this.vars.arrowLive = false;
                THREE.SceneUtils.attach(this.vars.arrow, scene, hitArray[0].object);
                origin = hitArray[0].point.clone();
                direction.multiplyScalar(2);
                if(hitArray[0].object.uuid==this.objects[1].uuid){
                    c1.applyForce([direction.x, direction.y],
                                  [origin.x, origin.y]);
                }
                else{
                    c2.applyForce([direction.x, direction.y],
                                  [origin.x, origin.y]);
                }

                dist = dist/2.0;
                this.vars.arrow.translateZ(dist);
            }
            else{
                this.vars.arrow.translateZ(dist);
            }
        }
    }
    else if(this.vars.arrowLive){
        scene.remove(this.vars.arrow);
        this.vars.arrowLive = false;
    }
};

Sebastian.onPress = function(mousePos,intersects){
    if (this.vars.arrowLive === false){
        // Create new arrow object
        this.vars.arrow = this.objects[0].clone();
        // Use mouse position as arrow origin
        arrowOriginX = mousePos.x*2 + this.camera.position.x;
        arrowOriginZ = this.camera.position.z - 1.25*mousePos.y;
        arrowOriginY =  camera.position.y -25;
        this.vars.arrow.position.x=arrowOriginX;
        this.vars.arrow.position.y=arrowOriginY;
        this.vars.arrow.position.z=arrowOriginZ;

        // Aim at random place in a cylinder of h=3,r=2
        var zPos = (Math.random()*2*3) - 3 + 2;
        var angle = (Math.random()*2*Math.PI);
        var radius = Math.random()*2; 
        var xPos = radius*Math.sin(angle);
        var yPos = radius*Math.cos(angle);
        var translation = new THREE.Vector3( xPos, yPos, zPos);
        this.vars.arrow.lookAt(translation);

        scene.add(this.vars.arrow);
        this.vars.arrowLive = true;
        this.vars.arrowCoolDown = this.vars.arrowSteps;
    }
};

saintLoader.add(Sebastian);

var Bartholemew = new Saint();
Bartholemew.addMesh('Skin','resources/bartholemew/Bicep.js');
Bartholemew.addMesh('Skeleton','resources/bartholemew/underskin.js');

Bartholemew.init = function(){
    // CAMERA
    this.camera = new THREE.PerspectiveCamera(37, WIDTH / HEIGHT,
                                              0.1, 10000 );
    this.camera.position.y = 200;
    this.camera.position.z = 1200;
    this.camera.position.x = 10;
    this.camera.rotation.x = -0.08;
    this.camera.rotation.y = 0.01;
    this.camera.name = 'MainCam';

    // LIGHTS
    var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.7 );
    hemiLight.name = "HemisphereLight";
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 500, 0 );

    var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.name = "DirectionalLight";
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 300 );
    this.lights.push(dirLight);
    this.lights.push(hemiLight);
    scene.add(this.lights[0]);
    scene.add(this.lights[1]);

    // OBJECTS
    this.objects[0].position.set(75, -105, 0);
    this.objects[0].rotation.set(-0.02, 0.18, -0.08);
    scene.add(this.objects[0]);
    this.objects[0].add(this.objects[1]);
};

Bartholemew.makePhysics = function(){
    // Forearm obstacle
    var forearm = new THREE.Object3D();
    forearm.name = 'Forearm';
    forearm.position.set(-270.73, 234.08, -246.32);
    forearm.rotation.set(1.81, 0.36, -0.12);
    forearm.scale.set(0.31, 0.32, 0.92);
    // Bicep obstacle
    var bicep = new THREE.Object3D();
    bicep.name = 'Bicep';
    bicep.position.set(-91.48, 129.15, -289.03);
    bicep.rotation.set(1.12, -1.02, 0.90);
    bicep.scale.set(0.36, 0.49, 0.70);
    // Shoulder obstacle
    var shoulder = new THREE.Object3D();
    shoulder.name = 'Shoulder';
    shoulder.position.set(35.83, 224.49,-288.32);
    shoulder.rotation.set(1.56,-1.08, 0.3);
    shoulder.scale.set(0.44, 0.55, 0.69);
    // Pectoral obstacle
    var pectoral = new THREE.Object3D();
    pectoral.name = 'Pectoral';
    pectoral.position.set(222.82, 164.83,-203.67);
    pectoral.rotation.set(0.66,0.42,-0.2);
    pectoral.scale.set(1, 0.53, 1.17);
    // Chest obstacle
    var chest = new THREE.Object3D();
    chest.name = 'Chest';
    chest.position.set(201.32, 93.43,-247.07);
    chest.rotation.set(0.8,-0.14,1.18);
    chest.scale.set(1, 0.79, 1.39);
    // Belly obstacle
    var belly = new THREE.Object3D();
    belly.name = 'Belly';
    belly.position.set(235.58, -119.96,-144.13);
    belly.rotation.set(1.68,-0.06,0.64);
    belly.scale.set(0.75, 0.68, 1.7);
    var obstacles = [forearm,bicep,shoulder,chest,pectoral,belly];

    this.vars.cloth = new MeshCloth(this.objects[0].geometry, obstacles);
    this.vars.INTERSECTED = new THREE.Object3D();
    this.vars.selectedFace = new THREE.Face3();
    this.vars.intersectPoint = new THREE.Vector3();
    this.vars.grabbed = false;
    this.vars.mouseStart =  new THREE.Vector2();
    this.vars.grabPoint = new THREE.Vector3();
};

Bartholemew.animate = function() {
    var time = Date.now();
    var Bartholemew = this.objects[0];
    if(typeof this.vars.cloth != 'undefined'){
        var p = this.vars.cloth.particles;
        var indexes = [];
        for ( var i = 0, il = p.length; i < il; i ++ ) {
            indexes = this.vars.cloth.index[i];
            for(var j=0; j<indexes.length; j++) {
                Bartholemew.geometry.vertices[indexes[j]].copy(p[i].position);
            }
        }

        Bartholemew.geometry.computeFaceNormals();
        Bartholemew.geometry.computeVertexNormals();
        Bartholemew.geometry.normalsNeedUpdate = true;
        Bartholemew.geometry.verticesNeedUpdate = true;
        Bartholemew.geometry.computeBoundingSphere();
        
        simulate(time,this.vars.cloth);
    }
};

Bartholemew.getGrabPoint = function(mousePos) {
    var mouseDiff = mousePos.clone();
    mouseDiff.sub(this.vars.mouseStart);
    mouseDiff.multiplyScalar(2);
    var vector = new THREE.Vector3();
    vector.set(mousePos.x+mouseDiff.x, mousePos.y+mouseDiff.y,0.5 );
    vector.unproject(camera);
    var dir = vector.sub( camera.position ).normalize();
    var distance = - camera.position.z / dir.z;
    this.vars.grabPoint = camera.position.clone();
    this.vars.grabPoint.add( dir.multiplyScalar( distance ) );
    if(this.vars.grabbed){
        this.vars.cloth.grabFromFace(this.vars.selectedFace,
                                        this.vars.grabPoint);
    }
};

Bartholemew.onPress = function(mousePos,intersects){
    if ( intersects.length > 0 && intersects[0].object.name == "Skin" ) {
        this.vars.INTERSECTED = intersects[0].object;
        this.vars.selectedFace = intersects[0].face;
        this.vars.intersectPoint = intersects[0].point;
        this.vars.grabbed = true;
    } 
    else {
        this.vars.INTERSECTED = null;
    }
    this.getGrabPoint(mousePos);
};

Bartholemew.onRelease = function(){
    this.vars.grabbed = false;
    this.vars.cloth.grab = [];
    this.vars.INTERSECTED = null;
    if(typeof this.vars.cloth != 'undefined') { this.vars.cloth.grab=[]; }
};

Bartholemew.onMove = function(mousePos,intersects){
    this.getGrabPoint(mousePos);
};

saintLoader.add(Bartholemew);

saintLoader.load();