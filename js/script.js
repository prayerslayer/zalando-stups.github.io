$( document ).ready( function() {
    $( '[data-width="full"]' ).css({
        width: $(window).width()
    });
});

var yamlData,
    timeout = false;

(function(_, yml, d3) {
    d3.ns.prefix.xlink = 'http://www.w3.org/1999/xlink';

    yml.load( '/bubbles.yml', render );

    function preprocessLinks( data ) {
        return _.map( data.node_links, function( link ) {
            return {
                source: _.findIndex( data.nodes, { id: link.source }),
                target: _.findIndex( data.nodes, { id: link.target }),
                href: link.href
            };
        });
    }

    function render( data ) {
        if ( !data.links ) {
            yamlData = data;
        }
        data.links = preprocessLinks( data );
        console.log( data );
        data.config = data.config || {};

        var WIDTH = $( window ).width(),
            HEIGHT = data.config.height || 600,
            color = d3.scale.category10();

        var force = d3.layout.force()
                        .size([ WIDTH, HEIGHT ])
                        .linkDistance( data.config.linkDistance || 120 )
                        .linkStrength( data.config.linkStrength || 0.1 )
                        .friction( data.config.friction || 0.9 )
                        .charge( data.config.charge || -30 )
                        .gravity( data.config.gravity || 0.1 )
                        .theta( data.config.theta || 0.8 )
                        .alpha( data.config.alpha || 0.1 )
                        .nodes( data.nodes )
                        .links( data.links )
                        .start();

        d3.select( '#graph' )
            .select( 'svg' )
            .remove();
        var svg = d3.select( '#graph' )
                    .append( 'svg' )
                        .attr( 'xmlns', 'http://www.w3.org/2000/svg')
                        .attr( 'class', 'graph')
                        .attr( 'width', WIDTH )
                        .attr( 'height', HEIGHT );

        var link = svg.selectAll( '.link' )
                    .data( data.links )
                    .enter()
                        .append( 'a' )
                            .attr( 'xlink:href', function( d ) { return d.href; })
                            .append( 'line' )
                                .attr( 'data-has-href', function(d) { return !!d.href; })
                                .attr( 'class', 'link' );

        var infobox = svg
                        .append( 'g' )
                        .attr( 'class', 'infobox' )
                        .attr( 'transform', 'translate(10,10)' );

        infobox
            .append( 'rect' )
            .attr( 'rx', 2 )
            .attr( 'ry', 2 )
            .attr( 'x', 0 )
            .attr( 'y', 0 )
            .attr( 'width', 200 )
            .attr( 'height', 100 );

        var infoHeadline = infobox
                            .append( 'text' )
                            .attr( 'class', 'infobox-headline')
                            .attr( 'transform', 'translate(10, 20)' )
                            .text( 'Project' );

        var infoLinkWrapper = infobox
                            .append( 'a' )
                            .attr( 'target', '_blank' )
                            .attr( 'xlink:href', 'http://reddit.com' );
        var infoLink = infoLinkWrapper
                            .append( 'text' )
                            .attr( 'class', 'infobox-link' )
                            .attr( 'transform', 'translate( 10, 40 )' )
                            .text( 'Link' );

        var infoDesc = infobox
                            .append( 'text' )
                            .attr( 'class', 'infobox-desc' )
                            .attr( 'transform', 'translate(10, 70)' )
                            .text( 'Description' );
            

        var node = svg.selectAll( '.node' )
                    .data( data.nodes )
                    .enter()
                        .append( 'g' )
                        .call( force.drag )
                        .attr( 'class', 'node' );

        node
        .on( 'mouseover', function(d) {
            infoDesc.text( d.aka );
            infoHeadline.text( d.name );
            infoLink.text( d.href ? 'Link' : '' )
            infoLinkWrapper.attr( 'xlink:href', d.href );
        });

        node.append( 'circle')
            .attr( 'fill', function( d ) { return color( d.type ); })
            .attr( 'r', 30 );
        node.append( 'a' )
            .attr( 'target', '_blank' )
            .attr( 'xlink:href', function( d ) { return d.href; })
            .append( 'text' )
                .text( function( d ) { return d.name; });

        force.on( 'tick', function() {
            link.attr('x1', function(d) { return d.source.x; })
                .attr('y1', function(d) { return d.source.y; })
                .attr('x2', function(d) { return d.target.x; })
                .attr('y2', function(d) { return d.target.y; });

            node.attr( 'transform', function( d ) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
        });
    }

    $( window ).resize( function() {
        $( "svg" ).children().remove();
        
        if ( timeout ) {
            clearTimeout( timeout );
            timeout = false;
        }
        timeout = setTimeout( function() {
            (function() {
                console.log( 'rerender!', $(window).width() );
                render( yamlData );
            })();
        }, 100 );
    });

})( _, YAML, d3 );