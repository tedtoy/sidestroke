

/*
 *  Extend module with objects ready to be used by the 
 *  pipeline directors.
 *
 *
 **/ 
/*
    var SS = (function(Backbone, _){

        SS.something = 

    }(Backbone, _))

    // - Eh, maybe this doesn't have to extend SS. Just create new Backbone objects for now.

*/


/*
 * Backbone objects.
 *
 *
 */
var ActorBaseModel = Backbone.Model.extend({
    /* The abstract model for a data-object which gets rendered 
     * to the screen upon scrolling. Functionality includes the
     * ability to be pre-rendered off screen and the ability to 
     * disappear off screen via a shrinking animation that pulls 
     * following objects towards this datum's point of 
     * disappearance on the horizon.
     */

    // The backbone view associated with this model:
    actorview: null,

    // remove
    removeView: function(){
        this.actorview.shrink();
    },

    /* Abstract method responsible for rendering the view to 
     * stage and associating the view with the model.
     */
    addView: function(){
        /* Example of usage:
         * <code> this.actorview = new __Name_Of_View_Here__({ model: this}); </code>
         */
    },
});


var ActorBaseView = Backbone.Model.extend({
    /* Abstract view for a datum object
     */

    initialize: function(){
        this.listenTo(this.model, 'change', this.render);
    },
    render: function(){
        if (this.model.get('hideView')){
            this.remove();
        }
        this.$el.html(this.template(this.model.toJSON()));
    },
    close: function(){
        this.remove();
        this.unbind();
    },
    shrink: function(direction){
        var that = this;
        var el = $(this.el).find(".actor-view:first");
        if (direction === 'horizontal'){
            $(el).animate({ width: "0px" }, 500, 'easeOutQuart', function(){
                that.close();
            });
        }
    },

});





var Pipe = Backbone.Collection.extend({
    model: undefined,
    url: '',
    isFull: false,
    initialize: function(m){
        this.model = m;
    },

    checkFullness: function(){
        if (typeof this.fullAt !== 'undefined' && this.fullAt > 0 ){
            if ( this.length >= this.fullAt ) {
                this.isFull = true;
            } else {
                this.isFull = false;
            }
        }
    },

});

