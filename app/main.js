var canvas;
var bounce_factor = 0.8;
var mass = 10;
var gravity = 10;
var radius = 15;
var width = $('#myCanvas').width(); /// width of canvas
var height = $('#myCanvas').height(); // height of canvas
var timestep = 0.005;
var balls = [];
var MinMaxForce = [-1000, 1000];



var Ball = (function (xpos, ypos) {

    // position, velocity and acceleration vectors
    var coords = [xpos, ypos];
    var last_coords = [0, 0];
    var velocity = [0, 0];
    var accel = [0, 0];
    var color = getRandomColor();

    // Forces acting on the ball as array of:
    // [x, y, time]  if time==false, the force is always present.
    // time is a 'time to live', in seconds.
    var forces = [
      [0, gravity * mass, false],
    ];

    // Moves the ball for the given timestep with the overall force given as
    // resolved_force.
    // This is a differential equation which we evaluate using Velocity-Verlet
    // integration,
    // http://en.wikipedia.org/wiki/Verlet_integration#Velocity_Verlet
    function move(dt, resolved_force) {
        var coords_new = [coords[0] + velocity[0] * dt + 0.5 * accel[0] * dt * dt,
                  coords[1] + velocity[1] * dt + 0.5 * accel[1] * dt * dt
        ];
        // f = ma
        var accel_new = [resolved_force[0] / (mass * dt),
          resolved_force[1] / (mass * dt)];

        coords = coords_new;

        velocity = [velocity[0] + 0.5 * (accel[0] + accel_new[0]) * dt,
          velocity[1] + 0.5 * (accel[1] + accel_new[1]) * dt];

        accel = accel_new;
        
    }


    // very simple collision detection and response for rebounding off the walls
    // and applying some damping according to bounce_factor
    function do_collision_detection() {
        if (coords[0] <= radius) {
            coords[0] = radius;
            velocity[0] *= -bounce_factor;
            velocity[1] *= bounce_factor;
        }
        if (coords[0] >= width - radius) {
            coords[0] = width - radius;
            velocity[0] *= -bounce_factor;
            velocity[1] *= bounce_factor;
        }
        if (coords[1] <= radius) {
            coords[1] = radius;
            velocity[0] *= bounce_factor;
            velocity[1] *= -bounce_factor;
        }
        if (coords[1] > height - radius) {
            coords[1] = height - radius;
            velocity[0] *= bounce_factor;
            velocity[1] *= -bounce_factor;
        }
    }


    // evaluates the forces array, removes any 'dead' forces, and
    // returns the resolved force for this timestep.
    function do_forces(dt) {
        var resolved = [0, 0];
        var new_forces = [];
        for (var i = 0; i < forces.length; i++) {
            var f = forces[i];

            if (f[2] !== false)
                f[2] -= dt;

            resolved[0] += f[0];
            resolved[1] += f[1];
            if (f[2] < 0)
                continue;
            new_forces.push(f);
        }
        forces = new_forces;
        return resolved;
    }

    function getCoords() {
        return coords;
    }

    function AddForce(f) {
        forces.push(f);
    }


    return {
        AddForce: AddForce,
        do_collision_detection: do_collision_detection,
        do_forces: do_forces,
        move: move,
        getCoords: getCoords,
        color: color
    }
});

var Canvas = (function () {
    // Absolute time at last timestep
    var t0 = 0;

    // Draws the balls.
    function draw() {
        var context = get_context();
        // clear the canvas
        context.clearRect(0, 0, width, height);
        context.save();

        for (var i = 0; i < balls.length; i++) {
            var ball = balls[i]
            context.beginPath();
            context.arc(ball.getCoords()[0], ball.getCoords()[1], radius, 0, Math.PI * 2, true);
            context.closePath();
            context.fillStyle = ball.color;
            context.fill();
            context.restore();
        }
    }

    // Main loop.
    function main() {
        // calculate time elpased since last run
        var t1 = new Date().getTime();
        var dt = t1 - t0;
        dt /= 1000.0;
        if (dt < timestep)
            dt = timestep;
        t0 = t1;

        for (var i = 0; i < balls.length; i++) {
            var ball = balls[i];
            var resolved_force = ball.do_forces(dt);
            ball.move(dt, resolved_force);
            ball.do_collision_detection();
        }

        draw();
    }

    function get_context() {
        var example = $('#myCanvas')[0];
        return example.getContext('2d');
    }

    function init() {
        t0 = new Date().getTime();
        setInterval(main, timestep * 1000);
    }

    return {
        init: init
    }
});





//========================//
//  HELPERS
//========================//
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}



$(document).ready(function () {

    $('#myCanvas').click(function (e) {

        if (balls.length === 0) {
            canvas = new Canvas();
            canvas.init();
        }

        var xpos = e.pageX - $('#myCanvas').offset().left;
        var ypos = e.pageY - $('#myCanvas').offset().top;
        var ball = new Ball(xpos, ypos);
        ball.AddForce([
            randomIntFromInterval(MinMaxForce[0], MinMaxForce[1]), //random force in X-axis
            randomIntFromInterval(MinMaxForce[0], MinMaxForce[1]), //random force in Y-axis
            0.10] //perform random forces for 0.10 secs
        );
        balls.push(ball);
    });

});