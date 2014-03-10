

/*
 * Pipeline methods:
 * ---------------------------------------------------------------------
 * add: 
 *      Adds the current 'feed' to a location on the supplied collection
 * remove: 
 *      Removes a feed from indicated collection/location
 * pick: 
 *      Like 'remove' but copies the item rather than removing it
 * select: 
 *      Like pick but copies an array of items
 * fill: 
 *      Like add but adds an array of items to a collection
 * flow: 
 *      Moves a datum up or down the chain of pipes
 * runCommand:
 *      Runs a custom user-defined set of flow commands
 *      eg: (todo)
 * --------------------------------------------------------------------
 * Important Pipeline Properties: (todo)
 *
 **/
 var SS = (function(SS,$,_){ 
     

     SS.PipelineDirector = function(){
        // Custom commands 
        this.commands = {},

        // A hash of pipenames to pipe objects (backbone collections)
        this.pipes = {},

        // An array of pipenames as strings
        this.pipeConnections = [],           

        // Child PipelineDirectors
        this.childPipelines = [],

        // Add pipes to connections:
        this.connectPipes = function(pipeNames){
            var that = this;
            _.each(pipeNames, function(pipeName){
                that.pipeConnections.push(pipeName);
            }); 
        },

        // Move data down or up pipe connections:
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
                                                  && targetPipe[c.removeIf] === false ) {
                                removePermission = false;
                                return;
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
                // Add
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
            }); // each connections

            // Flow children,  if any:
            if (this.childPipelines.length > 0){
                _.each(this.childPipelines, function(childPipe){
                    childPipe.flow(reverse);
                });
            }

        },
        this.flowUp = function() {
            this.flow(true); 
        },
        this.flowDown = function(){
            this.flow(); 
        },
        this.runCommand = function execute(commandName, reverse){
            // * refactor me *
            reverse = typeof reverse !== 'undefined' ? reverse : false;
            var
                that = this,
                totalDelay = 0,
                i = 0,
                feed = null,
                feeds = null,
                commands = this.commands[commandName],
                targets = null,
                targetPipeName = null,
                pipeLocation = null;
            if (reverse){
                var commandList = this.getReverseCommands(commandName);
            } else {
                var commandList = commands.commands;
            }

            function run(){
                // todo: Refactor this. Its way too long.
                var added = false;
                i += 1;
                var allUntilsMet = 1;
                if (i > 200){
                    console.log("exiting ... ");
                    return;
                }
                if (reverse) {
                    // todo: be able to reverse a command.
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
                console.log(pipe);
            });
        },
        this.addPipes = function(collections) {
            var that = this;
            _.each(collections, function(c) {
                that.pipes[c.name] = c.collection;
            })
        },
        this.populateChildDirectors = function(sourcePipe, targetChildPipeName){
            // Hard code source and target pipes to be the 0th index for now
            // Send data to child pipes until they are full
            var 
                sourcepipename = this.pipeConnections[0]
            ,   sourcePipe = this.pipes[sourcepipename]
            ,   childrenNotFull = true
            ,   sourceHasData = true;
            // Two ways I could do this.
            // A.)  Loop through children and pull
            //      from source as needed.
            // B.)  Loop through source data and push
            //      to children. 
            // [A] implementation:
            while (childrenNotFull && sourceHasData){
                var unfullCount = 0;
                _.each(this.childPipelines, function(childPipeline){
                    var targetPipeName = childPipeline.pipeConnections[0];
                    var targetPipe = childPipeline.pipes[targetPipeName];
                    if ( !targetPipe.isFull ){ 
                        // increment
                        unfullcount+=1;
                        if (sourcePipe.length > 0){ 
                            // Add from bottom of source to top of child:
                            var s = sourcePipe.shift();
                            targetPipe.push(s);
                        } else {
                            sourceHasData = false;
                        }
                    }
                });
                if (unfullCount === 0){
                    childrenNotFull = false;
                }
            } 
        },
        this.pipeFetch = function(pipeName, callback){
            pipe = this.pipes[pipeName];
            pipe.fetch({
                success: function(collection, response, options){
                    callback(collection, response, options);
                }
            });
        },
        this.onScroll = function(){
            var st = $(window).scrollTop();
            if (st > lastScrollTop) {
                that.onScrollDown();
            } else if(st < lastScrollTop) { 
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

    return SS;
}(SS || {}, jQuery, _ ));

    
