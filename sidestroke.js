

    /*
     * Pipeline methods:
     * --------------------------------------------------------------------------
     * add: 
     *      Adds the current 'feed' to a location on the supplied collection
     * remove: 
     *      Removes a feed from location indicated, from the collection indicated
     * pick: 
     *      Like 'remove' but copies the item rather than removing it
     * select: 
     *      Like pick but copies an array of items
     * fill: 
     *      Like add but adds an array of items to a collection
     *
     **/
    function PipelineDirector(){ 
        this.commands = {},
        this.pipes = {},
        this.pipeConnections = [],                  
        this.connectPipes = function(pipeNames){
            var that = this;
            _.each(pipeNames, function(pipeName){
                that.pipeConnections.push(pipeName);
            }); 
        },
        this.flow = function(reverse) {
            reverse = typeof reverse !== 'undefined' ? reverse : false;
            var that = this;
            var feed = null;
            var addFeed = null;
            var removeFeed = null;
            var connections = this.pipeConnections;
            var pipesCount = connections.length;
            var removeLocation = null;
            var addLocation = null;
            if (reverse) {
                var connections = connections.slice(0);
                connections = connections.reverse();
                removeLocation = 'top';
                addLocation = 'bottom';
            } else {
                removeLocation = 'bottom';
                addLocation = 'top';
            } 
            _.each(connections, function(pipeName, idx){
                var targetPipe = that.pipes[pipeName];
                // - Remove
                if ( idx < pipesCount - 1 ){
                    // Dont remove if conditions arent met:
                    var removePermission = true;
                    var removeConditions = targetPipe.removeConditions;
                    if (typeof removeConditions !== 'undefined' ){
                        _.each(removeConditions, function(c){
                            if( c.removeLocation === removeLocation 
                                && targetPipe[c.removeIf] === false   ) {
                                    removePermission = false;
                                    return
                            }
                        });
                    }
                    // Dont remove if pipe has fullAt and isnt full:
                    var fullAt = targetPipe.fullAt;
                    if (typeof fullAt !== 'undefined'){
                        if (targetPipe.length < fullAt ) {
                            if (removeLocation === "bottom" && reverse === false ){
                                removePermission = false;
                            }
                        }
                    }

                    // Remove:
                    if (removePermission) {
                        removeFeed = that.removeFeed(pipeName + ":" + removeLocation);
                    }
                    if (removeFeed) {
                        var wasFeedRemoved = true;
                    } else {
                        var wasFeedRemoved = false;
                    }
                }
                // + Add
                if (addFeed){
                    var result = that.addFeed(addFeed, pipeName + ":" + addLocation);
                    if (result) {
                        that.setFeedAttribute(addFeed, "currentPipeName", pipeName);
                    }
                }
                // Switch feed variables:
                if (wasFeedRemoved){
                    addFeed = removeFeed;
                    removeFeed = null;
                } else {
                    addFeed = null;
                }
                that.debugPipes();
            }); //each
        },
        this.flowUp = function() {
            this.flow(true); 
        },
        this.flowDown = function(){
            this.flow();
        },
        this.runCommand = function execute(commandName, reverse){
            reverse = typeof reverse !== 'undefined' ? reverse : false;
            var that = this;
            var totalDelay = 0;
            var i = 0;
            var feed = null;
            var feeds = null;
            var commands = this.commands[commandName];
            var targets = null;
            var targetPipeName = null;
            var pipeLocation = null;
            if (reverse){
                var commandList = this.getReverseCommands(commandName);
            } else {
                var commandList = commands.commands;
            }

            function run(){
                var added = false;
                that.debugPipes();
                i += 1;
                var allUntilsMet = 1;
                if (i > 200){
                    console.log("exiting ... ");
                    return;
                }
                if (reverse) {
                    // no op
                }
                _.each(commandList, function(command){
                    var moveType = command.type;
                    targets = command.target.split(":");
                    targetPipeName = targets[0];
                    pipeLocation = targets[1];
                    targetPipe = that.pipes[targetPipeName];

                    if (reverse === true) {
                        if (moveType === "remove") {
                            moveType = "add";
                        } else if (moveType === "add") {
                            moveType = "remove";
                        }
                    }
                    
                    // Check if conditions are met first:
                    if ( typeof command.condition !== 'undefined' 
                             && !that.checkConditions(command.condition)){
                        return true;
                    };
                    // Execute various commands:
                    if (moveType === "remove"){
                        feed = that.removeFeed(command.target);
                    } else if (moveType === "add") {
                        if(added){ 
                            return; // skip
                        }
                        // Check if we've met until conditions:
                        if ( that.isUntilMet(command.until) === true ){
                            allUntilsMet = allUntilsMet * 1;
                            return true;
                        } else {
                            allUntilsMet = allUntilsMet * 0;
                        }
                        // If we have a feed, add it:
                        if (typeof feed === "undefined" || typeof feed === "null"){
                            // else...?
                        } else {
                            // Set Attributes
                            if (commands.setAttribute && commands.setAttributeValue){
                                that.setFeedAttribute( feed, 
                                                       commands.setAttribute, 
                                                       commands.setAttributeValue );
                            }
                            // Add
                            that.addFeed(feed, command.target); 
                            added = true;
                        }
                    } else if (moveType === "select" ) {
                        // TODO
                    } else if (moveType === "fill" ) {
                        // TODO
                    } else {
                        console.log(" - Unknown moveType: "+moveType);
                    }
                    that.debugPipes();
                }); // end _.each

                // Recurse if we are filling.
                if (commands.commandType === "fill" ){
                    // 'fill' will run recursively until all 'until' conditions are met
                    // (or maybe until source is empty??)
                    if (allUntilsMet !== 1) {
                        targetPipe = that.pipes[targetPipeName];
                        if (commands.hasDelay) {
                            totalDelay += commands.delay;
                            setTimeout( function(){
                                run(commandName, reverse);
                            }, commands.delay);
                        } else {
                            run(commandName, reverse);
                        }
                    }
                }
                that.debugPipes();
            }
            // Run
            run();
        },
        this.removeFeed = function(target){
            var targetPipeName = this.getTargetName(target);
            var pipeLocation = this.getTargetLoc(target);
            var targetPipe = this.pipes[targetPipeName];
            var feed = null;
            if (pipeLocation === "top") {
                feed = targetPipe.pop();
            } else {
                feed = targetPipe.shift();
            }
            if (typeof feed !== "undefined" && feed.has("pipeName")) {
                feed.set("previousPipeName", feed.get("pipeName"));
                feed.set("pipeName","");
            }
            return feed;
        },
        this.addFeed = function(feed, target){
            var targetPipeName = this.getTargetName(target);
            var pipeLocation = this.getTargetLoc(target);
            var targetPipe = this.pipes[targetPipeName];
            if (typeof feed === "undefined" || typeof feed === "null"){
                // noop
            } else {
                feed.set("addLocation", pipeLocation);
                feed.set("pipeName", targetPipeName);
                if (typeof feed === "null"){
                    // noop
                } else {
                    if (pipeLocation === "top" ){
                        targetPipe.push(feed)
                    } else {
                        targetPipe.unshift(feed);
                    }
                }
            }
            return true; // TODO: try/except and return false on failure
        },
        this.isUntilMet = function(until){
            // check if we meet an 'until' condition
            if (typeof until !== "undefined"){
                var untilSplit = until.split(":");
                var untilPipeName = untilSplit[0];
                var until = untilSplit[1];
                var untilPipe = this.pipes[untilPipeName];
                if ( untilPipe[until] === true ){
                    return true;
                }
            }
            return false;
        },
        this.setFeedAttribute = function(feed, attributeName, attributeValue){
            feed.set(attributeName, attributeValue);
            return feed;
        },
        this.checkConditions = function(condition){
            var conditions = condition.split(":");
            var conditionPipeName = conditions[0];
            var conditionName = conditions[1];
            var conditionPipe = this.pipes[conditionPipeName];
            if ( !conditionPipe[conditionName] ){
                //console.log(" - collection: " + conditionPipeName
                // + " doesnt meet condition: "+ conditionName);
                return false;
            } else {
                return true;
            }
        },
        this.getTargetName = function(target){
            return target.split(":")[0];
        },
        this.getTargetLoc = function(target){
            return target.split(":")[1];
        },
        // TODO: Be able to specify command order and have nested commands.
        this.addCommands = function(commands) {
            var that = this;
            _.each(commands, function(command) {
                that.commands[command.commandName] = command;
            });
        },
        this.getReverseCommands = function(commandName){
            var command = this.commands[commandName];
            var commands = command.commands.slice(0);
            return commands.reverse();
        },
        this.printCommands = function() {
            _.each(this.commands, function(c) {
                console.log("command name: " + c.commandName);
                _.each(c.commands, function(command){
                    console.log(command);
                });
            });
        },
        this.printPipes = function(){
            var that = this;
            _.each(this.pipes, function(pipe){
                // comment console.log(pipe);
            });
        },
        this.addPipes = function(collections) {
            var that = this;
            _.each(collections, function(c) {
                that.pipes[c.name] = c.collection;
            })
        },
        this.pipeFetch = function(pipeName, renderView){
            pipe = this.pipes[pipeName];
            pipe.fetch({
                success: function(collection, response, options){
                    renderView(collection, response, options);
                }
            });
        },
        this.onScroll = function(){
            var st = $(window).scrollTop();
            if (st > lastScrollTop) {
                // comment console.log("-------------- scrolled down --------------");
                that.onScrollDown();
            } else if(st < lastScrollTop) { 
                // comment console.log("--------------- scrolled up ---------------");
                that.onScrollUp();
            } 
            lastScrollTop = st;
        },
        this.onScrollDown = function(){ 
            this.flowDown();
        },
        this.onScrollUp = function(){ 
            this.flowUp();
        };

        this.debugPipes = function(){
            var p = $("#pipe-debugger");
            p.empty();
            p.show();
            var that = this;
            var pc = this.pipeConnections.slice(0)
            pc = pc.reverse();
            _.each(pc, function(pipeName){
                $('<div/>', {
                    id: 'debug_' + pipeName,
                    class: 'debug-pipe', 
                    text: pipeName + " " + that.pipes[pipeName].length
                }).appendTo(p);    
            });
        }
    }

        