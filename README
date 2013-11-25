sidestroke
==========

A javascript data pipeline for websites that experience a high rate of data consumption.

About:
If you know in advance what data the client will request then you could speed up the
display of such data by requesting it in advance and storing the data in a collection 
in the browser and then rendering to the client from your browser instead of the server.

A typical scenario may be one where a user is scrolling through photos. Sending AJAX 
requests to the server is slow and as the user asks for the items, they will incur latency
from both the initial AJAX request as well as the time it takes for the client to request
the image data once the img tag has been rendered to their page. The idea behind sidestroke is
to eliminate that latency and narrow the bottleneck to just the client.

How:
My solution was to store data on the client in various arrays and connect them like one would
connect pipes for water or gas. When the arrays (pipes) flow downward the pipeline simply
shifts the bottom-most element and pushes onto the downstream connected pipe. The downstream
pipe in turn does the same and so on. Flow can be reversed and data can travel back up to 
the source pipe.

The various pipes would each serve a different function. The source pipe is responsible for 
talking to the server and requesting more data if its length/size drops below a configurable level. 
The second pipe could be used to pre-render data off screen on the client. When data enters a
third pipe, one could use javascript to render its contents to the client window. One could have
multiple pipes that render in the client window but they could render to different html templates
allowing you to achieve a complex display of data as your objects pass through various stages 
in your application.

I made this for use with Backbone and there is a minimal dependency on underscore at the moment.
But the methods used are generic enough that it could be rewritten to vanilla javascript with
minimal effort.

I wanted to make an awesome demo for this but I am in a time crunch at the moment. 
For now, see redditscroller.com for an example of it in use.



