
/*

    specialKeys: {
         8: "backspace",  9: "tab",      10: "return",   13: "return", 
        16: "shift",     17: "ctrl",     18: "alt",      19: "pause",
        20: "capslock",  27: "esc",      32: "space",    33: "pageup", 
        34: "pagedown",  35: "end",      36: "home",     37: "left",    
        38: "up",        39: "right",    40: "down",     45: "insert", 
        46: "del",       96: "0",        97: "1",        98: "2", 
        99: "3",         100: "4",      101: "5",       102: "6", 
        103: "7",        104: "8",      105: "9",       106: "*", 
        107: "+",        109: "-",      110: ".",       111: "/", 
        112: "f1",       113: "f2",     114: "f3",      115: "f4", 
        116: "f5",       117: "f6",     118: "f7",      119: "f8", 
        120: "f9",       121: "f10",    122: "f11",     123: "f12", 
        144: "numlock",  145: "scroll", 186: ";",       191: "/",
        220: "\\",       222: "'",      224: "meta"
    },
 
*/

// Singleton to handle mouse and key inputs from user
var InputHandler = {
    // Variables:
    lastScrollTop: 0,
    lastScrollLeft: 0,
    scrollDirection: null,
    mouseWheelEvents: 0,
    mousedownX: false,
    // Attached Objects:
    pipelineDirector: null,
    selector: null,
    visualizer: null,
    // Init:
    initialize: function(){
        // Variables:
        var that = this;
        this.lastScrollTop = $(window).scrollTop();
        this.lastScrollLeft = $(window).scrollLeft();
    
        // Bind scrollEvent to window.scroll:
        $(window).scroll( function(){
        //$('#ScrollOverflow').scroll( function(){
            that.scrollEvent();
        });
        // Mousewheel:
         $('body').on('mousewheel', function(e, delta, deltaX, deltaY){
        //$('#ScrollOverflow').on('mousewheel', function(e, delta, deltaX, deltaY){
            that.mouseWheelDetected();
        }); 
        $('body').on('wheel', function(e, delta, deltaX, deltaY){
        //$('#ScrollOverflow').on('wheel', function(e, delta, deltaX, deltaY){
            that.mouseWheelDetected();
        }); 
        // Mouse clicks:
        $('document').on('touchmove', function(e){
            // pass
        })
        $('body').mousedown(function(e){
            //that.mousedownDetected(e);
        });
        $('body').mouseup(function(e){
            //that.mouseupDetected(e);
        });
        // Move up keys:
        $(document).bind('keydown', 'left',function(e){
            e.preventDefault();
            that.moveUp();
        });
        $(document).bind('keydown', 'up',function(e){
            e.preventDefault();
            that.moveUp();
        });
        $(document).bind('keydown', 'pageup',function(e){
            e.preventDefault();
            that.moveUp();
        });
        // Move down keys:
        $(document).bind('keydown', 'right',function(e){
            e.preventDefault();
            that.moveDown();
        });
        $(document).bind('keydown', 'down',function(e){
            e.preventDefault();
            that.moveDown();
        });
        $(document).bind('keydown', 'pagedown',function(e){
            e.preventDefault();
            that.moveDown();
        });
    },
    // Methods:
    mouseWheelDetected: function(){
        this.mouseWheelEvents +=1;
    },
    mousedownDetected: function(e){
        // If cursor moves more than an accidental amount,
        // flow to left or right:
        // touchstart for mobile
        e.preventDefault();
        this.mousedownX = e.pageX;
    },
    mouseupDetected: function(e){
        if (this.mousedownX){
            e.preventDefault();
            var mouseupX = e.pageX;
            var intentional = 20;
            if (mouseupX - this.mousedownX > intentional){
                this.moveUp();
            } else if (this.mousedownX - mouseupX > intentional){
                this.moveDown();
            }
        }
        this.mousedownX = false;
    },
    scrollEvent: function(){
        // Instead of firing everytime the scroll changes, 
        // fire at most once per wheel event
        var scrollLeft = $(window).scrollLeft();
        if (this.mouseWheelEvents > 0){
            // Check for horizontal scroll first:
            if (scrollLeft !== this.lastScrollLeft){
                if (scrollLeft >= this.lastScrollLeft) {
                    this.moveDown();
                } else {
                    this.moveUp();
                }
            } else {
                // If no horizontal, check vertical:
                var scrollTop = $(window).scrollTop();
                if (scrollTop >= this.lastScrollTop) {
                    this.moveDown();
                } else {
                    this.moveUp();
                }
                this.lastScrollTop = scrollTop;
            }
            this.mouseWheelEvents = 0;
        } else {
            // If no mousewheel, then user used scrollbar
            // or middle mouse button to drag move.
            if (scrollLeft !== this.lastScrollLeft){
                if (scrollLeft - this.lastScrollLeft > 5) {
                    this.moveDown();
                } else if (this.lastScrollLeft - scrollLeft > 5) {
                    this.moveUp();
                }
            }
        }
        this.lastScrollLeft = scrollLeft;
    },
    moveDown: function(){
        //_.throttle(this.pipelineDirector.flowDown, 250);
        this.pipelineDirector.flowDown();
    },
    moveUp: function(){
        //_.throttle(this.pipelineDirector.flowUp, 250);
        this.pipelineDirector.flowUp();
    },
    keypressEvent: function(){

    }
} 

