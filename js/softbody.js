var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = .1;
var floorZ = -450;

var GRAVITY = 981 * 1.4; // 
var gravity = new THREE.Vector3( 0, -GRAVITY, 0 ).multiplyScalar(MASS);

var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

var RIPDIST = 2;

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
	this.a.add(
		this.tmp2.copy(force).multiplyScalar(this.invMass)
	);
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
}

var diff = new THREE.Vector3();

function satisifyConstraints(p1, p2, distance) {
	diff.subVectors(p2.position, p1.position);
	var currentDist = diff.length();
	if (currentDist == 0) return true; // prevents division by 0
	var correction = diff.multiplyScalar(1 - distance / currentDist);
	var correctionHalf = correction.multiplyScalar(0.5);
	p1.position.add(correctionHalf);
	p2.position.sub(correctionHalf);
	return currentDist < distance*RIPDIST;
}

function MeshCloth (geometry) {	
	// Constructor-only private copies of variables
	var verts = geometry.vertices;
	var faces = geometry.faces;
	var uniqueVerts = findUniqueVerts();
	var numVerts = uniqueVerts.length;
	
	// Create particles
	var particles = [];
	for (i = 0; i < numVerts; i ++) {
		var vertex = verts[uniqueVerts[i][0]];
		particles.push(new Particle(vertex.x, vertex.y, vertex.z, MASS));
	}
	
	// Create Constraints
	var edges = findEdges();
	var constraints = []
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
	this.particles = particles;
	this.constraints = constraints;
	this.index = uniqueVerts;
	this.pins = range(0,uniqueVerts.length);
	this.activePins = [];
	for(i = 0; i<this.pins.length; i++)
		this.activePins.push(true);
	this.grab = [];
	
	// Private helper function to create an integer array
	function range(start,end){
		var foo = [];
		for (var i = start; i < end; i++) {
			foo.push(i);
		}
		return foo;
	};
	
	// Private helper function that creates an array of arrays.
	// Each inner array represents a unique vertex.
	function findUniqueVerts()  {
        uniqueVerts = [];
		// Create a mutable array of indices that we can splice and iterate through
		var tempVerts = range(0,verts.length);
		for(var i=0; i<tempVerts.length; i++){
			//Create a new unique vertex
			uniqueVerts.push([tempVerts[i]]);
			var j = i+1;
			while(j<tempVerts.length){
				// Check if vertices are nearly identical
				if(verts[tempVerts[i]].distanceToSquared(verts[tempVerts[j]])<.01){
					// Add index to previous unique vertex and delete it from tempVerts
					uniqueVerts[i].push(tempVerts[j]);
					tempVerts.splice(j,1);
				}
				else j++;
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
	}
	
	// checks if an edge [int,int] already exists in a list of edges
	function isEdgeUnique(stack,needle) {
		var i = -1, index = -1;
		for(i = 0; i < stack.length; i++) {
			if(stack[i][0] == needle[0] && stack[i][1] == needle[1]) {
				return false
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
				var newEdge = [face[j],face[(j+1)%numEdges]]
				if(newEdge[0]<newEdge[1]) newEdge.reverse();
				if(isEdgeUnique(edges, newEdge))
					edges.push(newEdge);
			}
		}
		return edges;
	}

	this.grabFromFace = function(face,point){
		this.grab[0] = getUniqueIndex(face.a);
		this.grab[2] = getUniqueIndex(face.b);
		this.grab[1] = getUniqueIndex(face.c);
		this.grab[3] = point;
	}
}

function simulate(time, cloth, clothGeometry) {
	if (!lastTime) {
		lastTime = time;
		return;
	}
	
	var i, il, particles, particle, pt, constraints, constrain;
	/*
	// Aerodynamics forces
	if (wind) {
		var face, faces = clothGeometry.faces, normal;

		particles = cloth.particles;

		for (i = 0,il = faces.length; i < il; i ++) {
			face = faces[i];
			normal = face.normal;
			tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(windForce));
			particles[face.a].addForce(tmpForce);
			particles[face.b].addForce(tmpForce);
			particles[face.c].addForce(tmpForce);
		}
	}
	*/

	// Start Constraints
	constraints = cloth.constraints,
	il = constraints.length;
	for (i = 0; i < il; i ++) {
		constrain = constraints[i];
		if(!satisifyConstraints(constrain[0], constrain[1], constrain[2])){
			cloth.activePins[constrain[3][0]] = false;
			cloth.activePins[constrain[3][1]] = false;
		}
	}

	var ballPosition = new THREE.Vector3();
	var ballSize = 190;

	for (particles = cloth.particles, i = 0, il = particles.length
			; i < il; i ++) {
		// Pin Constraints
		if(cloth.activePins[i]){
			var xy = cloth.pins[i];
			var p = particles[xy];
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
			// Ball Constraints
			if (diff.length() < ballSize) {
				// collided
				diff.subVectors(pos, ballPosition);
				diff.normalize().multiplyScalar(ballSize);
				pos.copy(ballPosition).add(diff);
			}
		}
			
	}

	// grab Constraints of type [int,THREE.Vector3]
	if (cloth.grab.length>0) {
		for(i=0;i<3;i++){
		var p = particles[cloth.grab[i]];
		diff.subVectors(cloth.grab[3],p.position);
		var correctionHalf = diff.multiplyScalar(.5);
		p.position.add(correctionHalf);
		}
	}
}

