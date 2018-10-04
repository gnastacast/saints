var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = 0.1;
var floorZ = -450;

var GRAVITY = 981 * 1.4; // 
var gravity = new THREE.Vector3( 0, -GRAVITY, 0 ).multiplyScalar(MASS);

var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

var RIPDIST = 6;

var tmpForce = new THREE.Vector3();

var lastTime;

function Particle(x, y, z, mass) {
	this.position = new THREE.Vector3(x, y, z);
	this.previous = new THREE.Vector3(x, y, z);
	this.original = new THREE.Vector3(x, y, z);
	this.a = new THREE.Vector3(0, 0, 0); // acceleration
	this.mass = mass;
	this.invMass = 1 / mass;
	this.tmp = new THREE.Vector3();
	this.tmp2 = new THREE.Vector3();
}

// Force -> Acceleration
Particle.prototype.addForce = function(force) {
	this.a.add( this.tmp2.copy(force).multiplyScalar(this.invMass) );
};

// Performs verlet integration
Particle.prototype.integrate = function(timesq) {
	var newPos = this.tmp.subVectors(this.position, this.previous);
	newPos.multiplyScalar(DRAG).add(this.position);
	newPos.add(this.a.multiplyScalar(timesq));
	this.tmp = this.previous;
	this.previous = this.position;
	this.position = newPos;
	this.a.set(0, 0, 0);
};

var diff3D = new THREE.Vector3();
var currentDist = 0;

function satisifyConstraints(p1, p2, distance) {
	diff3D.subVectors(p2.position, p1.position);
	currentDist = diff3D.length();
	if (currentDist === 0) { return true; } // prevents division by 0
	diff3D.multiplyScalar(1 - distance / currentDist);
	diff3D.multiplyScalar(0.5);
	p1.position.add(diff3D);
	p2.position.sub(diff3D);
	return currentDist < distance*RIPDIST;
}

function MeshCloth (geometry, obstacleObjects) {	
	// Constructor-only private copies of variables
	var verts = geometry.vertices;
	var faces = geometry.faces;
	var uniqueVerts = findUniqueVerts();
	var numVerts = uniqueVerts.length;
	var obstacles =[];
	var obstaclesInv = [];
	var inv = new THREE.Matrix4();
	var i=0;
	for(i=0; i<obstacleObjects.length; i++){
		obstacleObjects[i].updateMatrix();
		obstacles.push(obstacleObjects[i].matrix.clone());
		inv.getInverse(obstacleObjects[i].matrix);
		obstaclesInv.push(inv.clone());
	}
	// Create particles
	var particles = [];
	for (i = 0; i < numVerts; i ++) {
		var vertex = verts[uniqueVerts[i][0]];
		particles.push(new Particle(vertex.x, vertex.y, vertex.z, MASS));
	}
	
	// Create Constraints
	var edges = findEdges();
	var constraints = [];
	for (i = 0; i < edges.length; i++) {
		var vert1 = verts[uniqueVerts[edges[i][0]][0]];
		var vert2 = verts[uniqueVerts[edges[i][1]][0]];
		constraints.push([
			particles[edges[i][0]],
			particles[edges[i][1]],
			vert1.distanceTo(vert2),
			[edges[i][0],edges[i][1]]
		]);
	}
	
	// Create public variables
	this.obstacles = obstacles;
	this.obstaclesInv = obstaclesInv;
	this.particles = particles;
	this.constraints = constraints;
	this.index = uniqueVerts;
	this.pins = [];
	for(i = 0; i<uniqueVerts.length; i++) { this.pins.push(true); }
	this.grab = [];
	
	// Private helper function to create an integer array
	function range(start,end){
		var foo = [];
		for (i = start; i < end; i++) {
			foo.push(i);
		}
		return foo;
	}
	
	// Private helper function that creates an array of arrays.
	// Each inner array represents a unique vertex.
	function findUniqueVerts()  {
        uniqueVerts = [];
		// Create a mutable array of indices that we can splice and iterate through
		var tempVerts = range(0,verts.length);
		for(i=0; i<tempVerts.length; i++){
			//Create a new unique vertex
			uniqueVerts.push([tempVerts[i]]);
			var j = i+1;
			while(j<tempVerts.length){
				// Check if vertices are nearly identical
				if(verts[tempVerts[i]].distanceToSquared(verts[tempVerts[j]])<0.01){
					// Add index to previous unique vertex and delete it from tempVerts
					uniqueVerts[i].push(tempVerts[j]);
					tempVerts.splice(j,1);
				}
				else { j++; }
			}
		}
		return uniqueVerts;
    }
	
	// Private helper function that returns the unique version of a vertex index
	function getUniqueIndex(idx) {
		var numVerts = uniqueVerts.length;
		for(var i=0; i < numVerts; i++){
			var uniqueVert = uniqueVerts[i];
			for(var j=0; j<uniqueVert.length; j++){
				if(uniqueVert[j] == idx){
					return i;
				}
			}
		}
		console.warn("Vertex ", idx, " not found in uniqueVerts");
		return -1;
	}
	
	// checks if an edge [int,int] already exists in a list of edges
	function isEdgeUnique(stack,needle) {
		var i = -1, index = -1;
		for(i = 0; i < stack.length; i++) {
			if(stack[i][0] == needle[0] && stack[i][1] == needle[1]) {
				return false;
			}
		}
		return true;
	}
	
	// returns a list of unique edges
	function findEdges() {
		edges = [];
		numFaces = faces.length;
		numEdges = 3;
		for(var i=0; i<numFaces; i++){
			var face = [getUniqueIndex(faces[i].a),
						getUniqueIndex(faces[i].b),
						getUniqueIndex(faces[i].c)];
			for(var j=0; j<numEdges; j++){
				var newEdge = [face[j], face[(j+1) % numEdges]];
				if(newEdge[0] < newEdge[1]) { newEdge.reverse(); }
				if(isEdgeUnique(edges, newEdge)) { edges.push(newEdge); }
			}
		}
		return edges;
	}

	this.grabFromFace = function(face,point) {
		this.grab[0] = getUniqueIndex(face.a);
		this.grab[2] = getUniqueIndex(face.b);
		this.grab[1] = getUniqueIndex(face.c);
		this.grab[3] = point;
	};
}
obstacleCollisions = true;
function simulate(time, cloth) {
	if (!lastTime) {
		lastTime = time;
		return;
	}
	
	var i, il, particles, particle, pt, constraints, constrain;
	var xy, p, obstacle, obstacleInv;
	var ballSize = 220;
	var localPos = new THREE.Vector3();

	for (particles = cloth.particles, i = 0, il = particles.length; i < il; i ++) {
		// Pin Constraints
		if(cloth.pins[i]){
			p = particles[i];
			p.position.copy(p.original);
			p.previous.copy(p.original);
		}
		
		else{
			// Gravity
			particle = particles[i];
			particle.addForce(gravity);
			particle.integrate(TIMESTEP_SQ);

			// Floor Constraints
			pos = particle.position;
			if (pos.y < floorZ) {
				pos.y = floorZ;
			}

			if(obstacleCollisions){
				for(var j=0; j<cloth.obstacles.length; j++){
					localPos = pos.clone();
					// Ball Constraints
					obstacle = cloth.obstacles[j];
					obstacleInv = cloth.obstaclesInv[j];
					localPos = localPos.applyMatrix4(obstacleInv).clone();
					mag = localPos.length();
					if (mag < ballSize) {
						// collided
						localPos.setLength(ballSize);
						localPos = localPos.applyMatrix4(obstacle).clone();
						pos.multiplyScalar(3);
						pos.add(localPos);
						pos.multiplyScalar(0.25);
					}
				}
			}
		}
			
	}

	// grab Constraints of type [int,THREE.Vector3]
	if (cloth.grab.length>0) {
		for(i=0;i<3;i++){
		p = particles[cloth.grab[i]];
		diff3D.subVectors(cloth.grab[3],p.position);
		var correctionHalf = diff3D.multiplyScalar(1);
		p.position.add(correctionHalf);
		}
	}

	// Start Constraints
	constraints = cloth.constraints;
	il = constraints.length;
	for (i = 0; i < il; i ++) {
		constrain = constraints[i];
		if(!satisifyConstraints(constrain[0], constrain[1], constrain[2])){
			cloth.pins[constrain[3][0]] = false;
			cloth.pins[constrain[3][1]] = false;
		}
	}
}

