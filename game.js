var score = 0;
var canScore = false;
var gameHeight = 500;

$(window).resize(function() { 
    window.resizeGame(); 
});

function resizeGame() {
    var height = $(window).height();
    var width = $(window).width();

    game.width = width;
    //game.height = height;
    game.stage.bounds.width = width;
    //game.stage.bounds.height = height;

    if (game.renderType === Phaser.WEBGL)
    {
        game.renderer.resize(width, gameHeight);
    }
}

function setCSSVisible(visible) {
    if (visible) {
        $("#wing-text").css("visibility", "visible");
        $("#wing-up-text").css("visibility", "visible");
        $("#wing-down-text").css("visibility", "visible");
    } else {
        $("#wing-text").css("visibility", "hidden");
        $("#wing-up-text").css("visibility", "hidden");
        $("#wing-down-text").css("visibility", "hidden");
    }
}

function drawBackground() {
    var myBitmap = game.add.bitmapData($(window).width(), gameHeight);

    var grd=myBitmap.context.createLinearGradient(0,0,0,gameHeight);
    grd.addColorStop(0,"#65c3fe");
    grd.addColorStop(1,"#65d7fe");
    myBitmap.context.fillStyle=grd;
    myBitmap.context.fillRect(0,0,$(window).width(), gameHeight);
    
    game.add.sprite(0, 0, myBitmap);
}

var game = new Phaser.Game($(window).width(), gameHeight, Phaser.AUTO, 'gameDiv');


var preload = function(game){};
 
preload.prototype = {
    preload: function() { 
        game.load.image("loading","assets/bird1.png");
        var loadingBar = this.add.sprite(160,240,"loading");
        loadingBar.anchor.setTo(0.5,0.5);
        this.load.setPreloadSprite(loadingBar);
        game.stage.backgroundColor = '#AADDFF';
        game.load.image('birdUp', 'assets/bird1.png');  
        game.load.image('birdDown', 'assets/bird2.png');
        game.load.image('pipeMid', 'assets/pipemid.png');
        game.load.image('pipeTop', 'assets/pipetop.png');
        game.load.image('mountains', 'assets/mountains.png')
    },
  	create: function(){
		this.game.state.start("GameTitle");
	}
};


//adds the game title
var gameTitle = function(game){}
 
gameTitle.prototype = {
  	create: function(){
        drawBackground();
        this.labelScore = this.game.add.text(90, 175, "Flappy Leap!\nFLAP to FLY", { font: "30px Arial", fill: "#000" });
		var playButton = this.game.add.button(160,320,"birdDown",this.playTheGame,this);
		playButton.anchor.setTo(1,1);
        var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        spaceKey.onDown.add(this.playTheGame, this);
	},
	playTheGame: function(){
		this.game.state.start("Game");
	}
};


var mainState = {
    // Fuction called after 'preload' to setup the game 
    create: function() { 
        drawBackground();
        setCSSVisible(false);
        
        this.mountains = this.game.add.sprite(0, gameHeight, 'mountains');
        this.mountains.anchor.setTo(0,1);
        game.physics.arcade.enable(this.mountains);
        
        this.mountains.body.velocity.x = -10;
        // Set the physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // Call the 'jump' function when the spacekey is hit
        var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        spaceKey.onDown.add(this.jump, this); 

        this.pipes = game.add.group();
        this.pipes.enableBody = true;
        this.pipes.createMultiple(100, 'pipeMid');  
        
        // Display the bird on the screen
        this.bird = this.game.add.sprite(100, 245, 'birdUp');
        
        // Add gravity to the bird to make it fall
        game.physics.arcade.enable(this.bird);
        this.bird.body.gravity.y = 1000; 

        // Timer that calls 'addBlockColumn' ever 1.5 seconds
        this.timer = this.game.time.events.loop(1500, this.addBlockColumn, this);           

        // Add a score label on the top left of the screen
        score = 0;
        this.labelScore = this.game.add.text(20, 20, "0", { font: "30px Arial", fill: "#000" });  
    },

    // This function is called 60 times per second
    update: function() {
        if(!this.bird.alive) {
            this.bird.angle += 30;
        }
        
        if (this.bird.inWorld == false)
            this.endGame(); 
        // If the bird overlap any pipes, call 'endGame'
        game.physics.arcade.overlap(this.bird, this.pipes, this.collision, null, this);  
        
        if(this.bird.angle < 20 && this.bird.alive)
            this.bird.angle += 1.5;
        
        //TODO: Refactor this 
        this.pipes.forEachAlive(function(p){
            if(p.x + 50 < this.bird.body.x && canScore) {
                score += 1;
                canScore = false;
            }
        }, this);
        
        this.labelScore.text = score;  
        
    },

    
    // Make the bird jump 
    jump: function() {
        if(!this.bird.alive)
            return;
        
        this.setWings('up');
        this.bird.body.velocity.y = -500;
        
        
        this.bird.anchor.setTo(-0.2, 0.5);
        game.add.tween(this.bird).to({angle: -24}, 100).start();
    },
    
    setWings: function(state) {
        if (state === 'up')
            this.bird.loadTexture('birdUp', 0);
        else 
            this.bird.loadTexture('birdDown', 0);
    },
    
    collision: function() {
        if(!this.bird.alive) 
            return;
        this.bird.alive = false;
        
        this.bird.body.velocity.y = -500;
        this.bird.body.gravity.y = 2000;
        
        game.time.events.remove(this.timer);
        
        this.mountains.body.velocity.x = 0;
        this.pipes.forEachAlive(function(p){
            p.body.velocity.x = 0;
        }, this);
        
    },

    
    //Game ends
    endGame: function() {
        game.state.start('GameOver');
    },

    
    // Add a pipe on the screen
    addBlock: function(x, y) {
        // Get the first dead pipe of our group
        var pipe = this.pipes.getFirstDead();

        // Set the new position of the pipe
        pipe.reset(x, y);

        // Add velocity to the pipe to make it move left
        pipe.body.velocity.x = -370; 
               
        // Kill the pipe when it's no longer visible 
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    },

    
    // Add a row of pipes with a gap somewhere in the middle
    addBlockColumn: function() {
        canScore = true;
        var gap = Math.floor(Math.random()*7)+1;
        
        for (var i = 0; i < 10; i++)
            if (i != gap -1 && i != gap && i != gap +1) 
                this.addBlock($(window).width(), i*50);   
    },
};


var gameOver = function(game){}
gameOver.prototype = {
  	create: function(){
        drawBackground();
        setCSSVisible(true);
		this.labelScore = this.game.add.text(90, 175, 
                                             "Game Over!\n   Score: " 
                                             + score 
                                             + "\nFLAP to FLY", { font: "30px Arial", fill: "#000" });
		var playButton = this.game.add.button(160,320,"birdDown",this.playTheGame,this);
		playButton.anchor.setTo(0.5,0.5);
        var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        spaceKey.onDown.add(this.playTheGame, this);
	},
	playTheGame: function(){
		this.game.state.start("Game");
	}
}

game.state.add('Preload', preload);
game.state.add('GameTitle', gameTitle);
game.state.add('Game', mainState); 
game.state.add('GameOver', gameOver);
game.state.start('Preload'); 