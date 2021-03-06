
import React, { Component } from 'react';
import {Button} from 'reactstrap';
import { select } from 'd3-selection';
import './AcyclicGraph.css';
import * as d3 from "d3";

function px(node) {
    return node.depth * 90;
}

function py(node) {
    return node.offset * 60 + 250;
}

function computeDepthAndOffset(node, levels) {
    if (node.depth) {
        return
    }

    let depth = 0;
    for (let child of node.inputs) {
        computeDepthAndOffset(child, levels);
        if (depth < child.depth) {
            depth = child.depth;
        }
    }
    depth += 1;
    /*node.depth = depth;
    return;*/

    if (!levels[depth]) {
        levels[depth] = {}
    }
    let level = levels[depth];
    let shift = 0;
    let offset;
    let found = false;

    while(!found) {
        if (node.inputs.length > 0) {
            for (let n of node.inputs) {
                if (!level[n.offset + shift]) {
                    offset = n.offset + shift;
                    found = true;
                    break;
                }
                if (!level[n.offset - shift]) {
                    offset = n.offset - shift;
                    found = true;
                    break;
                }
            }
        } else {
            if (!level[shift]) {
                offset = shift;
                found = true;
                break;
            }
            /*if (!level[-shift]) {
                offset = -shift;
                found = true;
                break;
            }*/
        }
        shift += 1;
    }

    level[offset] = true;
    node.depth = depth;
    node.offset = offset;
}

class AcyclicGraph extends Component {

    constructor(props) {
        super(props)

        this.nodes = [];
        this.levels = [];
        this.links = [];
    }

    updateNode(key, new_node, do_effect) {
        let node = select("#" + key);
        node.attr("fill", new_node.fill);
        node.attr("stroke", new_node.stroke);
        // This is not bug, for text we use "stroke" color to "fill"
        node.select("text").attr("fill", new_node.stroke);

        if (do_effect) {
            let effect = node.append("circle");
            effect.attr("fill", "none")
            effect.attr("r", 0)
            effect.transition(1500).attr("r", 30).remove();
        }
    }

    addNodes(nodes) {
        for (let node of nodes) {
            computeDepthAndOffset(node, this.levels);
        }
        for (let n of nodes) {
            for(let n2 of n.inputs) {
                this.links.push({from: n2, to: n});
            }
        }
        this.nodes = this.nodes.concat(nodes);
        this.reset();
        this.drawGraph();
    }

    reset() {
        let minX = d3.min(this.nodes, n => px(n));
        let maxX = d3.max(this.nodes, n => px(n));
        let minY = d3.min(this.nodes, n => py(n));
        let maxY = d3.max(this.nodes, n => py(n));

        let svg = select(this.ref);
        let width = +svg.attr("width");
        let height = +svg.attr("height");

        this.x = d3.scaleLinear().domain([minX - 50, maxX + 50]).range([0, width]);
        this.y = d3.scaleLinear().domain([minY - 50, maxY + 50]).range([0, height]);
    }

    updatePositions() {
        let svg = select(this.ref);

        let tx = n => this.x(px(n));
        let ty = n => this.y(py(n));

        svg.selectAll(".node")
            .transition()
            .attr("transform", n => "translate(" + tx(n) + "," + ty(n) + ")")

        svg.selectAll(".link")
            .transition()
            .attr("d", ldata => {
                    let x1 = tx(ldata.from);
                    let y1 = ty(ldata.from);
                    let x2 = tx(ldata.to);
                    let y2 = ty(ldata.to);
                    return "M" + x1 + "," + y1
                        + "C" + (x1 + x2) / 2 + "," + y1
                        + " " + (x1 + x2) / 2 + "," + y2
                        + " " + x2 + "," + y2;
                });
    }

    drawGraph() {
        let svg = select(this.ref);

        let x = this.x;
        let y = this.y;
        let tx = n => x(px(n));
        let ty = n => y(py(n));

        svg.selectAll(".link")
            .data(this.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", ldata => {
                    let x1 = tx(ldata.from);
                    let y1 = ty(ldata.from);
                    let x2 = tx(ldata.from);
                    let y2 = ty(ldata.from);
                    return "M" + x1 + "," + y1
                        + "C" + (x1 + x2) / 2 + "," + y1
                        + " " + (x1 + x2) / 2 + "," + y2
                        + " " + x2 + "," + y2;
                });


        let nodes = svg.selectAll(".node")
            .data(this.nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("id", n => n.id)
            .attr("transform", n => "translate(" + tx(n) + "," + ty(n) + ")")
            .attr("fill", n => n.fill)
            .attr("stroke", n => n.stroke);

        nodes.append("text")
            .text(n => n.label)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "bottom")
            .attr("fill", n => n.stroke)
            .attr("class", "ntext");

        nodes.append("text")
            .text(n => n.label2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "top")
            .attr("class", "ntext2");

        nodes.filter(n => n.type === "box")
                .append("rect")
                .attr("class", "fig")
                .attr("x", -6)
                .attr("y", -6)
                .attr("width", 12)
                .attr("height", 12)

        nodes.filter(n => n.type === "circle")
                .append("circle")
                .attr("class", "fig")
                .attr("r", 6)

        this.updatePositions();
    }

    componentDidMount() {
        let svg = select(this.ref);

        let brush = d3.brush().on("end", () => {
            if (!d3.event.sourceEvent) return;
            let s = d3.event.selection;
            if (s) {
                this.x.domain([s[0][0], s[1][0]].map(this.x.invert, this.x));
                this.y.domain([s[0][1], s[1][1]].map(this.y.invert, this.y));
                this.updatePositions();
                svg.select("#brush").call(brush.move, null);
            }
        });

        svg.append("g")
            .attr("id", "brush")
            .call(brush);

        this.drawGraph();
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div>
            <svg style={{"border": "1px solid black"}} ref={r => this.ref = r} width="700" height="700"/>
            <br/><Button onClick={() => {this.reset(); this.updatePositions();}}>Reset zoom</Button>
            </div>
        );
    }
}

export default AcyclicGraph;
